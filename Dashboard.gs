/**
 * Leadership dashboard.
 *
 * Rebuilds the Dashboard sheet from Attempts, Answers and Roster. Read-only
 * against the data sheets: it only ever writes to Dashboard, so a bad run
 * cannot damage the training records.
 *
 * buildDashboard() is safe to run any time and takes no arguments. It is the
 * one function here that writes, and it writes only to Dashboard.
 *
 * Reporting is per course. A single blended completion number across three
 * courses would hide exactly the thing you need to see, which is which course
 * people are not doing.
 */

/**
 * Column layout of the Answers sheet. Mirrors SHEET_SPEC in Setup.gs and the
 * rows written by recordAttempt in Code.gs. Change one, change all three.
 */
var ANSWERS_COL = {
  recorded: 0, email: 1, course: 2, version: 3, attempt: 4,
  section: 5, questionId: 6, question: 7, answer: 8, outcome: 9
};
var ANSWERS_WIDTH = 10;

function buildDashboard() {
  var ss = getResultsSheet_();
  var sheet = ss.getSheetByName('Dashboard');
  if (!sheet) throw new Error('Dashboard sheet missing. Run RUN_SETUP_FOR_REAL() first.');

  // One read per sheet, then everything below works from the rows in memory.
  // This job runs nightly against every course, and missedQuestions_ used to
  // re-read the whole Answers sheet once per course. Answers grows by about
  // nineteen rows per attempt, so that was the part most likely to walk into the
  // six-minute execution limit first.
  var rosterRows = sheetRows_(ss, 'Roster', ROSTER_WIDTH);
  var attemptRows = sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH);
  var answerRows = sheetRows_(ss, 'Answers', ANSWERS_WIDTH);

  var roster = readRoster_(ss, rosterRows);
  var attempts = readAttempts_(ss, attemptRows);
  var passed = passedByCourse_(ss, attemptRows);
  var courseIds = Object.keys(allCourses_());

  // Only people this platform is actually responsible for. EOA addresses are
  // redirected elsewhere, so counting them as outstanding would be wrong.
  var ours = roster.filter(function (p) { return courseIdsFor_(p.email).length > 0; });

  var fullyDone = ours.filter(function (p) {
    return courseIdsFor_(p.email).every(function (id) {
      return passed[id] && passed[id][String(p.email).toLowerCase()];
    });
  }).length;

  var rows = [
    ['Report generated', new Date()],
    ['Courses on this platform', courseIds.length],
    ['', ''],
    ['PEOPLE', ''],
    ['On roster and served by this platform', ours.length || 'no roster loaded yet'],
    ['Up to date on everything assigned', ours.length ? fullyDone : 'n/a'],
    ['Something still outstanding', ours.length ? (ours.length - fullyDone) : 'n/a']
  ];

  courseIds.forEach(function (id) {
    var course = getCourse_(id);
    // Every attempt at this course, whatever version it was sat on, to match
    // the admin dashboard. "People passed" already counts any pass inside the
    // recertification window, so scoping the attempt figures beside it to the
    // current version made the two halves of the same block disagree.
    var mine = attempts.filter(function (a) { return a.course === id; });
    var eligible = ours.filter(function (p) { return courseIdsFor_(p.email).indexOf(id) > -1; });
    var done = eligible.filter(function (p) {
      return passed[id] && passed[id][String(p.email).toLowerCase()];
    }).length;
    var distinctPassed = passed[id] ? Object.keys(passed[id]).length : 0;

    var avg = mine.length
      ? Math.round(mine.reduce(function (s, a) { return s + a.percent; }, 0) / mine.length) : 0;
    var median = medianMinutes_(mine);

    rows.push(['', '']);
    rows.push([course.title.toUpperCase() + ' (v' + course.version + ')', '']);
    rows.push(['  People passed', distinctPassed]);
    rows.push(['  Assigned this course', eligible.length || 'no roster loaded yet']);
    rows.push(['  Completed against roster', eligible.length ? done : 'n/a']);
    rows.push(['  Outstanding', eligible.length ? (eligible.length - done) : 'n/a']);
    rows.push(['  Completion rate', eligible.length
      ? Math.round((done / eligible.length) * 100) + '%'
      : 'n/a, load the staff list with refreshRoster(true)']);
    rows.push(['  Attempts recorded', mine.length]);
    rows.push(['  Average score', avg + '%']);
    rows.push(['  Passed on first attempt', firstAttemptPassRate_(mine) + '%']);
    rows.push(['  Median time taken', median ? median + ' min' : 'n/a']);

    var missed = missedQuestions_(ss, id, course.version, answerRows).slice(0, 5);
    if (missed.length) {
      rows.push(['  Most-missed questions', 'Wrong answers']);
      missed.forEach(function (q) {
        rows.push(['    ' + q.label, q.wrong + ' of ' + q.seen +
          ' (' + Math.round((q.wrong / q.seen) * 100) + '%)']);
      });
    }
  });

  rows.push(['', '']);
  rows.push(['BY SCHOOL', 'Up to date on everything assigned']);
  byGroup_(ours, passed, 'unit').forEach(function (r) { rows.push(r); });

  sheet.clear();                                    // Dashboard only, never the data sheets
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange(1, 1, rows.length, 2).setFontFamily('Arial');

  // Headings are the rows with no leading spaces and an empty or label second
  // column. Bolding them is what makes a long single-column report scannable.
  var headings = ['PEOPLE', 'BY SCHOOL'];
  Object.keys(allCourses_()).forEach(function (id) {
    headings.push(getCourse_(id).title.toUpperCase() + ' (v' + getCourse_(id).version + ')');
  });
  for (var i = 0; i < rows.length; i++) {
    if (headings.indexOf(rows[i][0]) > -1) {
      sheet.getRange(i + 1, 1, 1, 2).setFontWeight('bold').setFontColor(ORG.brand.maroon);
    }
  }
  sheet.setColumnWidth(1, 360);
  sheet.setColumnWidth(2, 220);

  log_(ss, 'buildDashboard', Session.getEffectiveUser().getEmail(),
    ours.length ? (fullyDone + '/' + ours.length + ' fully up to date across ' + courseIds.length + ' courses')
                : ('no roster; ' + attempts.length + ' attempts recorded'));

  // Every other entry point in this project logs its result. This one used to
  // only return it, which in the editor looks identical to having done nothing.
  var out = 'Dashboard rebuilt. Open the Dashboard tab of the results workbook to read it.\n\n' +
    (ours.length
      ? fullyDone + ' of ' + ours.length + ' people are up to date on everything assigned to them.'
      : attempts.length + ' attempts recorded. Load the staff list with refreshRoster(true) to see ' +
        'completion as a percentage.') + '\n\n' +
    'Rows written: ' + rows.length + '\n' +
    'Courses reported: ' + courseIds.length + '\n' +
    'Attempt records read: ' + attempts.length + '\n' +
    'Roster rows read: ' + roster.length + ', of whom served by this platform: ' + ours.length + '\n' +
    'Workbook: ' + ss.getUrl();
  Logger.log(out);
  return out;
}

/**
 * Called by the nightly trigger.
 *
 * Refreshes the roster first, because group membership changes daily and a
 * dashboard built on yesterday's roster reports completion against the wrong
 * denominator. refreshRoster returns a message rather than throwing when its
 * scope is missing, so the dashboard is still built either way.
 */
function nightlyDashboardJob() {
  // Access first. Someone who has left should stop being able to open the
  // dashboard, and this is the only thing that runs on a schedule.
  var adminResult;
  try {
    adminResult = syncAdminsWithDirectory(true);
  } catch (e) {
    adminResult = 'Administrator check failed: ' + e.message;
    Logger.log(adminResult);
  }

  var rosterResult;
  try {
    rosterResult = refreshRoster(true);
  } catch (e) {
    rosterResult = 'Roster refresh failed, dashboard built on the existing roster: ' + e.message;
    Logger.log(rosterResult);
  }
  return buildDashboard() +
    '\n\n--- roster ---\n' + rosterResult +
    '\n\n--- administrators ---\n' + adminResult;
}

/**
 * @param {Spreadsheet} ss
 * @param {Array=} rows  Attempts rows already read by the caller. Optional, and
 *   when it is left out this reads them itself, so every existing caller is
 *   unaffected. Passing them in is what lets one request read the sheet once
 *   instead of once per function that wants it.
 */
function readAttempts_(ss, rows) {
  return (rows || sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH)).map(function (r) {
    return {
      email: String(r[ATTEMPTS_COL.email]).toLowerCase(),
      unit: r[ATTEMPTS_COL.unit],
      course: String(r[ATTEMPTS_COL.course]),
      version: String(r[ATTEMPTS_COL.version]),
      attempt: Number(r[ATTEMPTS_COL.attempt]) || 0,
      percent: Number(r[ATTEMPTS_COL.percent]) || 0,
      result: String(r[ATTEMPTS_COL.result]),
      minutes: Number(r[ATTEMPTS_COL.minutes]) || 0
    };
  });
}

/**
 * Group people by a roster field and count how many are up to date on
 * everything assigned to them, which is the only completion number that means
 * anything once there is more than one course.
 */
function byGroup_(people, passed, field) {
  var groups = {};
  people.forEach(function (p) {
    var k = p[field] || '(not set)';
    groups[k] = groups[k] || { total: 0, done: 0 };
    groups[k].total++;
    var allDone = courseIdsFor_(p.email).every(function (id) {
      return passed[id] && passed[id][String(p.email).toLowerCase()];
    });
    if (allDone) groups[k].done++;
  });
  return Object.keys(groups).sort().map(function (k) {
    var g = groups[k];
    return [k, g.done + ' of ' + g.total + ' (' + Math.round((g.done / g.total) * 100) + '%)'];
  });
}

function firstAttemptPassRate_(attempts) {
  var firsts = attempts.filter(function (a) { return a.attempt === 1; });
  if (!firsts.length) return 0;
  var p = firsts.filter(function (a) { return a.result === 'PASS'; }).length;
  return Math.round((p / firsts.length) * 100);
}

function medianMinutes_(attempts) {
  var m = attempts.map(function (a) { return a.minutes; })
    .filter(function (n) { return n > 0; })
    .sort(function (a, b) { return a - b; });
  if (!m.length) return 0;
  var mid = Math.floor(m.length / 2);
  return m.length % 2 ? m[mid] : Math.round((m[mid - 1] + m[mid]) / 2);
}

/**
 * Which questions people actually get wrong. This is what tells you what to re-teach.
 *
 * @param {Array=} rows  Answers rows already read by the caller, as above.
 */
function missedQuestions_(ss, courseId, version, rows) {
  var data = rows || sheetRows_(ss, 'Answers', ANSWERS_WIDTH);
  if (!data.length) return [];
  var tally = {};
  data.forEach(function (r) {
    if (String(r[ANSWERS_COL.course]) !== String(courseId)) return;
    if (!sameVersion_(r[ANSWERS_COL.version], version)) return;
    var id = String(r[ANSWERS_COL.questionId]);
    var text = r[ANSWERS_COL.question]
      ? String(r[ANSWERS_COL.question])
      : String(r[ANSWERS_COL.section]) + ', ' + id;
    // The course is prefixed rather than truncated with the text, so it
    // survives on every row. The Dashboard sheet lists all three courses in one
    // column, where an unlabelled question is impossible to place.
    // Trimmed back to a word boundary, never mid-word. No course label: the
    // admin panel is already filtered to one course, and in the Dashboard sheet
    // these rows sit under that course's own heading.
    var label = text.length > 90
      ? text.substring(0, 89).replace(/\s+\S*$/, '') + '…'
      : text;
    tally[id] = tally[id] || { label: label, seen: 0, wrong: 0 };
    tally[id].seen++;
    if (String(r[ANSWERS_COL.outcome]) === 'Incorrect') tally[id].wrong++;
  });
  return Object.keys(tally).map(function (k) { return tally[k]; })
    .filter(function (q) { return q.seen > 0; })
    .sort(function (a, b) { return (b.wrong / b.seen) - (a.wrong / a.seen); });
}
