/**
 * Admin dashboard, server side.
 *
 * Read-only. Nothing in this file writes to any sheet, so opening the
 * dashboard can never affect the training records.
 *
 * Access is controlled by the ADMIN_EMAILS script property (comma-separated).
 * If that property is unset, only the script owner can see it, which is the
 * safe default on day one.
 */

var PROP_ADMINS = 'ADMIN_EMAILS';

/** The script owner, who always has every capability and cannot be removed. */
function ownerEmail_() {
  try { return String(Session.getEffectiveUser().getEmail() || '').toLowerCase(); }
  catch (e) { return ''; }
}

/**
 * Everyone on the Admins sheet, as { email, firstName, lastName, role, status, ... }.
 *
 * Returns null, not an empty list, when the sheet cannot be read at all. The
 * difference matters: an unreadable sheet must fall back to the script property
 * so a broken workbook cannot lock every admin out of the dashboard, whereas a
 * sheet that genuinely holds no rows should be trusted.
 */
var ADMIN_ROWS_ = undefined;      // undefined = not read yet, null = unreadable

/** readAdmins_ memoised for this execution. Cleared after any write. */
function adminRows_(ss) {
  if (ADMIN_ROWS_ === undefined) ADMIN_ROWS_ = readAdmins_(ss);
  return ADMIN_ROWS_;
}
function clearAdminRows_() { ADMIN_ROWS_ = undefined; }

function readAdmins_(ss) {
  try {
    var sheet = (ss || getResultsSheet_()).getSheetByName('Admins');
    if (!sheet) return null;
    if (sheet.getLastRow() < 2) return [];
    return sheet.getRange(2, 1, sheet.getLastRow() - 1, ADMINS_WIDTH).getValues()
      .filter(function (r) { return String(r[ADMINS_COL.email] || '').trim(); })
      .map(function (r) {
        return {
          email: String(r[ADMINS_COL.email]).trim().toLowerCase(),
          firstName: String(r[ADMINS_COL.firstName] || '').trim(),
          lastName: String(r[ADMINS_COL.lastName] || '').trim(),
          role: String(r[ADMINS_COL.role] || DEFAULT_ROLE).trim() || DEFAULT_ROLE,
          status: String(r[ADMINS_COL.status] || 'Active').trim(),
          addedBy: String(r[ADMINS_COL.addedBy] || '').trim(),
          addedOn: r[ADMINS_COL.addedOn] || '',
          removedOn: r[ADMINS_COL.removedOn] || ''
        };
      });
  } catch (e) {
    Logger.log('readAdmins_ could not read the Admins sheet: ' + e);
    return null;
  }
}

/** Addresses from the legacy ADMIN_EMAILS script property. */
function legacyAdminList_() {
  return scriptProp_(PROP_ADMINS).split(',')
    .map(function (x) { return x.trim().toLowerCase(); })
    .filter(String);
}

/**
 * The role this person holds, or '' if none.
 *
 * Order matters. The owner wins outright. Then the sheet, which is the real
 * source of truth. The script property is consulted only when the sheet is
 * unreadable or has not been seeded yet, so the old configuration keeps working
 * through the changeover and during a workbook problem.
 */
function roleOf_(email) {
  var who = String(email || '').trim().toLowerCase();
  if (!who) return '';
  if (who === ownerEmail_()) return 'owner';

  var rows = adminRows_();
  if (rows && rows.length) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].email === who && rows[i].status !== 'Removed') {
        return ROLES[rows[i].role] ? rows[i].role : DEFAULT_ROLE;
      }
    }
    // The sheet is readable and populated, so it is the answer. Someone removed
    // from it must not come back through the script property or the seed list.
    return '';
  }

  // No sheet, or a sheet with no rows yet: this deployment has not been migrated.
  // Fall back to BOTH the old script property and the seed list, or the first
  // person to open the dashboard is refused and the sheet is never seeded,
  // which locks everyone except the script owner out permanently.
  var bootstrap = legacyAdminList_().concat(
    (typeof SEED_ADMINS !== 'undefined' ? SEED_ADMINS : [])
      .map(function (e) { return String(e || '').trim().toLowerCase(); })
  );
  return bootstrap.indexOf(who) > -1 ? DEFAULT_ROLE : '';
}

/**
 * Can this person do this thing?
 *
 * Every access check in the project goes through here rather than asking whether
 * someone is an admin. When the course-administrator role is switched on, the
 * only change needed is in ROLES.
 */
function can_(email, capability) {
  var role = roleOf_(email);
  if (!role || !ROLES[role]) return false;
  return ROLES[role].can.indexOf(capability) > -1;
}

/** Kept as a thin alias so existing call sites keep working. */
function isAdmin_(email) {
  return can_(email, 'viewDashboard');
}

/**
 * Everything the dashboard renders, for EVERY course, in one call.
 *
 * Figures are still per course, because a blended number across three courses
 * hides which course people are not doing. What changed is when they are
 * computed: all of them, once, from the rows this call has already read, rather
 * than one course per round trip.
 *
 * The reason is that switching tabs was costing a full server execution to
 * change a filter. Opening the workbook, reading three sheets and handing the
 * result back through google.script.run is a few seconds however little work
 * sits in the middle, and none of the underlying data had changed between one
 * tab and the next. Computing the other two courses while the rows are already
 * in memory is close to free, so the page can switch instantly and the cost
 * lands once, on load, where it is expected.
 *
 * The selected course's figures are ALSO returned at the top level, exactly as
 * before, so nothing that reads this payload has to change at once.
 *
 * @param {string=} courseId  Defaults to the first registered course.
 * @return {Object}
 */
function getAdminData(courseId) {
  var me = getActiveEmail_();
  if (!isAdmin_(me)) {
    throw new Error('You do not have access to this dashboard. If you should, ask IT to add ' +
      (me || 'your address') + ' to the ADMIN_EMAILS script property.');
  }

  var catalogue = Object.keys(allCourses_()).map(function (id) {
    var c = getCourse_(id);
    return { id: c.id, title: c.title, version: c.version, updated: c.updated || '' };
  });
  if (!catalogue.length) {
    throw new Error('No courses are registered, which means a course file failed to load. ' +
      'Check the Apps Script execution log.');
  }

  var selected = courseId && allCourses_()[courseId] ? courseId : catalogue[0].id;
  var course = getCourse_(selected);

  // Each sheet is read ONCE and the raw rows are passed down. Before this, a
  // single dashboard load read Attempts three times (attempts, passes, recent),
  // Roster twice (roster, leavers) and Answers once, as six separate round trips
  // to Sheets, each one growing with the sheet. Nothing below computes anything
  // differently, it just stops asking for the same blocks repeatedly.
  var ss = getResultsSheet_();
  var attemptRows = sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH);
  var rosterRows = sheetRows_(ss, 'Roster', ROSTER_WIDTH);
  var answerRows = sheetRows_(ss, 'Answers', ANSWERS_WIDTH);

  var attempts = readAttempts_(ss, attemptRows);
  var roster = readRoster_(ss, rosterRows);
  var passed = passedByCourse_(ss, attemptRows);

  // Built once and handed to every course, rather than rebuilt per course.
  var leftMap = leaversByEmail_(ss, rosterRows);

  // Each person's entitlement is resolved once here, not once per course. The
  // roster is 1600 rows and this used to run inside a filter, per course.
  var eligibleByCourse = {};
  catalogue.forEach(function (c) { eligibleByCourse[c.id] = []; });
  roster.forEach(function (p) {
    courseIdsFor_(p.email).forEach(function (id) {
      if (eligibleByCourse[id]) eligibleByCourse[id].push(p);
    });
  });

  var byCourse = {};
  catalogue.forEach(function (c) {
    byCourse[c.id] = courseFigures_(c.id, {
      attempts: attempts, roster: roster, passed: passed,
      eligible: eligibleByCourse[c.id], answerRows: answerRows,
      attemptRows: attemptRows, leftMap: leftMap, ss: ss
    });
  });

  var shared = {
    courses: catalogue,
    selected: selected,
    generated: new Date().toISOString(),
    byCourse: byCourse,
    sheetUrl: ss.getUrl(),
    // Absolute, because the admin page renders inside a sandboxed iframe on
    // googleusercontent.com. A relative href there resolves against the sandbox
    // origin and lands on userCodeAppPanel, which goes nowhere.
    webAppUrl: getWebAppUrl_(),
    // The rail footer offers help the same way every other page does, rather
    // than inventing a third route for admins.
    supportRequestUrl: (ORG.links && ORG.links.supportRequest) || '',
    supportEmail: supportEmail_(),
    viewer: me,
    viewerRole: roleOf_(me),
    // The rail only offers what this person can actually do, so nobody is shown
    // a control that will refuse them.
    canManageAdmins: can_(me, 'manageAdmins'),
    canManageCourses: can_(me, 'manageCourses')
  };

  // The selected course flattened onto the top level, which is the shape this
  // payload has always had.
  Object.keys(byCourse[selected]).forEach(function (k) { shared[k] = byCourse[selected][k]; });
  return shared;
}

/**
 * Every figure the dashboard shows for ONE course, computed from data already
 * in memory. Reads no sheets: everything it needs is passed in.
 *
 * @param {string} id
 * @param {Object} d  attempts, roster, passed, eligible, answerRows, attemptRows, leftMap, ss
 */
function courseFigures_(id, d) {
  var course = getCourse_(id);

  // Every attempt at this course, whatever version it was sat on. The figures
  // above the table describe compliance, and compliance does not reset because
  // the content was edited. Scoping these to the current version also made
  // "People passed" disagree with the table below it, which lists every
  // attempt, and a page that contradicts itself is worse than a stale number.
  var mine = d.attempts.filter(function (a) { return a.course === id; });

  // Distinct people, not attempts. One person retaking three times is still
  // one person.
  var attemptedBy = {};
  mine.forEach(function (a) { attemptedBy[a.email] = true; });
  var peopleAttempted = Object.keys(attemptedBy).length;
  var peoplePassed = d.passed[id] ? Object.keys(d.passed[id]).length : 0;

  var avg = mine.length
    ? Math.round(mine.reduce(function (s, a) { return s + a.percent; }, 0) / mine.length) : 0;

  var firsts = mine.filter(function (a) { return a.attempt === 1; });
  var firstPass = firsts.length
    ? Math.round((firsts.filter(function (a) { return a.result === 'PASS'; }).length / firsts.length) * 100) : 0;

  // Roster is optional. On day one there isn't one, and the dashboard still
  // has to be useful. Only people actually assigned this course are counted:
  // EOA addresses are redirected elsewhere and are not this platform's to chase.
  var eligible = d.eligible || [];
  var hasRoster = eligible.length > 0;
  var rosterStats = null;
  if (hasRoster) {
    var done = eligible.filter(function (p) {
      return d.passed[id] && d.passed[id][String(p.email).toLowerCase()];
    }).length;
    rosterStats = {
      total: eligible.length,
      completed: done,
      outstanding: eligible.length - done,
      percent: Math.round((done / eligible.length) * 100),
      // School is the only breakdown. Manager was removed on 21 Sep 2026: the
      // Admin console sets a manager for a handful of people, so the card was
      // mostly a list of one-person "teams" plus a large unattributed bucket,
      // which reads as a data quality report rather than a compliance view.
      bySchool: groupRows_(eligible, d.passed[id] || {}, 'unit')
    };
  }

  return {
    courseTitle: course.title,
    version: course.version,
    contentUpdated: course.updated || '',
    // How long a pass stays valid, so the page can say what "passed" means
    // without hardcoding twelve months in the markup.
    recertifyMonths: recertifyMonthsFor_(id),
    hasRoster: hasRoster,
    roster: rosterStats,
    totals: {
      peopleAttempted: peopleAttempted,
      peoplePassed: peoplePassed,
      peopleFailing: Math.max(0, peopleAttempted - peoplePassed),
      attempts: mine.length,
      avgScore: avg,
      firstAttemptPass: firstPass,
      medianMinutes: medianMinutes_(mine),
      passMark: Math.round(course.passMark * 100)
    },
    missed: missedQuestions_(d.ss, id, course.version, d.answerRows).slice(0, 12).map(function (q) {
      return { label: q.label, seen: q.seen, wrong: q.wrong, pct: Math.round((q.wrong / q.seen) * 100) };
    }),
    recent: recentAttempts_(d.ss, id, 150, d.attemptRows, null, d.leftMap)
  };
}

/**
 * Emails explicitly marked Left on the roster.
 *
 * Only an explicit Left counts. Someone who is not on the roster at all is NOT
 * treated as a leaver: they might simply predate the first roster build, and
 * labelling a current colleague as having left is a worse error than leaving
 * them unlabelled.
 */
function leaversByEmail_(ss, rows) {
  var out = {};
  // Reads the same raw Roster block readRoster_ is given, which is why that one
  // filters leavers out itself rather than being handed a filtered list: this
  // function needs exactly the rows the other one drops.
  (rows || sheetRows_(ss, 'Roster', ROSTER_WIDTH)).forEach(function (r) {
    if (r[ROSTER_COL.email] && String(r[ROSTER_COL.status] || '').trim() === 'Left') {
      out[String(r[ROSTER_COL.email]).toLowerCase()] = true;
    }
  });
  return out;
}

/**
 * Completion by manager.
 *
 * The roster stores a manager as an email address, because that is what the
 * Directory holds. Nobody reads a list of 200 email addresses, so each one is
 * resolved to a full name using the roster itself: managers are staff, so they
 * are almost always on it. An address that cannot be resolved is shown as-is
 * rather than guessed at from the local part, since a wrong name is worse than
 * an address.
 *
 * The name map is built from the WHOLE roster, not just the people eligible for
 * the selected course, or a manager who happens to be routed elsewhere would
 * lose their name.
 *
 * Sorted by the displayed name, so the panel reads alphabetically as shown.
 */
function managerRows_(people, passedSet, wholeRoster) {
  // Fallback only. The roster's own Manager name column is resolved from the
  // directory at refresh time and covers managers who are not on the roster at
  // all; this map only helps rows written before that column existed.
  var nameByEmail = {};
  wholeRoster.forEach(function (p) {
    var n = String(p.name || '').trim();
    if (n) nameByEmail[String(p.email).toLowerCase()] = n;
  });

  var groups = {};
  people.forEach(function (p) {
    var raw = String(p.manager || '').trim();
    var key = raw.toLowerCase();
    var label = raw
      ? (String(p.managerName || '').trim() || nameByEmail[key] || raw)
      : '(no manager set)';
    groups[label] = groups[label] || { name: label, total: 0, done: 0 };
    groups[label].total++;
    if (passedSet[String(p.email).toLowerCase()]) groups[label].done++;
  });

  return Object.keys(groups).sort(function (a, b) {
    // Unassigned last, however the rest sort.
    if (a === '(no manager set)') return 1;
    if (b === '(no manager set)') return -1;
    return a.localeCompare(b);
  }).map(function (k) {
    var g = groups[k];
    g.percent = Math.round((g.done / g.total) * 100);
    // "3 reports" under "(no manager set)" would read as if someone had three
    // of them. They are just people with the Manager field blank.
    g.sub = k === '(no manager set)'
      ? g.total + (g.total === 1 ? ' person' : ' people')
      : g.total + (g.total === 1 ? ' report' : ' reports');
    return g;
  });
}

function groupRows_(people, passedSet, field) {
  var groups = {};

  // EVERY SCHOOL IS LISTED, INCLUDING THE EMPTY ONES. Seeded before the roster
  // is counted so a school with nobody in it still appears, at 0 of 0.
  //
  // This matters because each deployment only rosters its own Workspace. On the
  // EOA deployment the four NZ schools have no rows, so building the list from
  // the data alone showed two schools and silently implied the others did not
  // exist. A school that is missing from a compliance view reads as a school
  // with nothing outstanding, which is the same wrong answer an empty staff
  // group gives.
  if (field === 'unit') {
    ALL_SCHOOLS.forEach(function (name) {
      groups[name] = { name: name, total: 0, done: 0 };
    });
  }

  people.forEach(function (p) {
    var k = p[field] || '(not set)';
    groups[k] = groups[k] || { name: k, total: 0, done: 0 };
    groups[k].total++;
    if (passedSet[String(p.email).toLowerCase()]) groups[k].done++;
  });

  return Object.keys(groups).sort().map(function (k) {
    var g = groups[k];
    // 0 of 0 is 0 per cent, not NaN per cent.
    g.percent = g.total ? Math.round((g.done / g.total) * 100) : 0;
    return g;
  });
}

/**
 * The most recent attempts at one course, newest first.
 *
 * Reads the whole sheet rather than the last N rows, because with several
 * courses interleaved the last N rows are not the last N for this course.
 */
function recentAttempts_(ss, courseId, limit, rows, rosterRows, leftMap) {
  var data = rows || sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH);
  if (!data.length) return [];

  // leftMap is the already-built map when the caller has one, which is what
  // stops it being rebuilt from 1600 roster rows once per course.
  var left = leftMap || leaversByEmail_(ss, rosterRows);
  var out = [];
  for (var i = data.length - 1; i >= 0 && out.length < limit; i--) {
    var r = data[i];
    if (String(r[ATTEMPTS_COL.course]) !== String(courseId)) continue;
    out.push({
      when: r[ATTEMPTS_COL.recorded] ? new Date(r[ATTEMPTS_COL.recorded]).toISOString() : '',
      email: String(r[ATTEMPTS_COL.email]),
      name: String(r[ATTEMPTS_COL.name] || ''),
      unit: String(r[ATTEMPTS_COL.unit] || ''),
      version: String(r[ATTEMPTS_COL.version]),
      attempt: Number(r[ATTEMPTS_COL.attempt]) || 0,
      score: Number(r[ATTEMPTS_COL.score]) || 0,
      total: Number(r[ATTEMPTS_COL.outOf]) || 0,
      percent: Number(r[ATTEMPTS_COL.percent]) || 0,
      result: String(r[ATTEMPTS_COL.result]),
      minutes: Number(r[ATTEMPTS_COL.minutes]) || 0,
      left: !!left[String(r[ATTEMPTS_COL.email]).toLowerCase()]
    });
  }
  return out;
}

/* ======================================================================
   Managing who can get in.

   Everything below writes to the Admins sheet only. Nothing here can touch
   training records.

   Three guards, and they exist because losing access to your own dashboard is
   not a recoverable mistake for anyone except the script owner:
     1. You cannot remove yourself.
     2. You cannot remove the last remaining administrator.
     3. You cannot remove the owner, who is not on the sheet in the first place.
   ====================================================================== */

/** Create the Admins sheet and its header if they are not there yet. */
function ensureAdminsSheet_(ss) {
  var sheet = ss.getSheetByName('Admins');
  if (!sheet) sheet = ss.insertSheet('Admins');
  var want = SHEET_SPEC.Admins;
  var have = sheet.getLastRow()
    ? sheet.getRange(1, 1, 1, want.length).getValues()[0].map(function (v) { return String(v || '').trim(); })
    : [];
  var drift = false;
  for (var i = 0; i < want.length; i++) { if (have[i] !== want[i]) { drift = true; break; } }
  if (drift) {
    sheet.getRange(1, 1, 1, want.length).setValues([want]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Populate an empty Admins sheet from SEED_ADMINS and the legacy script
 * property, then leave it alone forever.
 *
 * Called on demand rather than on a schedule, and only ever when the sheet has
 * no rows, so someone removed through the dashboard is never resurrected.
 */
function seedAdmins_(ss) {
  var sheet = ensureAdminsSheet_(ss);
  if (sheet.getLastRow() > 1) return 0;                 // already populated, nothing to do

  var seen = {}, list = [];
  (SEED_ADMINS || []).concat(legacyAdminList_()).forEach(function (e) {
    var k = String(e || '').trim().toLowerCase();
    if (!k || seen[k]) return;
    seen[k] = true;
    list.push(k);
  });
  if (!list.length) return 0;

  var dir = null;
  try { dir = directoryPeople_(); } catch (e) { dir = null; }

  var now = new Date();
  var rows = list.map(function (email) {
    var d = dir && dir[email];
    var parts = splitName_(d && d.name);
    return [email, parts.first, parts.last, DEFAULT_ROLE, 'Active', 'seeded', now, ''];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, ADMINS_WIDTH).setValues(rows);
  log_(ss, 'seedAdmins', ownerEmail_(), 'seeded ' + rows.length + ' administrators');
  return rows.length;
}

/**
 * A full name into first and last.
 *
 * Everything after the first space is the surname, which handles "Van Der Berg"
 * and double-barrelled names correctly and mishandles a small number of naming
 * conventions. Both fields are editable in the sheet for exactly those cases.
 */
function splitName_(full) {
  var t = String(full || '').trim().replace(/\s+/g, ' ');
  if (!t) return { first: '', last: '' };
  var i = t.indexOf(' ');
  return i === -1 ? { first: t, last: '' } : { first: t.slice(0, i), last: t.slice(i + 1) };
}

/**
 * Everyone with access, plus everyone who used to have it.
 *
 * Sorted by displayed name, matching the manager panel on the course views, so
 * the two lists in this product order the same way. Anyone whose name has not
 * been filled in sorts last rather than first, where a blank would otherwise
 * look like the list had failed to load.
 */
function listAdmins() {
  var me = getActiveEmail_();
  if (!can_(me, 'manageAdmins')) throw new Error('You do not have access to manage administrators.');

  var ss = getResultsSheet_();
  if (seedAdmins_(ss)) clearAdminRows_();               // seeds once, then no-ops

  var owner = ownerEmail_();
  var mine = String(me).toLowerCase();
  var all = adminRows_(ss) || [];

  function shape(r) {
    var name = (r.firstName + ' ' + r.lastName).trim();
    return {
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      name: name,
      role: r.role,
      roleLabel: (ROLES[r.role] && ROLES[r.role].label) || r.role,
      addedBy: r.addedBy,
      addedOn: r.addedOn ? new Date(r.addedOn).toISOString() : '',
      removedOn: r.removedOn ? new Date(r.removedOn).toISOString() : '',
      removable: r.email !== owner && r.email !== mine
    };
  }
  function byName(a, b) {
    if (!a.name && b.name) return 1;                    // unnamed rows last
    if (a.name && !b.name) return -1;
    var n = String(a.name || a.email).localeCompare(String(b.name || b.email));
    return n !== 0 ? n : a.email.localeCompare(b.email);
  }

  var active = all.filter(function (r) { return r.status !== 'Removed'; }).map(shape).sort(byName);
  var removed = all.filter(function (r) { return r.status === 'Removed'; }).map(shape).sort(byName);

  // The owner is implicit and never written to the sheet, but leaving them out
  // makes the access list look incomplete to whoever is reading it.
  if (owner && !active.some(function (r) { return r.email === owner; })) {
    active.unshift({
      email: owner, firstName: '', lastName: '', name: '', role: 'owner',
      roleLabel: ROLES.owner.label, addedBy: '', addedOn: '', removedOn: '', removable: false
    });
  }
  return { admins: active, removed: removed, viewer: mine, viewerRole: roleOf_(me) };
}

/**
 * Grant access to one address.
 *
 * The address is checked against the Directory first, because a typo silently
 * grants nothing: the person tries to open the dashboard, is refused, and
 * nobody can see why from the list.
 */
function addAdmin(email) {
  var me = getActiveEmail_();
  if (!can_(me, 'manageAdmins')) throw new Error('You do not have access to manage administrators.');

  var who = String(email || '').trim().toLowerCase();
  if (!who || who.indexOf('@') === -1) throw new Error('That does not look like an email address.');

  var ss = getResultsSheet_();
  seedAdmins_(ss);
  var sheet = ensureAdminsSheet_(ss);
  var rows = adminRows_(ss) || [];

  if (who === ownerEmail_()) throw new Error('That is the owner of this script, who always has access.');

  var dir = null;
  try { dir = directoryPeople_(); } catch (e) { dir = null; }
  if (dir && !dir[who]) {
    throw new Error('No active account matches ' + who + '. Check the address, including any dots.');
  }
  var parts = splitName_(dir && dir[who] && dir[who].name);

  // Someone previously removed is reactivated in place, so the sheet keeps one
  // row per person and the original Added on date survives.
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].email !== who) continue;
    if (rows[i].status !== 'Removed') throw new Error(who + ' already has access.');
    var r = i + 2;
    sheet.getRange(r, ADMINS_COL.status + 1).setValue('Active');
    sheet.getRange(r, ADMINS_COL.removedOn + 1).setValue('');
    if (parts.first) sheet.getRange(r, ADMINS_COL.firstName + 1).setValue(parts.first);
    if (parts.last) sheet.getRange(r, ADMINS_COL.lastName + 1).setValue(parts.last);
    clearAdminRows_();
    log_(ss, 'addAdmin', me, 'reactivated ' + who);
    return listAdmins();
  }

  sheet.appendRow([who, parts.first, parts.last, DEFAULT_ROLE, 'Active', String(me).toLowerCase(), new Date(), '']);
  clearAdminRows_();
    log_(ss, 'addAdmin', me, 'added ' + who);
  return listAdmins();
}

/** Withdraw access. Marks the row Removed rather than deleting it. */
function removeAdmin(email) {
  var me = getActiveEmail_();
  if (!can_(me, 'manageAdmins')) throw new Error('You do not have access to manage administrators.');

  var who = String(email || '').trim().toLowerCase();
  if (who === String(me).toLowerCase()) {
    throw new Error('You cannot remove your own access. Ask another administrator to do it.');
  }
  if (who === ownerEmail_()) {
    throw new Error('The owner of this script always has access and cannot be removed here.');
  }

  var ss = getResultsSheet_();
  seedAdmins_(ss);
  var sheet = ensureAdminsSheet_(ss);
  var rows = adminRows_(ss) || [];
  var active = rows.filter(function (r) { return r.status !== 'Removed'; });
  if (active.length <= 1) {
    throw new Error('This is the last administrator. Add someone else before removing them.');
  }

  for (var i = 0; i < rows.length; i++) {
    if (rows[i].email !== who || rows[i].status === 'Removed') continue;
    var r = i + 2;
    sheet.getRange(r, ADMINS_COL.status + 1).setValue('Removed');
    sheet.getRange(r, ADMINS_COL.removedOn + 1).setValue(new Date());
    clearAdminRows_();
    log_(ss, 'removeAdmin', me, 'removed ' + who);
    return listAdmins();
  }
  throw new Error(who + ' is not on the list.');
}

/**
 * Withdraw access from anyone whose Google account is no longer active.
 *
 * Runs on the nightly job, not on page load: it reads the whole Directory, and
 * an access list does not need to be correct to the second.
 *
 * THREE THINGS THIS DELIBERATELY WILL NOT DO, because each of them would lock
 * people out of their own dashboard for a reason that has nothing to do with
 * their access:
 *   1. If the Directory cannot be read at all, it changes nothing. A failed
 *      API call is not evidence that anybody left.
 *   2. If it is about to remove EVERY administrator, it stops and reports.
 *      That pattern means the Directory read is wrong, not that the company
 *      has no staff left.
 *   3. It never touches the owner, who is not on the sheet anyway.
 *
 * @param {boolean} apply  Pass true to write. Anything else = dry run.
 */
function syncAdminsWithDirectory(apply) {
  var live = (apply === true);
  var ss = getResultsSheet_();
  var sheet = ss.getSheetByName('Admins');
  if (!sheet) return 'No Admins sheet yet, nothing to check.';

  var dir = null;
  try { dir = directoryPeople_(); } catch (e) { dir = null; }
  if (!dir) {
    var m = 'Directory unavailable, so no administrator was changed. This is the safe outcome: ' +
      'a failed Directory read is not evidence that anyone has left.';
    Logger.log(m);
    return m;
  }

  var rows = adminRows_(ss) || [];
  var owner = ownerEmail_();
  var active = rows.filter(function (r) { return r.status !== 'Removed'; });
  var gone = active.filter(function (r) { return r.email !== owner && !dir[r.email]; });

  if (!gone.length) {
    return 'Checked ' + active.length + ' administrators against the Directory. All still active.';
  }
  if (gone.length >= active.filter(function (r) { return r.email !== owner; }).length) {
    var stop = 'STOPPED: this would remove every administrator (' + gone.length + '). That means the ' +
      'Directory read is wrong, not that they have all left. Nothing was changed.\n  ' +
      gone.map(function (r) { return r.email; }).join('\n  ');
    Logger.log(stop);
    return stop;
  }

  var now = new Date();
  if (live) {
    gone.forEach(function (r) {
      var i = rows.indexOf(r) + 2;
      sheet.getRange(i, ADMINS_COL.status + 1).setValue('Removed');
      sheet.getRange(i, ADMINS_COL.removedOn + 1).setValue(now);
    });
    clearAdminRows_();
    log_(ss, 'syncAdminsWithDirectory', 'scheduled',
      'removed ' + gone.length + ': ' + gone.map(function (r) { return r.email; }).join(', '));
  }

  var out = (live ? 'APPLIED\n' : 'DRY RUN, nothing was changed. Re-run as syncAdminsWithDirectory(true) to apply.\n') +
    'Administrators checked: ' + active.length + '\n' +
    'No longer active in Google, ' + (live ? 'removed' : 'would be removed') + ': ' + gone.length + '\n  ' +
    gone.map(function (r) {
      return r.email + (r.firstName ? ' (' + (r.firstName + ' ' + r.lastName).trim() + ')' : '');
    }).join('\n  ');
  Logger.log(out);
  return out;
}

/**
 * Apply the Directory check for real, outside the nightly job.
 * The editor's Run dropdown cannot pass arguments, hence this wrapper.
 * Run syncAdminsWithDirectory() first: with no argument it reports and changes nothing.
 */
function RUN_ADMIN_SYNC_FOR_REAL() {
  return syncAdminsWithDirectory(true);
}

/* -------------------------------------------------------------- diagnostics */

/**
 * Prints what each layer thinks the time is, so a timestamp that looks wrong on
 * the admin page can be traced to the layer that made it wrong rather than
 * guessed at.
 *
 * The admin page formats every timestamp in the browser, from an ISO instant,
 * so it is already in the reader's local time. That only gives the right answer
 * if the instant read back out of the sheet is the instant that was written in.
 * Sheets stores a wall clock, not an instant, so a spreadsheet whose time zone
 * differs from the script's turns that round trip lossy, and every attempt is
 * then off by the difference between the two.
 *
 * Run it from the editor and read the log. If "script" and "spreadsheet" match,
 * the stored times are sound and anything odd on screen is a display question.
 */
function DIAGNOSE_TIMES() {
  var ss = getResultsSheet_();
  var scriptTz = Session.getScriptTimeZone();
  var sheetTz = ss.getSpreadsheetTimeZone();
  var now = new Date();

  var lines = [
    'script time zone      : ' + scriptTz,
    'spreadsheet time zone : ' + sheetTz,
    'match                 : ' + (scriptTz === sheetTz ? 'yes' : 'NO, stored times will be offset'),
    'now, as an instant    : ' + now.toISOString(),
    'now, in script tz     : ' + Utilities.formatDate(now, scriptTz, 'yyyy-MM-dd HH:mm:ss z')
  ];

  var rows = sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH);
  if (!rows.length) {
    lines.push('attempts              : none recorded yet');
  } else {
    lines.push('last 3 attempts, raw cell value then the instant sent to the browser:');
    rows.slice(-3).forEach(function (r) {
      var raw = r[ATTEMPTS_COL.recorded];
      var d = (raw instanceof Date) ? raw : new Date(raw);
      lines.push('  ' + String(r[ATTEMPTS_COL.email]) +
        '  cell=' + String(raw) +
        '  iso=' + (isNaN(d.getTime()) ? 'unparseable' : d.toISOString()));
    });
  }

  var out = lines.join('\n');
  Logger.log(out);
  return out;
}
