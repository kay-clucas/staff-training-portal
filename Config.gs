/**
 * Example Academies Training Platform: tenant and routing configuration.
 *
 * Everything in this file is a VALUE, not logic. If you are changing who sees
 * what, or an address, a link or a colour, it should be changeable here and
 * nowhere else. If you find yourself adding an "if" to this file, it probably
 * belongs in Courses.gs or Code.gs instead.
 *
 * Course CONTENT never lives here. That is Content.gs and the other course
 * files, registered through Courses.gs.
 */

/* --------------------------------------------------------------- the org */

var ORG = {
  name: 'Example Academies',
  shortName: 'Example Academies',

  // General IT help desk. Overridable per deployment via the SUPPORT_EMAIL
  // script property, which is what supportEmail_() in Code.gs reads.
  supportEmail: 'itsupport@academies.example.org',

  // Where suspected phishing and security incidents go. Deliberately separate
  // from the help desk: a security report should not sit in a general queue.
  // TODO(maintainer): confirm. Falls back to supportEmail wherever it is used, so a
  // wrong value here sends security reports into the general queue.
  securityEmail: 'itsupport@academies.example.org',

  /**
   * Who automated email appears to come from.
   *
   * By default Apps Script sends as whoever authorised the trigger, which means
   * the sender is a person's personal mailbox and changes silently if somebody
   * else ever reinstalls the schedule. These three values move that out of the
   * code and into one place.
   *
   * There are two ways to make mail come from training@, and this deployment
   * uses the simpler one.
   *
   *   1. THE ONE IN USE. training@ owns the weekly trigger, so it is the
   *      account running the job, so MailApp sends as it with no alias, no
   *      extra scope and no code involved. senderAccount below records that
   *      decision and sendReminders refuses to send for real from any other
   *      account, which is what stops a manual run by a person putting their
   *      own address on 1600 emails.
   *
   *   2. THE FALLBACK. Somebody else owns the trigger and sends AS training@.
   *      Set fromAddress and every send switches to GmailApp, which is the only
   *      one that takes a from option. Google then requires the address to be a
   *      verified send-as alias in that account's own Gmail settings, which
   *      delegated access to the mailbox does NOT provide, and it needs
   *      https://www.googleapis.com/auth/gmail.send added to appsscript.json
   *      and to getManifestScopes_() in Code.gs. sendMail_() checks both and
   *      explains itself rather than throwing a raw Google error.
   *
   * DIAGNOSE_MAIL() reports which of these you are actually in.
   *
   * A no-reply address is a policy choice, not just a name: the reminder body
   * invites a reply, so if you use one, replyTo has to carry the weight.
   */
  mail: {
    fromName: 'Example Academies Training',

    // The account the weekly job is meant to run as, and therefore the address
    // staff see. A guard, not a mechanism: setting it does not make mail come
    // from here, owning the trigger does. It exists so that the wrong account
    // running RUN_REMINDERS_FOR_REAL is caught before 1600 emails go out with a
    // person's name on them. Blank turns the check off.
    // DELIBERATELY UNSET, and the guard below has been changed to match.
    //
    // CORRECTION, 21 Sep 2026. the author's original code read
    //   if (live && expected && actual !== expected) { refuse }
    // so a BLANK senderAccount switched the check OFF rather than on. Leaving it
    // blank was therefore the least safe setting, not the safest, and an earlier
    // comment here said the opposite. sendReminders now refuses to send live
    // when this is blank. Blank means "nobody has decided who sends", and that
    // is a reason to stop, not a reason to proceed as whoever pressed the button.
    //
    // TODO(maintainer): the EA training mailbox, or itsupport@academies.example.org.
    senderAccount: '',

    // Blank on purpose. See route 1 above.
    fromAddress: '',

    // Replies land back in the training mailbox, not in the IT help desk queue.
    // Set deliberately rather than left blank: blank falls back to the from
    // address and then to supportEmail_(), and a silent fallback to a different
    // team's queue is exactly the kind of thing nobody notices for a month.
    // TODO(maintainer): change if a dedicated training mailbox is created.
    replyTo: 'itsupport@academies.example.org'
  },

  /**
   * Browser tab icon. A mortarboard on the brand maroon.
   *
   * The URL must END IN A FILE EXTENSION. This is settled, not a guess:
   * TEST_FAVICON() in Code.gs tried every Google Drive URL form on
   * 18 September 2026 and Apps Script refused all of them with "The favicon
   * icon image type is not supported", while accepting a plain .ico on another
   * host. It validates the extension in the URL, not the content the URL
   * serves, which is why a Drive link that genuinely returns a PNG was still
   * refused. No Drive or Google Sites URL can ever satisfy this, however the
   * file is shared. Do not spend time retrying them.
   *
   * Hence a Cloud Storage bucket, where the object keeps its .png name.
   * Verified publicly readable by an anonymous fetch with no Google
   * credentials, which is what matters: Google fetches favicons anonymously.
   *
   * If this ever needs to move, run TEST_FAVICON() on the new URL before
   * deploying. withFavicon_() in Code.gs ignores anything that is not an https
   * URL and swallows a rejection, so a wrong value costs the icon, not the app.
   */
  favicon: 'https://www.google.com/favicon.ico',

  /**
   * Links every course can refer to. Held here rather than in each course file
   * so a policy that moves is changed once, not once per course.
   * getContentJson() in Courses.gs merges these into the course it serialises,
   * and a course may override any of them with its own links entry.
   */
  links: {
    acceptableUse: 'https://example.org/policies/acceptable-use',
    aiAcceptableUse: 'https://example.org/policies/ai-acceptable-use',
    supportRequest: 'https://example.org/support',
    // The ONE published address, the static front door that probes both
    // deployments. This is where a sign-out sends somebody back to: never a
    // deployment's own /exec URL, because the whole point of signing out is
    // that we no longer know which Workspace they belong to.
    portal: 'https://training.academies.example.org',
    whistleblower: 'https://example.org/report-concern',
    changePassword: 'https://support.google.com/a/answer/6236387',
    itSupportEmail: 'itsupport@academies.example.org',
    // TODO(maintainer): EA has no separate security address yet. Pointed at IT support
    // deliberately rather than left blank, because the cyber course tells staff
    // to report phishing here and a blank address would render as a dead link
    // in the one module where acting quickly matters.
    securityEmail: 'itsupport@academies.example.org'
  },

  // Brand palette. See the EE brand guidelines for the full set and the
  // contrast measurements behind these choices.
  brand: {
    maroon: '#7b0b18',        // EA crimson. Primary, brand and CTA. Matches
                              // --crimson in Index.html, which was already on
                              // this value: the two must not drift apart.
    darkMaroon: '#4a0710',    // logo fill, deepest headings
    crimsonRed: '#f5170d',    // ACCENT ONLY. Fails body-text contrast at 3.73:1
    mocha: '#1d150e',         // body text
    walnut: '#56412e',        // secondary text
    sand: '#ae8c6f',          // borders and rules, never text
    beige: '#dac9bb',
    mist: '#f5f1ee'           // page background
  }
};

/* ----------------------------------------------------------- who is this */

/**
 * Which audience an email address belongs to.
 *
 * The rule is two named domains plus a wildcard, NOT a list of every Example
 * domain. That is deliberate. New domains get added to the Workspace from time
 * to time, and a whitelist would fail silently: a new domain would match
 * nothing and its people would be shown no training at all. With a wildcard
 * default, a domain nobody has told us about still gets the compliance
 * courses, which is the right way round for training that exists to prove
 * coverage.
 *
 * Add a domain here only to move it OUT of the default.
 */
/**
 * Who can do what.
 *
 * Deliberately capability-based rather than a list of admin addresses. Code asks
 * can_(email, 'manageAdmins'), never isAdmin_(email), so adding a role later is
 * a data change here rather than an edit to every check in the codebase.
 *
 * courseAdmin is declared but NOT yet grantable from the dashboard. It exists so
 * that the Admins sheet, the payload and the permission checks all already
 * understand the idea of more than one role on the day it is switched on.
 */
var ROLES = {
  owner: {
    label: 'Owner',
    grantable: false,          // the script owner, implicit, cannot be removed
    can: ['viewDashboard', 'manageAdmins', 'manageCourses']
  },
  admin: {
    label: 'Administrator',
    grantable: true,
    can: ['viewDashboard', 'manageAdmins']
  },
  courseAdmin: {
    label: 'Course administrator',
    grantable: false,          // planned, not yet in use
    can: ['viewDashboard', 'manageCourses']
  }
};

/** The role given to someone added through the dashboard today. */
var DEFAULT_ROLE = 'admin';

/**
 * The starting administrators, used ONCE to populate an empty Admins sheet.
 *
 * After that first run the sheet is the source of truth and this list is
 * ignored, so removing someone in the dashboard is not undone by a later push.
 * Names are filled in from the Directory at seed time, not typed here.
 */
//
// CUT DOWN FROM AUTHOR'S LIST ON PURPOSE. His ten seed administrators are Example
// Education staff; seeding them here would give EE people the dashboard for
// every Example Academies school, including the roster and every individual's
// results. Starting with the two accounts that have to be able to get in, and
// adding the rest through the dashboard, is both least privilege and easier to
// undo than a seeded sheet.
//
// TODO(maintainer): add whoever else needs the dashboard on day one.
var SEED_ADMINS = [
  'itsupport@academies.example.org',
  'admin-primary@academies.example.org',
  // maintainer's Example Education account. Listed so that a fresh deployment seeds it
  // too, but note WHERE it can actually be used: a EE address cannot be
  // identified by the EA deployment at all (different Workspace, execute-as-me),
  // so it reaches the admin dashboard on the EOA deployment only. Both
  // deployments read the same Admins sheet in the same workbook, so one entry
  // covers both and the dashboard shows the same data either way.
  'admin-secondary@education.example.org'
];

var AUDIENCE_BY_DOMAIN = {
  // --- Example Academies, EA Workspace (academies.example.org is primary,
  //     the school domains are secondary domains in that same Workspace) ---
  'academies.example.org': 'academies',
  'riverside.example.org': 'academies',
  'hillcrest.example.org': 'academies',
  'northbridge.example.org': 'academies',
  // FOUND BY DIAGNOSE_ROSTER, 21 Sep 2026, not on the original domain list.
  // The all-staff@northbridge.example.org group is almost entirely accounts on THIS
  // domain, not on northbridge.example.org. Both are live and both are staff.
  //
  // Access was never at risk: DEFAULT_AUDIENCE is 'academies', so these people
  // would have been let in by the wildcard. The damage would have been in the
  // reporting. businessUnitFor_ falls back to the raw domain for anything it
  // does not recognise, so Northbridge would have appeared as two
  // separate lines on the dashboard, one named after a domain, and the school's
  // completion rate would have been split across them.
  'northbridge-academy.example.org': 'academies',

  // --- Example Online Academy, EE Workspace ---
  'online.example.org': 'academies',
  'online-academy.example.org': 'academies',

  // --- Example Education's own domain, EE Workspace ---
  // Named explicitly rather than left to the wildcard, because this is the
  // domain that generated the ticket and the decision behind it should be
  // readable here rather than inferred from a script property.
  //
  // EOA staff on a EE address and EE staff proper are indistinguishable by
  // address, so the platform stops trying. Everyone on this domain gets the
  // training. The other fourteen EE brand domains are handled the same way by
  // DEFAULT_AUDIENCE, which is why they are not all listed here.
  'education.example.org': 'academies',

  // --- explicitly out ---
  // Students are not staff and must never be counted in the denominator.
  'student.northbridge.example.org': 'excluded',
  'student.online.example.org': 'excluded',
  // Partner Academy addresses are ALIASES on existing EOA accounts, not accounts of
  // their own. The person behind one is already covered under their EOA
  // address; letting the alias in would give them a second, separate record and
  // count them twice.
  'partner-academy.example.org': 'excluded'
};

/**
 * What to do with a domain that is not listed above.
 *
 * PER DEPLOYMENT, via the DEFAULT_AUDIENCE script property, because the right
 * answer genuinely differs between the two:
 *
 *   EA deployment   -> 'academies'. Anyone this deployment can identify is by
 *                      definition in the EA Workspace, so an unlisted domain is
 *                      a school domain nobody told us about. Showing them the
 *                      compliance courses is the right way to be wrong.
 *   EOA deployment  -> 'ce'. It sits in the Example Education Workspace, so an
 *                      unlisted domain there is one of the other Example
 *                      Education brands, who belong on the author's platform.
 *
 * THE WILDCARD IS NOT HOW education.example.org GETS IN. That domain is listed
 * explicitly above, deliberately, so that the main EE domain is admitted and
 * the fourteen other EE brand domains are NOT. Widening the wildcard would let
 * Study Resources, College Advising, Learning Centres and the rest into Example
 * Academies training, which is not wanted.
 *
 * KNOWN, 14 Oct 2026: those fourteen currently reach a dead end, because they
 * route to 'ce' and EE_TRAINING_URL has never been set. maintainer's call is to leave
 * that for now. Setting that one property turns the dead end into a working
 * redirect whenever somebody wants to.
 *
 * Defaulting to 'excluded' would be the dangerous choice: a new school domain
 * would silently show nobody any training and nothing would look broken.
 */
function defaultAudience_() {
  return scriptProp_('DEFAULT_AUDIENCE') || 'academies';
}

/**
 * What each audience gets.
 *
 * 'cga' is served by the separate, existing EOA training web app, so this
 * platform only redirects to it. Nothing about that course lives here and
 * nothing here writes to its results.
 *
 * 'ce' course ids must match the ids registered in Courses.gs. Order is the
 * order they appear on the picker.
 */
var CATALOGUE = {
  // Served here. Both deployments of this codebase show exactly this, so a EOA
  // teacher and a Hillcrest teacher sit the same course and land in the same
  // results workbook.
  academies: {
    label: 'Example Academies',
    redirect: false,
    courses: ['cyber', 'safeguarding']
  },

  // Still reached, by the fourteen Example Education brand domains that are not
  // education.example.org: Study Resources, College Advising, Learning Centres, Indigo
  // Research and the rest. They fall to the wildcard, which is 'ce' on the EOA
  // deployment.
  //
  // EE_TRAINING_URL IS NOT SET, so today that is a dead end rather than a
  // redirect: redirectPage_ renders "Training has moved" and names the missing
  // property. Live since the all-staff launch. Set the property to fix it.
  ce: {
    label: 'Example Education',
    redirect: true,
    urlProperty: 'EE_TRAINING_URL'
  },

  // Students and alias-only domains. Not a redirect and not an empty course
  // list: both of those produce a vague "nothing assigned" page that looks like
  // a fault and generates a ticket. This says plainly that the account is not
  // one this training covers.
  excluded: {
    label: 'Not covered by staff training',
    redirect: false,
    deny: true,
    denyMessage: 'This training is for staff accounts. The address you are signed in with is a ' +
      'student or alias account, so there is nothing here for it. If you are staff, sign in with ' +
      'your staff address and try again.',
    courses: []
  }
};

/* ------------------------------------------------- the other deployment */

/**
 * The twin deployment of this same codebase in the other Google Workspace.
 *
 * WHY A SECOND DEPLOYMENT EXISTS AT ALL. Example Academies staff sit in two
 * separate Google Workspaces. A web app deployed "execute as me" is only told
 * the identity of a user in the SAME Workspace as the script owner. For anyone
 * else Session.getActiveUser().getEmail() comes back blank, whatever the
 * sharing settings say; this is Google's behaviour and there is no setting
 * that changes it. Deploying "execute as the user accessing" would fix the
 * identity, but then every write happens as that user, so every member of
 * staff would need edit access to the results workbook and could edit their
 * own results. Neither is acceptable, so the same code is deployed once in
 * each Workspace and the two hand users over to each other.
 *
 * Both deployments write to the SAME results workbook in a shared drive, so
 * there is one roster, one dashboard and one set of results no matter which
 * door somebody came through.
 *
 * ONLY ONE LINK IS EVER PUBLISHED. Bright carries the primary deployment's URL
 * and nothing else. Someone from the other Workspace lands there, is not
 * recognised, and is handed over with one click. They cannot go to the wrong
 * portal because they are never given a second address.
 */
var TENANT = {
  // Which of the two this deployment is. Set per deployment with the
  // TENANT_KEY script property; the value here is only the fallback for a
  // fresh copy that has not been configured yet. Used to label the handover
  // and, more importantly, to stop the two portals bouncing a user between
  // them forever: see HANDOVER_PARAM below.
  defaultKey: 'unconfigured',

  // The other deployment's /exec URL. A script property rather than a constant
  // so the URL can be set without a code change, and so that a missing value
  // produces a readable message instead of a link to nowhere.
  partnerUrlProperty: 'PARTNER_PORTAL_URL',

  // What the other side is called on the handover page, e.g. "Example
  // Academies". Also a script property, so one codebase can describe either
  // direction without an if.
  partnerLabelProperty: 'PARTNER_PORTAL_LABEL',

  // The query parameter each portal adds when it hands a user over. If a
  // portal receives it and STILL cannot identify the person, it stops and says
  // so rather than handing back. Without this, an account that neither
  // Workspace recognises (a personal Gmail, a signed-out browser) would be
  // volleyed between the two deployments indefinitely.
  handoverParam: 'from'
};

/** Which deployment this is. Never throws: an unset property is a label, not a failure. */
function tenantKey_() {
  return scriptProp_('TENANT_KEY') || TENANT.defaultKey;
}

/** The other deployment's URL, or empty string if it has not been set yet. */
function partnerPortalUrl_() {
  return scriptProp_(TENANT.partnerUrlProperty) || '';
}

/** What to call the other deployment on the handover page. */
function partnerPortalLabel_() {
  // NO trailing noun. Callers add their own wording around this, and a default
  // that already said "portal" produced "the other Example training portal
  // portal" on a deployment where the property had not been set.
  return scriptProp_(TENANT.partnerLabelProperty) || 'Example';
}

/**
 * People whose address does not say which organisation they work for.
 *
 * EMPTY ON PURPOSE SINCE 14 OCT 2026, and the reason is worth keeping.
 *
 * This used to name eight EOA staff who hold @education.example.org addresses,
 * because by domain alone they looked like Example Education and were sent to
 * the EE platform. It worked for those eight and silently failed for everybody
 * who joined EOA on a EE address afterwards: the first report was somebody
 * hitting a "Training has moved" dead end, and the second was that the EE
 * platform's URL had never been configured, so there was nothing on the other
 * side of the redirect either.
 *
 * maintainer's call, and it removes the whole class of problem: do not try to tell a
 * EOA person from a EE person by their address. Let every Example Education
 * address into this training. EOA staff know to come here and EE staff know to
 * use their own portal, so the cost of a EE walk-in is one extra attempt row,
 * while the cost of guessing wrong was somebody sitting no training at all.
 *
 * That is now done by DEFAULT_AUDIENCE on the EOA deployment, not by a list.
 * See defaultAudience_() below.
 *
 * Leave this object here, and empty. It is still the right escape hatch for one
 * person who genuinely needs treating differently from their domain, and an
 * empty object costs nothing.
 */
var AUDIENCE_BY_EMAIL = {
};

/** The school these named people are reported under, whatever their domain says. */
var BUSINESS_UNIT_BY_EMAIL = {
  'staff01@education.example.org': 'EOA',
  'staff02@education.example.org': 'EOA',
  'admin-secondary@education.example.org': 'EOA',
  'staff03@education.example.org': 'EOA',
  'staff04@education.example.org': 'EOA',
  'staff05@education.example.org': 'EOA',
  'staff06@education.example.org': 'EOA',
  'staff07@education.example.org': 'EOA'
};

/** An address, lowercased and trimmed, for use as a map key. */
function emailKey_(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * The domain part of an email address, lowercased. Empty string if there
 * isn't one.
 */
function domainOf_(email) {
  var at = String(email || '').lastIndexOf('@');
  if (at < 0) return '';
  return String(email).substring(at + 1).toLowerCase().trim();
}

/**
 * Resolve an address to an audience key. Unknown domains fall through to the
 * wildcard, so this never returns empty for a well-formed address.
 */
function audienceFor_(email) {
  // The named exceptions win. Deliberately first: the whole reason somebody is
  // on that list is that their domain gives the wrong answer for them.
  var key = emailKey_(email);
  if (AUDIENCE_BY_EMAIL.hasOwnProperty(key)) return AUDIENCE_BY_EMAIL[key];

  var domain = domainOf_(email);
  if (domain && AUDIENCE_BY_DOMAIN.hasOwnProperty(domain)) {
    return AUDIENCE_BY_DOMAIN[domain];
  }
  return defaultAudience_();
}

/**
 * The catalogue entry for an address. Always returns an object.
 */
function catalogueFor_(email) {
  var key = audienceFor_(email);
  return CATALOGUE[key] || CATALOGUE[defaultAudience_()] || CATALOGUE.academies;
}

/**
 * Where EOA staff and students should be sent instead.
 * Stored as a script property rather than a constant so the URL can be set
 * without a code change, and so a missing value produces a readable message
 * rather than a redirect to nowhere.
 */
function redirectUrlFor_(entry) {
  if (!entry || !entry.urlProperty) return '';
  return scriptProp_(entry.urlProperty);
}

/**
 * Who this platform is responsible for.
 *
 * The population is the example-staff group, not "every user in the Workspace".
 * That distinction matters: a Workspace-wide user list would sweep in EOA staff
 * and the student accounts on student.online.example.org, none of whom take these
 * courses, and completion would be reported against a denominator that is
 * mostly people who were never assigned anything.
 */
/**
 * THE ROSTER IS NOT ACCESS CONTROL. Worth stating plainly, because the opposite
 * is the natural assumption and it is wrong here.
 *
 * Access is decided by EMAIL DOMAIN alone: audienceFor_() -> catalogueFor_(),
 * neither of which reads the roster or any group. Somebody on a listed domain
 * gets their courses whether or not any group has ever heard of them, and
 * recordAttempt saves their result the same way.
 *
 * What the roster decides is who gets CHASED and who is COUNTED: the weekly
 * reminder list, the dashboard denominator, and the name, department and
 * manager columns written onto each attempt row. A person missing from every
 * group can still sit and pass the training; their row simply carries blank
 * name and manager, and they are absent from the completion percentage.
 *
 * That separation is deliberate and it is what makes the badly-maintained
 * groups survivable: the worst a stale group can do is under-report, never lock
 * a member of staff out of training they are required to complete.
 */
var ROSTER = {
  // PER DEPLOYMENT. Each Workspace has its own staff group and each deployment
  // may only read its own directory, so this is read from the ROSTER_GROUP
  // script property first. The constant below is the fallback for an
  // unconfigured copy: rosterGroupEmail() is what the code actually calls, so
  // there is one place to change this and no way to read the raw value by
  // accident.
  //
  // TODO(maintainer): set ROSTER_GROUP on each deployment before the first refresh.
  // Comma-separated, because the EA Workspace has one staff group per school
  // rather than one group for the lot. Membership is merged and de-duplicated,
  // so a person in two groups is one roster row.
  //
  //   EA deployment  ROSTER_GROUP =
  //     all-staff@academies.example.org,all-staff@northbridge.example.org,
  //     allstaff@riverside.example.org,classroom_teachers@hillcrest.example.org
  //   EOA deployment ROSTER_GROUP =
  //     online-all-staff@online.example.org
  //
  // NOTE: these groups are known to be imperfectly maintained. Until they are
  // automated, the roster is only as good as they are, and the dashboard
  // denominator inherits every gap. DIAGNOSE_ROSTER() reports what each group
  // actually returned, per group, so a group that has gone stale or empty shows
  // up as a number rather than as quietly missing people.
  groupEmailFallback: '',

  // Generic, shared and service accounts that belong to the group but are not
  // people. They would otherwise sit permanently outstanding and be emailed
  // every week forever, which is how staff learn to ignore the reminders.
  //
  // Several of these are themselves group addresses. That matters: a group
  // address that is a member of example-staff shows up through getGroups(), not
  // getUsers(), so excluding it as a user would not stop the walk recursing
  // into it and pulling in everyone inside. The list is therefore applied at
  // BOTH points, as a user and as a group to walk.
  // TODO(maintainer): EA's own generic and shared accounts. the author's eighteen EE service
  // accounts have been removed: they can never match an address in a EA staff
  // group, so keeping them would only make this list look maintained when it is
  // not.
  //
  // This matters more than it looks. An unexcluded shared mailbox that sits in a
  // staff group is permanently outstanding, gets chased every week forever, and
  // drags the completion figure down by a fixed amount that never resolves.
  // That is how staff learn to ignore the reminders.
  //
  // Several EE entries were themselves group addresses, which is why the list is
  // applied both as a user and as a group to walk. Keep that in mind when
  // filling it in: a shared address that is a group needs to be here to stop the
  // walk descending into it.
  excludeAddresses: [
    // Confirmed by maintainer, 21 Sep 2026, as shared or generic accounts rather than
    // people. Found in the staff groups by the first roster run.
    'dev@academies.example.org',
    'admin@northbridge.example.org',
    'admin@riverside.example.org',
    'admin@hillcrest.example.org'
  ],

  // Nested groups are walked. This caps the recursion in case the group graph
  // ever contains a cycle or gets unexpectedly deep.
  maxGroupDepth: 6
};

/**
 * When the scheduled jobs run.
 *
 * HOURS ARE IN THE SCRIPT'S TIME ZONE, which is the timeZone field of
 * appsscript.json, currently Pacific/Auckland. They are not in Brisbane time
 * and not in the viewer's time. Change the manifest if you want that to move,
 * not these numbers.
 *
 * The roster refresh must land AFTER whatever populates the staff group, or it
 * spends a day working from yesterday's membership.
 *
 * Changing an hour here does NOT move a trigger that is already installed.
 * installTriggers never touches an existing trigger, deliberately, so that a
 * hand-tuned schedule is not silently reset. To move one: removeTriggers(true,
 * 'dashboard') then RUN_DASHBOARD_TRIGGER_FOR_REAL().
 */
var SCHEDULE = {
  dashboardHour: 5,                       // nightly roster refresh, then dashboard rebuild
  reminderHour: 8,                        // weekly chase
  // A ScriptApp.WeekDay name. Setup.gs reads this for both the trigger it
  // creates and the schedule it reports, so this line is the single statement
  // of which day the chase goes out. Note the warning above: changing it does
  // NOT move a trigger that already exists.
  reminderDay: 'TUESDAY'
};

/**
 * The staff group this deployment is responsible for.
 *
 * Fails loudly rather than returning empty: a blank group silently produces an
 * empty roster, which looks like "everybody is compliant" on the dashboard.
 * That is the single most dangerous wrong answer this platform can give, so it
 * throws instead.
 */
function rosterGroupEmails_() {
  var raw = scriptProp_('ROSTER_GROUP') || ROSTER.groupEmailFallback;
  var list = String(raw || '').split(',')
    .map(function (g) { return g.trim(); })
    .filter(function (g) { return g.length > 0; });
  if (!list.length) {
    throw new Error('No staff groups are configured for this deployment. Set the ROSTER_GROUP ' +
      'script property to the group, or comma-separated groups, containing the staff this portal ' +
      'covers. Refusing to build a roster from nothing, because an empty roster reads as full ' +
      'compliance on the dashboard.');
  }
  return list;
}

/** The configured groups as one readable string, for log lines and reports. */
function rosterGroupLabel_() {
  return rosterGroupEmails_().join(', ');
}

/** Is this address a generic or shared account rather than a person? */
function isExcludedAccount_(email) {
  var e = String(email || '').toLowerCase().trim();
  for (var i = 0; i < ROSTER.excludeAddresses.length; i++) {
    if (String(ROSTER.excludeAddresses[i]).toLowerCase().trim() === e) return true;
  }
  return false;
}

/**
 * The business unit an address belongs to, recorded against every result so
 * completion can be reported per unit.
 *
 * Derived from the email domain, which is reliable and needs no extra
 * permission. The org unit path in the Directory carries the same information
 * but is admin-maintained and needs the Admin SDK, so it is used to enrich the
 * Roster sheet rather than to decide anything.
 */
/**
 * How long a pass stays valid before the person has to do it again.
 *
 * This is the ONLY thing that makes a pass stop counting. Bumping a course's
 * version no longer does, anywhere: the picker, the admin dashboard, the
 * Dashboard sheet and the weekly reminder all ask the same question, which is
 * whether the person passed inside this window. Someone who sat the course a
 * fortnight ago is compliant whether or not the wording has been edited since.
 *
 * The version is still stamped on every record, and the most-missed-questions
 * analysis is still scoped to it, because a question id only means anything
 * within the version that asked it.
 *
 * Set months to 0 to turn expiry off entirely for a course, in which case
 * nothing ever makes it due again and it is a once-in-a-career requirement.
 *
 * A course can override the default with recertifyMonths in its own definition,
 * which is how you would keep safeguarding on a shorter cycle than the rest.
 */
var RECERTIFY = {
  defaultMonths: 12,

  // How long before the due date someone is told it is coming. They are not
  // chased in this window, the picker simply says "due soon", so the message
  // when it does arrive is not the first they hear of it.
  warnDaysBefore: 30
};

var BUSINESS_UNIT_BY_DOMAIN = {
  'education.example.org': 'Example Education',
  'brand-01.example.org': 'Example Education',
  'brand-02.example.org': 'Example Education',
  'brand-03.example.org': 'Example Education',
  'brand-04.example.org': 'Example Education',
  'brand-05.example.org': 'Example Education',
  'brand-06.example.org': 'Example Education',
  'brand-07.example.org': 'Example Education',
  'brand-08.example.org': 'Example Education',
  'brand-09.example.org': 'Example Education',
  'brand-10.example.org': 'Example Education',
  'brand-11.example.org': 'Example Education',
  'brand-12.example.org': 'Study Resources',
  'brand-13.example.org': 'College Advising',
  'brand-14.example.org': "Learning Centres",
  'online.example.org': 'EOA',
  'online-academy.example.org': 'EOA',
  'student.online.example.org': 'EOA Students',

  // THE SCHOOL IS THE ONLY GROUPING THE DASHBOARD USES. Department and Team
  // were removed on 21 Sep 2026: the EA Admin console does not populate
  // Department, so the breakdown was a single bucket called "(not set)". School
  // is derived from the email domain, which is always present and always
  // current, so it cannot rot the same way.
  //
  // Names here are exactly what appears on the dashboard, so they are the names
  // maintainer asked for rather than the schools' full legal titles. Both domains for
  // a school must map to the SAME string or it splits into two lines.
  //
  // The EE entries above are kept: a EE address can still appear as somebody's
  // manager on a roster row even though EE staff are never in the roster.
  'academies.example.org': 'Example Academies Org',
  'riverside.example.org': 'Riverside School',
  'hillcrest.example.org': 'Hillcrest School',
  // Both domains report as one school, which is the point of mapping them here
  // rather than letting businessUnitFor_ fall back to the domain string.
  'northbridge.example.org': 'Northbridge Academy',
  'northbridge-academy.example.org': 'Northbridge Academy',
  'student.northbridge.example.org': 'Northbridge Students'
};

/**
 * Every school the dashboard reports on, in the order they should appear.
 *
 * Listed rather than derived from BUSINESS_UNIT_BY_DOMAIN, because that map
 * also carries the Example Education business units and the student domains,
 * which are not schools this platform trains.
 */
var ALL_SCHOOLS = [
  'Northbridge Academy',
  'EOA',
  'Example Academies Org',
  'Riverside School',
  'Hillcrest School'
];

/**
 * The schools THIS deployment is responsible for rostering.
 *
 * WHY THIS EXISTS. Both deployments write to one workbook, and refreshRoster
 * marks anybody who is not in its staff groups as Left. Without this, the two
 * deployments fight: the EOA refresh marks all 68 NZ staff Left because they
 * are not in online-all-staff, then the EA refresh marks all 500 EOA staff Left
 * because they are not in the NZ groups, and the dashboard shows whichever ran
 * last. That is exactly what happened on 21 Sep 2026: 502 staff, of whom 501
 * were EOA and one was everybody else.
 *
 * So a refresh may only mark Left a person who belongs to a school it rosters.
 * Everyone else's row is left exactly as it is.
 *
 * Set per deployment with the ROSTER_SCHOOLS script property, comma-separated.
 * Unset means "all of them", which is correct for a single-deployment install
 * and wrong for this one, so both deployments must set it.
 */
function rosterSchools_() {
  var raw = String(scriptProp_('ROSTER_SCHOOLS') || '').trim();
  if (!raw) return ALL_SCHOOLS.slice();
  return raw.split(',').map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });
}

/** Is this person one THIS deployment is allowed to mark as having left? */
function rostersThisPerson_(email) {
  return rosterSchools_().indexOf(businessUnitFor_(email)) > -1;
}

/**
 * Best-effort business unit. An unrecognised domain records the domain itself
 * rather than an empty cell, so a new domain shows up in the dashboard as
 * something to add here rather than vanishing into a blank.
 */
function businessUnitFor_(email) {
  var key = emailKey_(email);
  if (BUSINESS_UNIT_BY_EMAIL.hasOwnProperty(key)) return BUSINESS_UNIT_BY_EMAIL[key];

  var domain = domainOf_(email);
  if (!domain) return '';
  return BUSINESS_UNIT_BY_DOMAIN[domain] || domain;
}
