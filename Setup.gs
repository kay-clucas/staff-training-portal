/**
 * Changes with every edit to this file, so DIAGNOSE_ROSTER() can prove which
 * version of the code is actually deployed. If the stamp in the execution log
 * is not the one below, the push did not land.
 */
var SETUP_BUILD = '2026-09-15 admin-sdk-roster';

/**
 * One-time setup for the training results workbook.
 *
 * SAFETY MODEL (per EA scripting standards):
 *   - Every function here defaults to a dry run. Calling setUpResultsSheet()
 *     with no argument reports what it WOULD do and changes nothing.
 *   - Pass true to actually apply: setUpResultsSheet(true)
 *   - Nothing in this file deletes or overwrites data. Sheets and headers are
 *     only ever created if missing.
 */

/**
 * The editor's Run dropdown cannot pass arguments, so this is the entry point
 * to pick when you actually want the setup applied. Named loudly on purpose.
 */
function RUN_SETUP_FOR_REAL() {
  return setUpResultsSheet(true);
}

/**
 * Apply the roster refresh for real.
 *
 * refreshRoster() with no argument is a dry run and is what you should run
 * first: it reports what it found and changes nothing. Reconcile its numbers
 * against the group in the Admin console before running this.
 */
function RUN_ROSTER_FOR_REAL() {
  return refreshRoster(true);
}

/**
 * Write No into the Reminders column of every roster row that has no value yet.
 *
 * The point of this is a one word policy: new starters are chased, the people
 * already here are not. Running it draws a line under the current population.
 * Everyone on the roster at that moment is marked No, and from then on the only
 * rows carrying Yes are ones refreshRoster created afterwards, which is to say
 * people who joined the staff group after the line was drawn.
 *
 * Blank already reads as No everywhere, so this changes no behaviour at all. It
 * writes the decision down where somebody can see it in the sheet, rather than
 * leaving it implicit in an empty cell.
 *
 * SAFE TO RE-RUN. It only ever fills blanks, so a Yes set by a later refresh,
 * or a No somebody flipped to Yes by hand, is never overwritten.
 *
 * @param {boolean} apply  Pass true to write. Anything else = dry run.
 */
function stampRosterReminders(apply) {
  var live = (apply === true);
  var ss = getResultsSheet_();
  var sheet = ss.getSheetByName('Roster');
  if (!sheet) throw new Error('Roster sheet missing. Run RUN_SETUP_FOR_REAL() first.');

  var headerFixed = live ? syncRosterHeader_(sheet) : rosterHeaderDrift_(sheet);

  var last = sheet.getLastRow();
  if (last < 2) {
    var empty = 'The roster is empty, so there is nothing to stamp. Run refreshRoster(true) first.';
    Logger.log(empty);
    return empty;
  }

  var col = ROSTER_WIDTH;                            // Reminders is the last column
  var values = sheet.getRange(2, col, last - 1, 1).getValues();
  var blanks = 0, yes = 0, no = 0, other = [];

  values.forEach(function (row, i) {
    var v = String(row[0] || '').trim();
    if (!v) { blanks++; row[0] = 'No'; return; }
    var u = v.toLowerCase();
    if (u === 'yes') { yes++; return; }
    if (u === 'no') { no++; return; }
    // Anything else is left exactly as it is and reported. A cell reading
    // "ask Jane" is somebody mid-thought, not a value to overwrite.
    other.push('row ' + (i + 2) + ' reads "' + v + '"');
  });

  if (live && blanks) {
    sheet.getRange(2, col, values.length, 1).setValues(values);
    log_(ss, 'stampRosterReminders', Session.getEffectiveUser().getEmail(),
      'set ' + blanks + ' blank rows to No');
  }

  var out = (live ? 'APPLIED\n' : 'DRY RUN, nothing was written. Re-run as stampRosterReminders(true) to apply.\n') +
    (headerFixed ? headerFixed + '\n' : '') +
    'Roster rows: ' + values.length + '\n' +
    'Blank, ' + (live ? 'set to No: ' : 'would be set to No: ') + blanks + '\n' +
    'Already Yes, left alone: ' + yes + '\n' +
    'Already No, left alone: ' + no + '\n' +
    (other.length ? 'Not Yes or No, left alone and worth a look:\n  ' + other.join('\n  ') + '\n' : '') +
    '\nAfter this, only rows refreshRoster adds later carry Yes. ' +
    'sendReminders() with no argument will show you exactly who that is.';
  Logger.log(out);
  return out;
}

/**
 * Draw the line for real. See stampRosterReminders for what that means.
 * Run stampRosterReminders() with no argument first: it reports and writes nothing.
 */
function RUN_ROSTER_STAMP_FOR_REAL() {
  return stampRosterReminders(true);
}

/**
 * Install the scheduled triggers for real.
 *
 * Run this LAST, and only once the roster is reconciled. One of the triggers it
 * installs, weeklyReminderJob, emails every outstanding person for real once a
 * week, on the day SCHEDULE.reminderDay names. Installing it against a wrong
 * roster is how the whole organisation gets chased for training nobody
 * assigned them.
 */
function RUN_TRIGGERS_FOR_REAL() {
  return installTriggers(true);
}

/**
 * Column order for every sheet. Attempts must stay in step with ATTEMPTS_COL
 * in Code.gs, which is what writes and reads the rows.
 *
 * "Course" is what lets one workbook hold several courses without their
 * attempt numbers, pass states and reminders running into each other.
 * "School" is derived from the email domain, not the org unit path, so it is
 * always present and always current.
 */
// Named so that the three places that read a roster row by index do not each
// carry their own copy of the column order. Department has been removed: it was
// never populated from the EA Admin console, so grouping by it produced one
// bucket called '(not set)'. School, which is derived from the email domain and
// is therefore always right, is the dimension that replaced it.
var ROSTER_COL = {
  email: 0, name: 1, school: 2, managerEmail: 3, status: 4, managerName: 5, reminders: 6
};
var ROSTER_WIDTH = 7;

var SHEET_SPEC = {
  Attempts: ['Recorded', 'Email', 'Name', 'School', 'Manager', 'Course',
    'Content version', 'Attempt', 'Score', 'Out of', 'Percent', 'Result', 'Started',
    'Finished', 'Minutes taken'],
  Answers: ['Recorded', 'Email', 'Course', 'Content version', 'Attempt', 'Section',
    'Question ID', 'Question', 'Answer given', 'Outcome'],
  // Reminders (column 8) decides who the weekly chase emails, and ONLY that.
  // It is not a compliance field: somebody set to No is still counted as
  // outstanding everywhere, they simply are not emailed about it. Blank reads
  // as No, so a row that predates this column, or one pasted in by hand, can
  // never put anyone in a send list by accident.
  Roster: ['Email', 'Name', 'School', 'Manager email', 'Status',
    'Manager name', 'Reminders'],
  Dashboard: ['Metric', 'Value'],
  Log: ['Timestamp', 'Action', 'Who', 'Detail'],
  // Who can open the dashboard. Lives here rather than in a script property so
  // it can carry names, a role, and a record of who granted access and when.
  // Removal sets Status to Removed and stamps a date; rows are never deleted,
  // for the same reason leavers stay on the Roster.
  Admins: ['Email', 'First name', 'Last name', 'Role', 'Status', 'Added by', 'Added on', 'Removed on']
};

var ADMINS_COL = {
  email: 0, firstName: 1, lastName: 2, role: 3, status: 4,
  addedBy: 5, addedOn: 6, removedOn: 7
};
var ADMINS_WIDTH = 8;

/**
 * Compare an existing sheet's header row against the spec and describe any
 * difference. Reports only. Nothing here rewrites a header, because doing that
 * on a sheet that already holds results would silently reinterpret every row.
 *
 * A mismatch means the workbook predates a schema change. The fix is a
 * deliberate migration, not a header rewrite.
 */
function headerDrift_(sheet, expected) {
  var width = sheet.getLastColumn();
  if (!width) return 'the sheet is empty, it has no header row at all';
  var actual = sheet.getRange(1, 1, 1, Math.max(width, expected.length)).getValues()[0]
    .map(function (h) { return String(h || '').trim(); });

  var missing = expected.filter(function (h) { return actual.indexOf(h) < 0; });
  var extra = actual.filter(function (h) { return h && expected.indexOf(h) < 0; });
  if (!missing.length && !extra.length) {
    var ordered = expected.every(function (h, n) { return actual[n] === h; });
    return ordered ? '' : 'the right columns are present but not in the expected order';
  }
  var parts = [];
  if (missing.length) parts.push('missing: ' + missing.join(', '));
  if (extra.length) parts.push('unexpected: ' + extra.join(', '));
  return 'header does not match the spec (' + parts.join('; ') + '). Nothing was changed. ' +
    'Migrate deliberately before recording more results against it.';
}

/**
 * Create (or complete) the results workbook and store its ID in Script Properties.
 * @param {boolean} apply  Pass true to make changes. Anything else = dry run.
 */
function setUpResultsSheet(apply) {
  var live = (apply === true);
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_SHEET_ID);
  var plan = [];

  var ss;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
      plan.push('Using existing workbook: "' + ss.getName() + '" (' + id + ')');
    } catch (e) {
      throw new Error('Stored RESULTS_SHEET_ID (' + id + ') could not be opened: ' + e.message +
        '. Clear the property in Project Settings before re-running, so nothing is created twice.');
    }
  } else if (live) {
    ss = SpreadsheetApp.create(ORG.name + ' Training Results');
    props.setProperty(PROP_SHEET_ID, ss.getId());
    clearScriptProps_();                  // properties are memoised per execution, so a write
                                          // has to invalidate them or the rest of this run
                                          // still thinks there is no workbook
    plan.push('CREATED workbook: ' + ss.getUrl());
  } else {
    plan.push('WOULD CREATE a new workbook "' + ORG.name + ' Training Results"');
  }

  Object.keys(SHEET_SPEC).forEach(function (name) {
    var headers = SHEET_SPEC[name];
    if (!ss) { plan.push('  WOULD CREATE sheet "' + name + '" with ' + headers.length + ' columns'); return; }
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      if (live) {
        sheet = ss.insertSheet(name);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers])
          .setFontWeight('bold').setFontColor('#1f1f1f').setBackground('#f3f3f3');
        sheet.setFrozenRows(1);
        plan.push('  CREATED sheet "' + name + '"');
      } else {
        plan.push('  WOULD CREATE sheet "' + name + '"');
      }
    } else {
      plan.push('  sheet "' + name + '" already exists, left untouched');
      var drift = headerDrift_(sheet, headers);
      if (drift) plan.push('    ATTENTION: ' + drift);
    }
  });

  if (ss && live) {
    var def = ss.getSheetByName('Sheet1');
    if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(def);                       // only ever the empty default sheet
      plan.push('  removed the empty default "Sheet1"');
    }
    log_(ss, 'setUpResultsSheet', Session.getEffectiveUser().getEmail(), 'setup applied');
  }

  var out = (live ? 'APPLIED\n' : 'DRY RUN, nothing was changed. Re-run as setUpResultsSheet(true) to apply.\n')
    + plan.join('\n');
  Logger.log(out);
  return out;
}

/**
 * Bring the Roster header row into line with SHEET_SPEC.
 *
 * ONLY row 1 is ever touched. Data is never moved, rewritten or reordered,
 * which is why 'Manager name' was appended at column 7 rather than inserted
 * next to 'Manager email': inserting would have left the existing Status
 * values sitting under the wrong header.
 *
 * Returns a sentence describing what changed, or '' if nothing did.
 */
function syncRosterHeader_(sheet) {
  var want = SHEET_SPEC.Roster;
  var drift = rosterHeaderDrift_(sheet);
  if (!drift) return '';
  sheet.getRange(1, 1, 1, want.length).setValues([want]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return 'Roster header updated: ' + drift;
}

/** Describe how the Roster header differs from the spec, or '' if it matches. */
function rosterHeaderDrift_(sheet) {
  var want = SHEET_SPEC.Roster;
  var have = sheet.getRange(1, 1, 1, want.length).getValues()[0]
    .map(function (v) { return String(v || '').trim(); });
  var changes = [];
  for (var i = 0; i < want.length; i++) {
    if (have[i] === want[i]) continue;
    changes.push(have[i]
      ? 'column ' + (i + 1) + ' "' + have[i] + '" becomes "' + want[i] + '"'
      : 'column ' + (i + 1) + ' "' + want[i] + '" added');
  }
  return changes.join(', ');
}

/**
 * Load or refresh the roster used for reporting and reminders.
 *
 * SOURCE: the example-staff group, read through the Admin SDK and walked
 * recursively so that anyone inside a nested group is still found.
 *
 * Deliberately NOT the Admin SDK USER list. That returns every account in the
 * Workspace, including EOA staff and the student accounts, which is the wrong
 * population: completion would be measured against a denominator that is mostly
 * people who were never assigned anything. Reading one group's membership gives
 * exactly the people this platform is responsible for.
 *
 * Create-or-update only. Existing rows are matched on email and nothing is
 * ever deleted, so a manual Name correction survives a refresh, and so
 * does the row of someone who has since left (their completion record should
 * not vanish from the sheet just because they are out of the group).
 *
 * @param {boolean} apply  Pass true to write. Anything else = dry run.
 */
function refreshRoster(apply) {
  var live = (apply === true);
  var NEEDED = 'https://www.googleapis.com/auth/admin.directory.group.member.readonly';
  if (!hasScope_(NEEDED)) {
    var m = 'Loading the roster from the ' + rosterGroupLabel_() + ' group(s) needs a permission this ' +
      'project has not been granted yet.\n\n' +
      'Add this line to BOTH of these, or this check will keep refusing:\n\n' +
      '  1. the oauthScopes list in appsscript.json\n' +
      '  2. the list returned by getManifestScopes_() in Code.gs\n\n' +
      '  ' + NEEDED + '\n\n' +
      'Then run this function again and approve the extra permission when Google asks.\n\n' +
      'Until then the Roster sheet can be pasted in by hand: Email, Name, School, ' +
      'Manager email. Everything downstream works the same either way, and the training and the ' +
      'dashboard work with no roster at all.';
    Logger.log(m);
    return m;
  }
  if (typeof AdminDirectory === 'undefined') {
    var svc = 'The Admin SDK service is not enabled for this project, so the group cannot be read.\n\n' +
      'It is declared in appsscript.json under dependencies.enabledAdvancedServices, so a normal\n' +
      'clasp push should carry it. If it has gone missing, re-add it in the editor: Services, then\n' +
      '+, then Admin SDK API, identifier AdminDirectory, and make sure the manifest still has the\n' +
      'dependencies block. A push from a manifest without that block strips the service.\n\n' +
      'Until then the Roster sheet can be pasted in by hand: Email, Name, School, ' +
      'Manager email.';
    Logger.log(svc);
    return svc;
  }

  var ss = getResultsSheet_();
  var sheet = ss.getSheetByName('Roster');
  if (!sheet) throw new Error('Roster sheet missing. Run RUN_SETUP_FOR_REAL() first.');
  var headerFixed = live ? syncRosterHeader_(sheet) : rosterHeaderDrift_(sheet);

  var found;
  try {
    found = collectAllGroupMembers_();
  } catch (e) {
    var err = 'Could not read the staff group(s) ' + rosterGroupLabel_() + ': ' + e.message + '\n\n' +
      'Check that the group address is right, that the Admin SDK service is enabled, and that the ' +
      'account running this script is a Workspace admin with rights to read group membership. ' +
      'Nothing was changed.';
    Logger.log(err);
    return err;
  }

  var detailByEmail = directoryPeople_();      // null if the Directory is not available

  // The manager stored against a person is an email address. Resolve it here,
  // where the whole directory is in hand, rather than in the dashboard, where
  // only the roster is. A manager outside example-staff (EOA, for instance) is
  // in the directory but never on the roster, which is why looking them up
  // there left raw addresses on screen.
  function managerNameFor_(managerEmail) {
    var key = String(managerEmail || '').trim().toLowerCase();
    if (!key || !detailByEmail) return '';
    var d = detailByEmail[key];
    return (d && d.name) || '';
  }

  // Current, eligible membership
  var current = {}, excluded = 0, routedElsewhere = 0;
  found.emails.forEach(function (email) {
    if (isExcludedAccount_(email)) { excluded++; return; }
    // Someone in the staff group whose domain routes to EOA takes their
    // training in the other app. Rostering them here would chase them weekly
    // for courses this platform will never show them.
    if (!courseIdsFor_(email).length) { routedElsewhere++; return; }
    current[String(email).toLowerCase()] = email;
  });

  // Existing rows, read once and edited in memory so the whole block can be
  // written back in a single call rather than 1700 individual writes.
  var lastRow = sheet.getLastRow();
  var block = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, ROSTER_WIDTH).getValues() : [];
  var seen = {}, reactivated = 0, markedLeft = 0, alreadyThere = 0;
  var namesFilled = 0, managersFilled = 0, notOurs = 0;

  block.forEach(function (r) {
    var email = String(r[0] || '').trim();
    if (!email) return;
    var key = email.toLowerCase();
    seen[key] = true;

    if (current[key]) {
      alreadyThere++;
      if (String(r[ROSTER_COL.status]) !== 'Active') { r[ROSTER_COL.status] = 'Active'; reactivated++; }
      // Blanks only, so a manual correction in the sheet survives a refresh.
      var d = detailByEmail && detailByEmail[key];
      if (d) {
        if (!String(r[ROSTER_COL.name] || '').trim() && d.name) {
          r[ROSTER_COL.name] = d.name; namesFilled++;
        }
        if (!String(r[ROSTER_COL.managerEmail] || '').trim() && d.manager) {
          r[ROSTER_COL.managerEmail] = d.manager; managersFilled++;
        }
      }
      // Always refreshed, not blanks-only: it is a derived label, not something
      // anyone would hand-correct, and leaving it stale after a manager changes
      // their name is worse than rewriting it.
      if (String(r[ROSTER_COL.managerEmail] || '').trim()) {
        r[ROSTER_COL.managerName] = managerNameFor_(r[ROSTER_COL.managerEmail]) ||
          String(r[ROSTER_COL.managerName] || '');
      }
      // Always recomputed, not just filled when blank: the school comes from the
      // domain, so it is never stale, and a row that predates a domain being
      // mapped should correct itself on the next refresh rather than keep a raw
      // domain string forever.
      r[ROSTER_COL.school] = businessUnitFor_(email) || String(r[ROSTER_COL.school] || '');
    } else if (String(r[ROSTER_COL.status]) !== 'Left' && rostersThisPerson_(email)) {
      // No longer in the group. Marked, never deleted: their completion record
      // lives in Attempts and must not be disturbed, and a row that comes back
      // later should reactivate rather than duplicate.
      //
      // rostersThisPerson_ is what stops the two deployments wiping each other
      // out. Both write to the same workbook, so without it every refresh marks
      // the other Workspace's entire staff as Left. See ROSTER_SCHOOLS.
      r[ROSTER_COL.status] = 'Left';
      markedLeft++;
    } else if (String(r[ROSTER_COL.status]) !== 'Left') {
      notOurs++;
    }
  });

  var rows = [], added = 0;
  Object.keys(current).forEach(function (key) {
    if (seen[key]) return;
    var email = current[key];
    var d = (detailByEmail && detailByEmail[key]) || { name: '', team: '', manager: '' };
    // Counted here too, or the report only shows backfills and reads as zero on
    // the very first run, when every row is new.
    if (d.name) namesFilled++;
    if (d.manager) managersFilled++;
    // BUILT FROM ROSTER_COL, NOT AS A POSITIONAL LITERAL. The literal that used
    // to be here still carried the Department value after that column was
    // removed, so it produced an 8-wide row for a 7-wide sheet and setValues
    // threw. A positional literal is the one place a column change cannot be
    // caught by renaming a constant, so it is worth the extra lines.
    var row = new Array(ROSTER_WIDTH);
    row[ROSTER_COL.email]        = email;
    row[ROSTER_COL.name]         = d.name;
    row[ROSTER_COL.school]       = businessUnitFor_(email);
    row[ROSTER_COL.managerEmail] = d.manager;
    row[ROSTER_COL.status]       = 'Active';
    row[ROSTER_COL.managerName]  = managerNameFor_(d.manager);
    // The ONLY place a person has ever entered this roster, which is what makes
    // "new starters are chased, the existing population is not" a one word
    // change rather than a date rule. Existing rows are edited in the loop
    // above, which never touches this column, so a stamp set here survives
    // every future refresh.
    row[ROSTER_COL.reminders]    = 'Yes';
    rows.push(row);
    added++;
  });

  if (live) {
    if (block.length) sheet.getRange(2, 1, block.length, ROSTER_WIDTH).setValues(block);
    if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, ROSTER_WIDTH).setValues(rows);
    log_(ss, 'refreshRoster', Session.getEffectiveUser().getEmail(),
      'added ' + added + ', left ' + markedLeft + ', reactivated ' + reactivated +
      ', names filled ' + namesFilled + ', managers ' + managersFilled);
  }

  var out = (live ? 'APPLIED\n' : 'DRY RUN, nothing was written. Re-run as refreshRoster(true) to apply.\n') +
    (headerFixed ? headerFixed + '\n' : '') +
    'Groups: ' + rosterGroupLabel_() + '\n' +
    (found.perGroup ? found.perGroup.map(function (g) {
      return '  ' + g.group + ': ' + g.count + ' account(s)' + (g.error ? '  FAILED: ' + g.error : '') + '\n';
    }).join('') : '') +
    'Groups walked: ' + found.groupsWalked + (found.truncated ? ' (STOPPED at the depth cap)' : '') + '\n' +
    (found.skippedGroups.length
      ? 'Excluded group addresses not walked into: ' + found.skippedGroups.join(', ') + '\n' : '') +
    'Distinct member accounts found: ' + found.emails.length + '\n' +
    'Suspended or archived accounts skipped: ' + found.suspended + '\n' +
    'Generic or shared accounts excluded: ' + excluded + ' of ' + ROSTER.excludeAddresses.length + ' configured\n' +
    'Routed to another training app, not rostered here: ' + routedElsewhere + '\n' +
    'Eligible people: ' + Object.keys(current).length + '\n' +
    '\n' +
    'Already on the roster: ' + alreadyThere + '\n' +
    'New rows ' + (live ? 'added: ' : 'that would be added: ') + added +
      (added ? ', each set to Reminders = Yes' : '') + '\n' +
    'Marked as Left (no longer in the group): ' + markedLeft + '\n' +
    'Left alone (rostered by the other deployment): ' + notOurs + '\n' +
    'Reactivated (back in the group): ' + reactivated + '\n' +
    (detailByEmail
      ? 'Names ' + (live ? 'filled in: ' : 'that would be filled in: ') + namesFilled + '\n' +
        'Managers ' + (live ? 'filled in: ' : 'that would be filled in: ') + managersFilled + '\n' +
        (managersFilled < Object.keys(current).length
          ? '  ' + (Object.keys(current).length - managersFilled) + ' people have no manager set in ' +
            'the Admin console, so the Manager column stays blank for them. This affects reporting ' +
            'only: nobody is chased or counted differently because of it.\n'
          : '')
      : 'Names and managers: n/a, the Directory is not available so they stay blank\n') + '\n' +
    'Reconcile "distinct member accounts found" against the member count in the Admin console ' +
    'before applying. Nothing here is ever deleted: people who leave the group are marked Left ' +
    'so they stop being chased and stop inflating the denominator, and their completion records ' +
    'in Attempts are untouched.';
  Logger.log(out);
  return out;
}

/**
 * Directory details by email address, or null if the Directory cannot be read.
 *
 * Returns { email: { name, team, manager } }, where team is the Department
 * field under Employee information in the Admin console and manager is the
 * Manager field on the same panel.
 *
 * ENRICHMENT ONLY. The roster's POPULATION comes from the group, so if this is
 * unavailable the roster is still complete and correct: names, teams and
 * managers are simply blank. That is the whole reason population and detail are
 * separated, so the risky permission is attached to the part that can fail
 * harmlessly.
 *
 * projection: 'full' is required. The 'basic' projection omits organizations
 * and relations entirely, which is why Team was blank on every row: the field
 * was never in the response to begin with.
 *
 * Needs the Admin SDK advanced service (identifier AdminDirectory) and the
 * admin.directory.user.readonly scope. Aliases are mapped too, because a group
 * member can be listed under one.
 */
function directoryPeople_() {
  if (typeof AdminDirectory === 'undefined') {
    Logger.log('Admin SDK not enabled, so roster names and teams will be left blank. This is not an error.');
    return null;
  }
  try {
    var map = {}, token = null, pages = 0;
    do {
      var page = AdminDirectory.Users.list({
        customer: 'my_customer', maxResults: 200, projection: 'full',
        query: 'isSuspended=false', orderBy: 'email', pageToken: token
      });
      (page.users || []).forEach(function (u) {
        if (!u.primaryEmail) return;
        var detail = {
          name: (u.name && u.name.fullName) || '',
          // Still read, though nothing consumes it today. The Department column
          // was dropped because the EA Admin console does not populate it; keeping
          // the read means switching it back on is a display change rather than a
          // directory change. See ROSTER_COL.
          team: primaryOrgField_(u.organizations, 'department'),
          manager: managerOf_(u.relations)
        };
        if (!detail.name && !detail.team && !detail.manager) return;
        map[String(u.primaryEmail).toLowerCase()] = detail;
        (u.aliases || []).forEach(function (a) { map[String(a).toLowerCase()] = detail; });
      });
      token = page.nextPageToken;
      pages++;
    } while (token && pages < 80);         // hard stop; a runaway page loop is a quota incident
    return map;
  } catch (e) {
    Logger.log('Could not read Directory detail, leaving names and teams blank: ' + e);
    return null;
  }
}

/**
 * One field off a user's primary organisation.
 *
 * A user can carry several organisation entries. The one flagged primary is the
 * current job; falling back to the first entry is better than blank, because in
 * practice most accounts have exactly one.
 */
function primaryOrgField_(orgs, field) {
  if (!orgs || !orgs.length) return '';
  var chosen = null;
  for (var i = 0; i < orgs.length; i++) {
    if (orgs[i] && orgs[i].primary) { chosen = orgs[i]; break; }
  }
  if (!chosen) chosen = orgs[0];
  return String((chosen && chosen[field]) || '').trim();
}

/**
 * The manager's address off a user's relations list.
 *
 * Google stores this as a free-text value, so it is usually an email address
 * but is not guaranteed to be one. Taken as given rather than validated: a
 * wrong-looking manager in a reporting column is a smaller problem than a
 * blank one.
 */
function managerOf_(relations) {
  if (!relations || !relations.length) return '';
  for (var i = 0; i < relations.length; i++) {
    if (relations[i] && String(relations[i].type).toLowerCase() === 'manager') {
      return String(relations[i].value || '').trim();
    }
  }
  return '';
}

/**
 * Every distinct person in a group, following nested groups.
 * Returns { emails, groupsWalked, truncated, skippedGroups }.
 *
 * Uses the Admin SDK rather than GroupsApp. GroupsApp can only read groups the
 * account running the script actually belongs to: on anything else it fails
 * with "An error occurred while looking up roles in the group", whatever admin
 * rights that account holds. The Admin SDK reads membership as an
 * administrator, which is what this needs.
 *
 * Nested groups are walked explicitly rather than using the API's
 * includeDerivedMembership flag. Derived membership flattens everything and
 * would give no way to decline a specific nested group, and several of the
 * excluded addresses are group addresses.
 *
 * Suspended accounts are skipped. They are still group members but should not
 * be chased or counted in the denominator.
 */
/**
 * Every staff account across ALL the groups this deployment is configured with.
 *
 * The EA Workspace keeps one staff group per school rather than one for the
 * lot, so the roster is the union of several. Results are merged and
 * de-duplicated on the email address: somebody in two schools' groups is one
 * roster row, not two.
 *
 * ONE GROUP FAILING DOES NOT FAIL THE ROSTER, but it is recorded per group in
 * perGroup and surfaced in the refresh report. A group that has been renamed or
 * emptied otherwise removes its whole school from the denominator silently,
 * which reads on the dashboard as that school being fully compliant. Given the
 * groups are known to be imperfectly maintained, a visible per-group count is
 * what makes that gap obvious.
 */
function collectAllGroupMembers_() {
  var groups = rosterGroupEmails_();
  var seen = {}, emails = [], perGroup = [], skippedGroups = [];
  var groupsWalked = 0, suspended = 0, truncated = false, failures = 0;

  groups.forEach(function (ge) {
    var before = emails.length;
    try {
      var r = collectGroupMembers_(ge);
      r.emails.forEach(function (e) {
        var k = String(e).toLowerCase();
        if (seen[k]) return;
        seen[k] = true;
        emails.push(e);
      });
      groupsWalked += r.groupsWalked;
      suspended += r.suspended;
      truncated = truncated || r.truncated;
      skippedGroups = skippedGroups.concat(r.skippedGroups);
      perGroup.push({ group: ge, count: r.emails.length, added: emails.length - before, error: '' });
      if (!r.emails.length) {
        Logger.log('Staff group ' + ge + ' returned NO members. That school will be absent from ' +
          'the roster and will read as fully compliant on the dashboard. Check the group exists ' +
          'and still has members.');
      }
    } catch (e) {
      failures++;
      perGroup.push({ group: ge, count: 0, added: 0, error: describeError_(e) });
      Logger.log('Staff group ' + ge + ' could not be read: ' + e.message +
        '. Its people are NOT in this roster.');
    }
  });

  // Every group failing is not a partial result, it is no result. Throw, so the
  // caller reports a failure instead of writing an empty roster over a good one.
  if (failures === groups.length) {
    throw new Error('None of the configured staff groups could be read (' + groups.join(', ') +
      '). Refusing to replace the roster with nothing.');
  }

  return { emails: emails, groupsWalked: groupsWalked, truncated: truncated,
           skippedGroups: skippedGroups, suspended: suspended, perGroup: perGroup };
}

function collectGroupMembers_(groupEmail) {
  var seenGroups = {}, seenEmails = {}, emails = [], skippedGroups = [];
  var truncated = false, groupsWalked = 0, suspended = 0;

  function walk(email, depth) {
    var key = String(email).toLowerCase();
    if (seenGroups[key]) return;              // cycle, or a group reachable by two paths
    seenGroups[key] = true;
    if (depth > ROSTER.maxGroupDepth) { truncated = true; return; }

    // Several excluded addresses are group addresses. Excluding one as a user
    // would not stop the walk descending into it and pulling in everyone
    // inside, so the same list is honoured here.
    if (depth > 0 && isExcludedAccount_(email)) { skippedGroups.push(email); return; }

    groupsWalked++;
    var token = null, pages = 0, children = [];
    do {
      var page = AdminDirectory.Members.list(email, { maxResults: 200, pageToken: token });
      (page.members || []).forEach(function (m) {
        if (m.type === 'GROUP') { children.push(m.email); return; }
        if (m.type !== 'USER' || !m.email) return;
        // SUSPENDED and ARCHIVED are both "not a person who can sit training".
        // ARCHIVED was found in online-all-staff on 21 Sep 2026: an archived account
        // is a former employee whose mailbox is retained for compliance. They
        // cannot sign in, so they can never complete anything, but they are
        // still group members. Counting them puts a permanently outstanding row
        // in the roster that drags the completion figure down by a fixed amount
        // and never resolves, which is the same failure as an unexcluded shared
        // mailbox. Counted together because the distinction does not change what
        // we do about it.
        var status = String(m.status || '').toUpperCase();
        if (status === 'SUSPENDED' || status === 'ARCHIVED') { suspended++; return; }
        var lower = String(m.email).toLowerCase();
        if (seenEmails[lower]) return;        // in more than one nested group
        seenEmails[lower] = true;
        emails.push(m.email);
      });
      token = page.nextPageToken;
      pages++;
    } while (token && pages < 40);            // hard stop; a runaway page loop is a quota incident

    children.forEach(function (child) { walk(child, depth + 1); });
  }

  walk(groupEmail, 0);
  return { emails: emails, groupsWalked: groupsWalked, truncated: truncated,
           skippedGroups: skippedGroups, suspended: suspended };
}

/**
 * Install the weekly reminder and nightly dashboard triggers.
 * Create-only: if a trigger for the same function already exists it is left alone,
 * so running this twice does not double up the emails.
 * @param {boolean} apply  Pass true to install. Anything else = dry run.
 */
function installTriggers(apply, only) {
  var live = (apply === true);
  var scope = String(only || 'all').toLowerCase();
  if (['all', 'dashboard', 'reminders'].indexOf(scope) === -1) {
    var bad = 'Unknown trigger set "' + only + '". Use "all", "dashboard" or "reminders".';
    Logger.log(bad);
    return bad;
  }
  // V1 requests the smallest possible set of permissions, so this feature's
  // scope is not granted yet. Say so plainly instead of throwing a raw
  // Google permissions error at whoever runs it.
  var NEEDED = 'https://www.googleapis.com/auth/script.scriptapp';
  if (!hasScope_(NEEDED)) {
    var m = 'Installing scheduled triggers needs a permission this project has not been granted yet.\n\n' +
      'Add this line to the oauthScopes list in appsscript.json:\n  ' + NEEDED + '\n\n' +
      'Then run this function again and approve the extra permission when Google asks. ' +
      'That second consent screen is expected. It is how Apps Script grants a capability ' +
      'you did not ask for at install time.';
    Logger.log(m);
    return m;
  }

  var tz = Session.getScriptTimeZone();
  var all = [
    { fn: 'nightlyDashboardJob', set: 'dashboard',
      how: 'Daily ' + pad2_(SCHEDULE.dashboardHour) + ':00 ' + tz },
    { fn: 'weeklyReminderJob', set: 'reminders',
      how: titleCase_(SCHEDULE.reminderDay) + 's ' + pad2_(SCHEDULE.reminderHour) + ':00 ' + tz }
  ];
  var wanted = all.filter(function (w) { return scope === 'all' || w.set === scope; });
  var have = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  var plan = [];

  wanted.forEach(function (w) {
    if (have.indexOf(w.fn) > -1) { plan.push('  ' + w.fn + ': already installed, left alone'); return; }
    if (!live) { plan.push('  WOULD INSTALL ' + w.fn + ' (' + w.how + ')'); return; }
    if (w.fn === 'weeklyReminderJob') {
      ScriptApp.newTrigger(w.fn).timeBased()
        .onWeekDay(ScriptApp.WeekDay[SCHEDULE.reminderDay])
        .atHour(SCHEDULE.reminderHour).create();
    } else {
      ScriptApp.newTrigger(w.fn).timeBased()
        .everyDays(1).atHour(SCHEDULE.dashboardHour).create();
    }
    plan.push('  INSTALLED ' + w.fn + ' (' + w.how + ')');
  });

  var out = (live ? 'APPLIED' : 'DRY RUN, no triggers installed. Re-run with true as the first argument to apply.') +
    '\nTrigger set: ' + scope + '\n' + plan.join('\n') +
    (scope === 'dashboard'
      ? '\n\nweeklyReminderJob was not touched. Nothing installed here sends email.'
      : '') +
    '\n\nExisting triggers on this project: ' +
    (have.length ? have.join(', ') : 'none');
  Logger.log(out);
  return out;
}

/**
 * Install ONLY the nightly roster refresh and dashboard rebuild.
 *
 * Nothing this installs sends email. nightlyDashboardJob refreshes the roster
 * from the staff group, marks leavers as Left, reactivates returners, then
 * rebuilds the Dashboard sheet. All of that is safe to run unattended, and the
 * roster genuinely needs it: group membership changes daily, so without this
 * the completion denominator drifts away from reality within a week.
 *
 * This is the one to install while reminders are still being tested. Add the
 * weekly reminder separately, later, with RUN_REMINDER_TRIGGER_FOR_REAL(), and
 * from the sending account rather than from here.
 */
function RUN_DASHBOARD_TRIGGER_FOR_REAL() {
  return installTriggers(true, 'dashboard');
}

/**
 * Install ONLY the weekly reminder. RUN THIS AS THE SENDING ACCOUNT.
 *
 * Which account clicks Run here matters more than anything else in this file. A
 * time-based trigger runs as whoever created it, and Apps Script sends mail as
 * whichever account is running, so whoever installs this is the address every
 * recipient sees on the morning it goes out.
 *
 * That is why this is separate from RUN_TRIGGERS_FOR_REAL, which installs both
 * and would hand the nightly dashboard job to the same account. The nightly job
 * must NOT belong to the training mailbox: it refreshes the roster from the
 * staff group through the Admin SDK, which needs Workspace admin rights that
 * account does not have, so it would fail every night at 5am and the completion
 * denominator would quietly go stale while everything looked fine.
 *
 * So: the sending account owns this one, an admin owns the nightly one, and
 * neither installs the other. DIAGNOSE_MAIL() in Reminders.gs reports which
 * triggers the account you are currently signed in as actually owns.
 */
function RUN_REMINDER_TRIGGER_FOR_REAL() {
  return installTriggers(true, 'reminders');
}

/**
 * Remove scheduled triggers. Dry run unless apply is true.
 *
 * @param {boolean} apply  Pass true to delete. Anything else = dry run.
 * @param {string}  only   'all', 'dashboard' or 'reminders'. Defaults to 'all'.
 */
function removeTriggers(apply, only) {
  var live = (apply === true);
  var scope = String(only || 'all').toLowerCase();
  var byScope = { dashboard: 'nightlyDashboardJob', reminders: 'weeklyReminderJob' };
  var target = byScope[scope] || null;

  var plan = [];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (target && fn !== target) return;
    if (!live) { plan.push('  WOULD DELETE ' + fn); return; }
    ScriptApp.deleteTrigger(t);
    plan.push('  DELETED ' + fn);
  });

  var out = (live ? 'APPLIED' : 'DRY RUN, nothing deleted. Re-run with true as the first argument to apply.') +
    '\nTrigger set: ' + scope + '\n' + (plan.length ? plan.join('\n') : '  nothing matched');
  Logger.log(out);
  return out;
}

/**
 * Settle, in one run, why the roster will not load.
 *
 * Reads nothing and writes nothing. Run it from the editor and paste the whole
 * execution log back.
 *
 * It exists because the error we have been chasing, "An error occurred while
 * looking up roles in the group", is GroupsApp's wording, and this project no
 * longer calls GroupsApp anywhere. Either the deployed code is not the code on
 * disk, or the Admin SDK really is producing that string. Step 1 below tells
 * you which, because the stamp only exists in the current version of this file.
 */
function DIAGNOSE_ROSTER() {
  var L = [];
  function say(s) { L.push(s); }

  say('1. BUILD STAMP: ' + SETUP_BUILD);
  say('   If this line is missing or the function is not in the Run dropdown,');
  say('   the editor is running an older Setup file and nothing below matters.');
  say('');

  say('2. WHO IS RUNNING THIS');
  try { say('   Effective user: ' + Session.getEffectiveUser().getEmail()); }
  catch (e) { say('   Effective user: unavailable (' + e.message + ')'); }
  say('');

  say('3. ADMIN SDK ADVANCED SERVICE');
  say('   typeof AdminDirectory = ' + (typeof AdminDirectory));
  if (typeof AdminDirectory === 'undefined') {
    say('   Not enabled. It should be declared in appsscript.json under');
    say('   dependencies.enabledAdvancedServices. If that block is missing from the');
    say('   manifest, every clasp push strips the service back out again.');
    say('   Re-add in the editor: Services, then +, then Admin SDK API, AdminDirectory.');
    Logger.log(L.join('\n'));
    return L.join('\n');
  }
  say('');

  say('4. GROUP METADATA (optional, expected to fail)');
  say('   Groups.get needs admin.directory.group.readonly, which this project');
  say('   deliberately does not request: reading membership does not require it,');
  say('   and the narrower scope is the one we can justify. A permissions error');
  say('   on this step is the correct result, not a problem. Step 5 is the real test.');
  try {
    rosterGroupEmails_().forEach(function (ge) {
      var g = AdminDirectory.Groups.get(ge);
      say('   Resolved anyway: ' + g.email + ', ' + (g.directMembersCount || '?') + ' direct members.');
    });
  } catch (e) {
    say('   Not available, as expected: ' + describeError_(e));
  }
  say('');

  say('5. ONE PAGE OF MEMBERS, CALLED DIRECTLY');
  try {
    rosterGroupEmails_().forEach(function (ge) {
      say('   ' + ge);
      var page = AdminDirectory.Members.list(ge, { maxResults: 5 });
      var members = page.members || [];
      say('     OK. ' + members.length + ' returned on the first page of 5.');
      members.forEach(function (m) {
        say('       ' + m.type + '  ' + (m.status || '') + '  ' + m.email);
      });
      say('     More pages: ' + (page.nextPageToken ? 'yes' : 'no'));
    });
  } catch (e) {
    say('   FAILED: ' + describeError_(e));
    say('');
    say('   How to read this:');
    say('     "roles in the group"        -> GroupsApp is still running, so the');
    say('                                   deployed Setup file is stale. Push again.');
    say('     "Not Authorized"            -> the script has not been re-authorised');
    say('                                   since the scopes changed. Run any function');
    say('                                   and accept the consent screen.');
    say('     "Insufficient Permission"   -> the account running this is not a Workspace');
    say('                                   admin with group membership read rights.');
    say('     "notFound" / "Resource Not Found" -> the group address is wrong.');
  }
  say('');

  say('6. SCOPES THIS PROJECT DECLARES');
  getManifestScopes_().forEach(function (s) { say('   ' + s); });

  var out = L.join('\n');
  Logger.log(out);
  return out;
}

function pad2_(n) { return (n < 10 ? '0' : '') + n; }

function titleCase_(s) {
  var t = String(s).toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Pull every useful field off an Apps Script / advanced service error. */
function describeError_(e) {
  var bits = [];
  bits.push(String(e && e.message ? e.message : e));
  if (e && e.name) bits.push('name=' + e.name);
  if (e && e.details && e.details.code) bits.push('code=' + e.details.code);
  if (e && e.details && e.details.message) bits.push('detail=' + e.details.message);
  return bits.join(' | ');
}
