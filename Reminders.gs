/**
 * Chasing non-completers.
 *
 * SAFETY: sendReminders() with no argument is a DRY RUN. It logs exactly who
 * would be emailed, and what each of them would be chased for, and sends
 * nothing. Pass true to actually send. The scheduled trigger calls
 * weeklyReminderJob(), which sends for real. That is deliberate and is the
 * only path that does.
 *
 * ONE EMAIL PER PERSON, however many courses they owe. Three separate emails
 * on the same morning reads as a broken system and gets filtered, which is the
 * opposite of what a reminder is for.
 *
 * People whose addresses are routed elsewhere (EOA) are never chased from
 * here. Their training lives in another app with its own records, so this one
 * has no idea whether they have done it and must not imply that it does.
 */

var REMINDER_SUBJECT = 'Action needed: Please complete your training';
var RENEWAL_SUBJECT  = 'Time to refresh your training';
var MAX_EMAILS_PER_RUN = 400;      // guard rail. A run that wants more than this stops and reports.

/**
 * @param {boolean} apply  Pass true to actually send. Anything else = dry run.
 */
function sendReminders(apply) {
  var live = (apply === true);
  // V1 requests the smallest possible set of permissions, so this feature's
  // scope is not granted yet. Say so plainly instead of throwing a raw
  // Google permissions error at whoever runs it.
  var NEEDED = 'https://www.googleapis.com/auth/script.send_mail';
  if (!hasScope_(NEEDED)) {
    var m = 'Sending reminder emails needs a permission this project has not been granted yet.\n\n' +
      'Add this line to BOTH of these, or this check will keep refusing:\n\n' +
      '  1. the oauthScopes list in appsscript.json\n' +
      '  2. the list returned by getManifestScopes_() in Code.gs\n\n' +
      '  ' + NEEDED + '\n\n' +
      'Then run this function again and approve the extra permission when Google asks. ' +
      'That second consent screen is expected. It is how Apps Script grants a capability ' +
      'you did not ask for at install time.';
    Logger.log(m);
    return m;
  }

  // Apps Script sends as whichever ACCOUNT is running, and a time-based trigger
  // runs as whoever created it. So the sender is not a property of this code,
  // it is a property of who pressed the button, which is exactly the kind of
  // thing that is invisible until 1600 people have an IT manager's personal
  // address in their inbox. Refuse rather than guess.
  //
  // Only the live path is guarded. A dry run tells you the same thing without
  // the risk, and the preview functions only ever email whoever runs them.
  // MASTER SWITCH. Live sending is off until somebody turns it on deliberately,
  // by setting the REMINDERS_ENABLED script property to 'yes'. Nothing else in
  // this platform emails staff, so this one property is the whole blast radius.
  //
  // It exists because everything else here is a dry run by default, which is
  // safe right up until the moment somebody runs the one function whose name
  // says FOR_REAL. Until stakeholders have approved the training going out, that
  // function should do nothing however it is invoked.
  if (live && String(scriptProp_('REMINDERS_ENABLED') || '').trim().toLowerCase() !== 'yes') {
    var off = 'STOPPED: live reminder sending is switched off. Nothing was sent.\n\n' +
      'To turn it on, set the script property REMINDERS_ENABLED to yes ' +
      '(Project Settings, Script Properties). Leave it unset or anything other than yes ' +
      'and this function will keep refusing, whoever runs it and whatever the roster says.\n\n' +
      'sendReminders() with no argument is a dry run and is unaffected: it will show you the ' +
      'full recipient list without sending anything.';
    Logger.log(off);
    return off;
  }

  var expected = String((ORG.mail && ORG.mail.senderAccount) || '').trim().toLowerCase();
  var actual = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();

  // FAIL CLOSED. This condition used to require `expected` to be set before it
  // would refuse, which meant an unset senderAccount disabled the check instead
  // of enforcing it: exactly backwards, and the failure was silent. An undecided
  // sender is now a reason to stop.
  if (live && !expected) {
    var undecided = 'STOPPED: no sending account has been decided. Nothing was sent.\n\n' +
      'Apps Script sends as whichever account runs the job, so with this unset these emails ' +
      'would go out under ' + (actual || 'whoever happened to run this') + '.\n\n' +
      'Set ORG.mail.senderAccount in Config.gs to the account that will own the weekly ' +
      'trigger, push, and run this again.';
    Logger.log(undecided);
    return undecided;
  }

  if (live && expected && actual !== expected) {
    var wrong = 'STOPPED: this is running as ' + (actual || 'an unknown account') +
      ', but these emails are meant to come from ' + expected + '. Nothing was sent.\n\n' +
      'The sender is decided by whichever account runs the job, not by anything in the code, ' +
      'so sending from here would put ' + actual + ' in front of every recipient.\n\n' +
      'Either sign in as ' + expected + ' and run it there, or, if the sender really has ' +
      'changed, update ORG.mail.senderAccount in Config.gs to say so.\n\n' +
      'Run DIAGNOSE_MAIL() to see who owns the weekly trigger. sendReminders() with no ' +
      'argument is unaffected and will still show you the full recipient list.';
    Logger.log(wrong);
    return wrong;
  }

  var ss = getResultsSheet_();
  var baseUrl = getWebAppUrl_();

  var roster = readRoster_(ss, sheetRows_(ss, 'Roster', ROSTER_WIDTH));
  if (!roster.length) {
    var msg = 'Roster is empty, nothing to do. Run refreshRoster(true) first, or paste the staff ' +
      'list into the Roster sheet by hand.';
    Logger.log(msg);
    return msg;
  }

  // Attempts is read once and used for both questions below, rather than once
  // each. This job is already working against the six-minute limit with 1600
  // recipients, so it should not read the same sheet twice to answer them.
  var attemptRows = sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH);
  var passed = passedByCourse_(ss, attemptRows);
  // Any pass, at any version, however old. This is what separates "you have
  // never done this" from "you did this a year ago", which are two different
  // emails however similar the action is.
  var everPassed = latestPasses_(ss, false, attemptRows);
  var outstanding = [];      // [{ person: {}, courseIds: [] }]
  var skippedElsewhere = 0;
  var notOnList = 0;

  roster.forEach(function (p) {
    // Not on the reminder list. Separate from every other reason somebody is
    // skipped, and counted separately, because this one is a policy decision
    // rather than a fact about them. They are still outstanding, still in the
    // dashboard, still in the completion figures. They are simply not emailed.
    if (!p.reminders) { notOnList++; return; }
    var mine = courseIdsFor_(p.email);
    if (!mine.length) { skippedElsewhere++; return; }   // routed elsewhere, or nothing assigned
    var owed = mine.filter(function (id) {
      return !(passed[id] && passed[id][String(p.email).toLowerCase()]);
    });
    if (owed.length) {
      var priors = {};
      owed.forEach(function (id) {
        var d = everPassed[id] && everPassed[id][String(p.email).toLowerCase()];
        if (d) priors[id] = d;
      });
      outstanding.push({ person: p, courseIds: owed, priors: priors });
    }
  });

  if (outstanding.length > MAX_EMAILS_PER_RUN) {
    var stop = 'STOPPED: ' + outstanding.length + ' people are outstanding, which is over the ' +
      MAX_EMAILS_PER_RUN + ' per-run guard. This usually means the roster or the results sheet is ' +
      'wrong. Check before raising MAX_EMAILS_PER_RUN.';
    Logger.log(stop);
    return stop;
  }

  var quota = MailApp.getRemainingDailyQuota();
  if (live && quota < outstanding.length) {
    var q = 'STOPPED: need ' + outstanding.length + ' emails but only ' + quota + ' remain in ' +
      'today\'s quota. Nothing sent, re-run tomorrow or split the list.';
    Logger.log(q);
    return q;
  }

  var sent = 0, failed = [];
  outstanding.forEach(function (o) {
    if (!live) return;
    try {
      sendMail_({
        to: o.person.email,
        // A renewal notice that opens "Action needed" reads like the system has
        // forgotten they ever did it, which is exactly the complaint that makes
        // people stop opening these.
        subject: allRenewals_(o) ? RENEWAL_SUBJECT : REMINDER_SUBJECT,
        htmlBody: reminderBody_(o.person, o.courseIds, baseUrl, o.priors)
      });
      sent++;
    } catch (e) {
      failed.push(o.person.email + ' (' + e.message + ')');
      Logger.log('Reminder failed for ' + o.person.email + ': ' + e);
    }
  });

  if (live) {
    log_(ss, 'sendReminders', Session.getEffectiveUser().getEmail(),
      'sent ' + sent + ' of ' + outstanding.length + (failed.length ? ', failed: ' + failed.join('; ') : ''));
  }

  var out = (live ? 'SENT\n' : 'DRY RUN, no email was sent. Re-run as sendReminders(true) to send.\n') +
    'On roster: ' + roster.length + '\n' +
    'Not on the reminder list (Reminders is not Yes): ' + notOnList + '\n' +
    'Routed elsewhere or unassigned, not chased from here: ' + skippedElsewhere + '\n' +
    'Fully up to date: ' + (roster.length - notOnList - skippedElsewhere - outstanding.length) + '\n' +
    'People with something outstanding: ' + outstanding.length + '\n' +
    (live ? 'Emails sent: ' + sent + '\n' : '') +
    (failed.length ? 'FAILURES:\n  ' + failed.join('\n  ') + '\n' : '') +
    'Renewals (done before, now expired): ' +
      outstanding.filter(allRenewals_).length + '\n' +
    'Recipients and what they owe:\n  ' +
    outstanding.map(function (o) {
      return o.person.email + ': ' + o.courseIds.map(function (id) {
        var prior = o.priors && o.priors[id];
        return getCourse_(id).title + (prior ? ' (renewal, last passed ' + longDate_(prior) + ')' : ' (first time)');
      }).join(', ');
    }).join('\n  ');
  Logger.log(out);
  return out;
}

/* ------------------------------------------------------------------ sending */

/**
 * Every automated email in the project goes out through here.
 *
 * One place decides the sender, so changing who these appear to come from is a
 * config edit rather than a search through the code for sendEmail calls.
 *
 * Two routes. With ORG.mail.fromAddress blank it uses MailApp, which sends as
 * whoever authorised the trigger and cannot be told otherwise. With an address
 * set it uses GmailApp, which is the only one of the two that accepts a from
 * option, and which imposes two conditions Google enforces, not this code:
 *
 *   1. the address must already be a VERIFIED send-as alias on the sending
 *      account, set up in that account's Gmail settings, and
 *   2. the project must hold a Gmail sending scope, which it does not by
 *      default because V1 asked for the narrowest set it could.
 *
 * Both are checked here so a misconfiguration reads as a sentence rather than
 * as a Google stack trace inside an unattended early morning trigger.
 *
 * @param {{to: string, subject: string, htmlBody: string, body: (string|undefined)}} opts
 */
/** The display name on the From line, and the name the email signs off with. */
function senderName_() {
  return (ORG.mail && ORG.mail.fromName) || (ORG.name + ' Training');
}

function sendMail_(opts) {
  var cfg = (ORG && ORG.mail) || {};
  var fromName = senderName_();
  // Ordered so that a configured sender never silently redirects replies to the
  // IT help desk. Only a deployment with no mail config at all lands there.
  var replyTo = cfg.replyTo || cfg.fromAddress || supportEmail_();
  var from = String(cfg.fromAddress || '').trim();

  // A plain text alternative. Without one the text part of the message is
  // empty, which some clients and most filters take a dim view of.
  var body = opts.body || htmlToText_(opts.htmlBody);

  if (!from) {
    MailApp.sendEmail({
      to: opts.to,
      subject: opts.subject,
      htmlBody: opts.htmlBody,
      body: body,
      name: fromName,
      replyTo: replyTo
    });
    return;
  }

  // Either scope satisfies GmailApp.sendEmail. gmail.send is the narrow one and
  // is what this project requests; the full mail scope is accepted so that a
  // deployment which already holds it is not refused for no reason.
  var GMAIL_SEND = 'https://www.googleapis.com/auth/gmail.send';
  if (!hasScope_(GMAIL_SEND) && !hasScope_('https://mail.google.com/')) {
    throw new Error(
      'ORG.mail.fromAddress is set to ' + from + ', which needs GmailApp, which needs a ' +
      'scope this project does not request yet.\n\n' +
      'Add this to BOTH the oauthScopes list in appsscript.json AND the list returned by ' +
      'getManifestScopes_() in Code.gs, or this check will keep refusing:\n\n  ' + GMAIL_SEND +
      '\n\nThen re-authorise when Google asks. Until then, clear ORG.mail.fromAddress and mail ' +
      'will go out as the account that owns the trigger.');
  }

  try {
    GmailApp.sendEmail(opts.to, opts.subject, body, {
      htmlBody: opts.htmlBody,
      from: from,
      name: fromName,
      replyTo: replyTo
    });
  } catch (e) {
    // The most likely failure by far, and the raw message ("Invalid from
    // address") does not say what to do about it.
    throw new Error(
      'Could not send as ' + from + '. ' + e.message + '\n\n' +
      'Gmail only allows a from address that the sending account has already verified as a ' +
      'send-as alias in its own Gmail settings (Settings, Accounts, Send mail as). The account ' +
      'that matters is the one running this: ' + (Session.getEffectiveUser().getEmail() || 'unknown') +
      '.\n\nClear ORG.mail.fromAddress to fall back to sending as that account.');
  }
}

/**
 * A readable plain text version of an HTML email body.
 *
 * Not a general purpose converter and does not try to be. It handles the tags
 * reminderBody_ actually emits: paragraphs and list items become lines, links
 * become "text (url)" so the destination survives, everything else is dropped.
 */
function htmlToText_(html) {
  if (!html) return '';
  return String(html)
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<li\b[^>]*>/gi, '\n  - ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|ul|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** True when every course this person owes is one they have passed before. */
function allRenewals_(o) {
  if (!o.priors) return false;
  return o.courseIds.every(function (id) { return !!o.priors[id]; });
}

/** Called by the weekly trigger. This one sends for real. */
function weeklyReminderJob() {
  return sendReminders(true);
}

/**
 * Send the reminders now, for real, outside the weekly schedule.
 *
 * The editor's Run dropdown cannot pass arguments, so this is the entry point
 * to pick when you genuinely want mail to go out today. Named loudly on
 * purpose, and it is the same code path the weekly trigger uses.
 *
 * Run sendReminders() first. With no argument it is a dry run: it lists every
 * recipient and exactly what each of them owes, and sends nothing.
 */
function RUN_REMINDERS_FOR_REAL() {
  return sendReminders(true);
}

/**
 * The reminder itself. Deep-links straight to the course when only one is
 * owed, and to the training list when there are several, so the first click
 * always lands somewhere useful.
 */
function reminderBody_(p, courseIds, baseUrl, priors) {
  priors = priors || {};
  var name = p.name ? String(p.name).split(' ')[0] : 'there';
  var courses = courseIds.map(function (id) { return getCourse_(id); });
  var single = courses.length === 1;
  var url = (single && baseUrl) ? baseUrl + '?course=' + encodeURIComponent(courses[0].id) : baseUrl;
  var totalMinutes = courses.reduce(function (n, c) { return n + (c.estimatedMinutes || 0); }, 0);
  var renewals = courses.filter(function (c) { return priors[c.id]; }).length;
  var allRenewal = renewals === courses.length;

  var list = courses.map(function (c) {
    var prior = priors[c.id];
    return '<li style="margin:6px 0"><b>' + c.title + '</b>' +
      (c.estimatedMinutes ? ' <span style="color:' + ORG.brand.walnut + '">about ' +
        c.estimatedMinutes + ' minutes</span>' : '') +
      (prior ? '<br><span style="color:' + ORG.brand.walnut + ';font-size:13px">' +
        'You last completed this on ' + longDate_(prior) + '</span>' : '') +
      '</li>';
  }).join('');

  // Three openings, because "you have not done this" sent to someone who did it
  // a year ago is the fastest way to teach people to ignore these.
  //
  // The renewal wording is now one sentence that reads correctly for one course
  // or several, so the singular and plural branches have collapsed into one.
  var opening;
  if (allRenewal) {
    opening = 'We need to refresh our training from time to time so we stay up to date and ' +
      'Example stays compliant, and that time has come around. Could you please complete the ' +
      'training listed below.';
  } else if (renewals) {
    opening = 'You have ' + courses.length + ' pieces of required training outstanding. ' +
      'Some you have done before and are now due again, and the rest are new to you.';
  } else {
    opening = 'Our records show you have ' + (single ? 'one piece' : courses.length + ' pieces') +
      ' of required training still to complete.';
  }

  return '<div style="font-family:Lato,Arial,sans-serif;font-size:14px;color:' + ORG.brand.mocha +
    ';line-height:1.55;max-width:560px">' +
    '<p>Hi ' + name + ',</p>' +
    '<p>' + opening + '</p>' +
    '<ul style="padding-left:20px;margin:14px 0">' + list + '</ul>' +
    (totalMinutes ? '<p>That is roughly ' + totalMinutes + ' minutes in total, and you can stop and ' +
      'come back at any point.</p>' : '') +
    '<p style="margin:22px 0"><a href="' + url + '" ' +
    'style="background:' + ORG.brand.maroon + ';color:#fff;text-decoration:none;padding:11px 20px;' +
    'border-radius:4px;font-weight:bold;display:inline-block">' +
    (allRenewal ? (single ? 'Retake the training' : 'Retake your training')
                : (single ? 'Start the training' : 'See your training')) + '</a></p>' +
    '<p>If you believe you have already completed ' + (single ? 'it' : 'these') + ', or the link does ' +
    'not work, reply to this email or ' + supportRequestLink_() + ' and we will sort it out.</p>' +
    // The sign-off is the sender name, not a second copy of it. Reading it from
    // the same config value is what stops the two drifting apart: an email
    // whose From says one team and whose sign-off says another looks like it
    // was assembled by two people who never spoke.
    '<p>Thanks,<br>' + senderName_() + '</p></div>';
}

/**
 * "log a support request", linking to the help desk form.
 *
 * The same wording and the same link as the support panel inside the training,
 * so a person who follows one and a person who follows the other end up in the
 * same queue with a ticket rather than in somebody's inbox.
 *
 * Falls back to a mailto if the form URL is ever unset, because a sentence that
 * offers help and then links to nothing is worse than an address.
 */
function supportRequestLink_() {
  var url = (ORG.links && ORG.links.supportRequest) || '';
  if (!url) {
    return '<a href="mailto:' + supportEmail_() + '">email ' + supportEmail_() + '</a>';
  }
  return '<a href="' + url + '" target="_blank" rel="noopener">log an IT Support Ticket</a>';
}

/**
 * The roster, as current people.
 *
 * ACTIVE ONLY. Anyone marked Left is no longer in the staff group: they are not
 * chased, and they do not sit in the denominator making completion look worse
 * than it is. Their row and their completion record both stay put.
 *
 * A blank Status is treated as Active, so a roster pasted in by hand without
 * that column still works.
 */
/**
 * @param {Spreadsheet} ss
 * @param {Array=} rows  Roster rows already read by the caller. Optional; left
 *   out, this reads them itself, so existing callers are unaffected.
 */
function readRoster_(ss, rows) {
  return (rows || sheetRows_(ss, 'Roster', ROSTER_WIDTH))
    .filter(function (r) {
      return r[ROSTER_COL.email] &&
        String(r[ROSTER_COL.status] || 'Active').trim() !== 'Left';
    })
    .map(function (r) {
      return {
        email: String(r[ROSTER_COL.email]).trim(),
        name: r[ROSTER_COL.name],
        unit: r[ROSTER_COL.school],
        manager: r[ROSTER_COL.managerEmail],
        // Resolved at refresh time from the directory, which knows people the
        // roster does not.
        managerName: String(r[ROSTER_COL.managerName] || '').trim(),
        // Column 8. Blank reads as No, deliberately: the cost of failing to
        // chase one person is a follow up, the cost of failing closed the other
        // way is 1,600 people emailed by accident.
        reminders: String(r[ROSTER_COL.reminders] || '').trim().toLowerCase() === 'yes',
        // The cell as written, so a preview can say what it actually says
        // rather than just "not Yes".
        remindersRaw: String(r[ROSTER_COL.reminders] || '').trim()
      };
    });
}

/**
 * Who is currently compliant, as { courseId: { email: Date of that pass } }.
 *
 * Compliance is a question about time, not about content. Someone who passed
 * inside the recertification window has done the course, and a later edit to
 * the material does not retrospectively undo that. So the version a pass was
 * taken on is deliberately ignored here and the window alone decides.
 *
 * The version is still stamped on every record, and the most-missed-questions
 * panel is still scoped to it, because a question id only means anything
 * within the version that asked it.
 */
function passedByCourse_(ss, rows) {
  var out = {};
  var latest = latestPasses_(ss, false, rows);                 // any version: the window decides
  Object.keys(latest).forEach(function (id) {
    out[id] = {};
    Object.keys(latest[id]).forEach(function (email) {
      // A Date is truthy, so everywhere that tests passed[id][email] keeps
      // working unchanged and now gets the pass date for free.
      if (certificationState_(latest[id][email], id) !== 'expired') {
        out[id][email] = latest[id][email];
      }
    });
  });
  return out;
}

/**
 * The most recent PASS per person per course, as { courseId: { email: Date } }.
 *
 * @param {boolean} currentVersionOnly  true to ignore passes sat on superseded
 *   content. NOTHING passes true any more: compliance is decided by the
 *   recertification window alone, so every caller wants every pass. The
 *   parameter is kept because the question it asks is a real one, and a course
 *   whose content changes materially rather than cosmetically may one day want
 *   to force a resit. If that day comes, it should be a per-course flag set
 *   deliberately at the time, not the default for every edit.
 */
function latestPasses_(ss, currentVersionOnly, rows) {
  var out = {};
  var data = rows || sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH);
  if (!data.length) return out;

  var current = {};
  Object.keys(allCourses_()).forEach(function (id) { current[id] = getCourse_(id).version; });

  data.forEach(function (r) {
    var id = String(r[ATTEMPTS_COL.course]);
    if (!current.hasOwnProperty(id)) return;                   // a course that no longer exists
    if (String(r[ATTEMPTS_COL.result]) !== 'PASS') return;
    if (currentVersionOnly && !sameVersion_(r[ATTEMPTS_COL.version], current[id])) return;

    var when = r[ATTEMPTS_COL.recorded];
    var date = (when instanceof Date) ? when : new Date(when);
    if (isNaN(date.getTime())) return;                         // unparseable timestamp, ignore

    var email = String(r[ATTEMPTS_COL.email]).toLowerCase();
    if (!out[id]) out[id] = {};
    // Rows are appended in order, but do not rely on it: take the later date.
    if (!out[id][email] || date > out[id][email]) out[id][email] = date;
  });
  return out;
}

/** How many months a pass on this course stays valid. 0 means it never expires. */
function recertifyMonthsFor_(courseId) {
  var course = null;
  try { course = getCourse_(courseId); } catch (e) {}
  var override = course && course.recertifyMonths;
  var months = (override === 0 || override) ? override : RECERTIFY.defaultMonths;
  return Number(months) || 0;
}

/** When a pass taken on passDate falls due, or null if that course never expires. */
function certificationDueDate_(passDate, courseId) {
  var months = recertifyMonthsFor_(courseId);
  if (!months || !passDate) return null;
  var due = new Date(passDate.getTime());
  due.setMonth(due.getMonth() + months);
  return due;
}

/**
 * 'current', 'due soon' or 'expired' for a pass taken on passDate.
 *
 * 'due soon' is still current: the person is not chased, the picker simply
 * says it is coming, so the reminder is not the first they hear of it.
 */
function certificationState_(passDate, courseId, now) {
  var due = certificationDueDate_(passDate, courseId);
  if (!due) return 'current';
  var today = now || new Date();
  if (today >= due) return 'expired';
  var warnFrom = new Date(due.getTime() - (RECERTIFY.warnDaysBefore * 86400000));
  return today >= warnFrom ? 'due soon' : 'current';
}

/** 15 September 2026. Written out, because 15/09 and 09/15 are both read here. */
function longDate_(d) {
  if (!d) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'd MMMM yyyy');
}

function getWebAppUrl_() {
  var stored = scriptProp_('WEB_APP_URL');
  if (stored) return stored;
  try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; }
}

/* ------------------------------------------------------------------ preview */

/**
 * See the reminder emails before anyone else does.
 *
 * WHO THEY GO TO: only ever the person running the function. The recipient is
 * read from the session, never taken as an argument, so there is no version of
 * this that can be pointed at a colleague or at the roster by accident. That is
 * the whole safety property, and it is why these functions are safe to run on a
 * live deployment in the middle of the day.
 *
 * Five emails arrive, one per wording variant, each subject prefixed so they
 * cannot be mistaken for the real thing. They are built by the same
 * reminderBody_ and sent through the same sendMail_ as a live run, so what you
 * see is what staff would get, including the sender name, the reply-to address
 * and the plain text alternative.
 */
function PREVIEW_REMINDERS() {
  var me = Session.getEffectiveUser().getEmail();
  if (!me) return 'Could not work out who is running this, so nothing was sent.';

  var variants = previewVariants_();
  if (!variants.length) {
    return 'No courses are registered, so there is nothing to preview.';
  }

  var sent = 0, failed = [];
  variants.forEach(function (v, i) {
    try {
      sendMail_({
        to: me,
        subject: '[PREVIEW ' + (i + 1) + '/' + variants.length + '] ' + v.subject,
        htmlBody: v.html
      });
      sent++;
    } catch (e) {
      failed.push(v.label + ': ' + e.message);
    }
  });

  var out = 'Sent ' + sent + ' of ' + variants.length + ' preview emails to ' + me + '.\n\n' +
    variants.map(function (v, i) {
      return (i + 1) + '. ' + v.label + '\n   Subject: ' + v.subject;
    }).join('\n') +
    (failed.length ? '\n\nFAILED:\n  ' + failed.join('\n  ') : '') +
    '\n\nNobody else was emailed. The recipient is read from your session and cannot be changed.';
  Logger.log(out);
  return out;
}

/**
 * The same five variants, rendered as text in the execution log instead of
 * emailed. Sends nothing at all, so it is the fastest way to check a wording
 * change without filling your inbox.
 */
function PREVIEW_REMINDERS_AS_TEXT() {
  var out = previewVariants_().map(function (v, i) {
    return '======== ' + (i + 1) + '. ' + v.label + ' ========\n' +
      'Subject: ' + v.subject + '\n\n' + htmlToText_(v.html);
  }).join('\n\n');
  Logger.log(out);
  return out;
}

/**
 * What a REAL person on the roster would receive if the job ran right now.
 *
 * Reads live data, so it answers "why has this person been chased" rather than
 * "what do the templates look like". Still only ever sends to you: the address
 * you pass in selects whose situation to render, it is not the recipient.
 *
 * Returns a sentence instead of sending when that person owes nothing, which is
 * itself the answer to the question you were probably asking.
 *
 * @param {string} email  The person whose reminder to render.
 */
function previewReminderFor(email) {
  var me = Session.getEffectiveUser().getEmail();
  var who = String(email || '').trim().toLowerCase();
  if (!who) return 'Pass the address of someone on the roster, for example previewReminderFor("a.person@education.example.org").';

  var ss = getResultsSheet_();
  var roster = readRoster_(ss, sheetRows_(ss, 'Roster', ROSTER_WIDTH));
  var person = null;
  for (var i = 0; i < roster.length; i++) {
    if (String(roster[i].email).toLowerCase() === who) { person = roster[i]; break; }
  }
  if (!person) return who + ' is not on the roster as an active person, so they would not be chased.';
  if (!person.reminders) {
    return who + ' is on the roster but not on the reminder list, so they would not be chased.\n' +
      'Column 8 of their Roster row reads "' + (person.remindersRaw || 'blank') + '". Only Yes is chased.\n' +
      'They still count as outstanding in the dashboard if they have not passed. This is about ' +
      'email only.';
  }

  var mine = courseIdsFor_(person.email);
  if (!mine.length) return who + ' is routed to another training app, so they are never chased from here.';

  var attemptRows = sheetRows_(ss, 'Attempts', ATTEMPTS_WIDTH);
  var passed = passedByCourse_(ss, attemptRows);
  var everPassed = latestPasses_(ss, false, attemptRows);

  var owed = mine.filter(function (id) { return !(passed[id] && passed[id][who]); });
  if (!owed.length) {
    return who + ' is up to date on everything they are assigned, so no email would be sent.\n' +
      'Assigned: ' + mine.map(function (id) { return getCourse_(id).title; }).join(', ');
  }

  var priors = {};
  owed.forEach(function (id) {
    var d = everPassed[id] && everPassed[id][who];
    if (d) priors[id] = d;
  });

  var o = { person: person, courseIds: owed, priors: priors };
  var subject = allRenewals_(o) ? RENEWAL_SUBJECT : REMINDER_SUBJECT;
  sendMail_({
    to: me,
    subject: '[PREVIEW for ' + who + '] ' + subject,
    htmlBody: reminderBody_(person, owed, getWebAppUrl_(), priors)
  });

  var out = 'Sent to ' + me + ', not to ' + who + '.\n' +
    'Subject they would see: ' + subject + '\n' +
    'Owes: ' + owed.map(function (id) {
      return getCourse_(id).title + (priors[id] ? ' (renewal, last passed ' + longDate_(priors[id]) + ')' : ' (first time)');
    }).join(', ');
  Logger.log(out);
  return out;
}

/**
 * The five wordings reminderBody_ can produce, built from the real catalogue so
 * course titles and durations are the live ones rather than invented.
 *
 * Kept as data rather than five near-identical functions, because the point of
 * a preview is that adding a sixth wording means adding one entry here and it
 * appears in both preview functions at once.
 */
function previewVariants_() {
  // Any address that is not a EOA domain resolves to the EE catalogue by the
  // wildcard rule, which is exactly what staff get, so this needs no special
  // casing and stays right if the catalogue changes.
  var ids = courseIdsFor_('preview@' + ORG.supportEmail.split('@')[1]);
  if (!ids.length) return [];

  var person = { email: 'preview@education.example.org', name: 'Sam Taylor' };
  var url = getWebAppUrl_();
  var thirteenMonthsAgo = new Date();
  thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

  var one = [ids[0]];
  var many = ids.slice(0, Math.max(2, ids.length));
  var priorsFor = function (list) {
    var p = {};
    list.forEach(function (id) { p[id] = thirteenMonthsAgo; });
    return p;
  };

  var cases = [
    { label: 'First time, one course', ids: one, priors: {} },
    { label: 'First time, ' + many.length + ' courses', ids: many, priors: {} },
    { label: 'Renewal, one course', ids: one, priors: priorsFor(one) },
    { label: 'Renewal, ' + many.length + ' courses', ids: many, priors: priorsFor(many) }
  ];

  // The mixed case only exists when there is more than one course to mix.
  if (many.length > 1) {
    cases.push({ label: 'Mixed: one renewal, the rest new', ids: many, priors: priorsFor([many[0]]) });
  }

  return cases.map(function (c) {
    var o = { courseIds: c.ids, priors: c.priors };
    return {
      label: c.label,
      subject: allRenewals_(o) ? RENEWAL_SUBJECT : REMINDER_SUBJECT,
      html: reminderBody_(person, c.ids, url, c.priors)
    };
  });
}

/* -------------------------------------------------------------- mail checks */

/**
 * Who is actually going to send these, and will the from address work?
 *
 * Answers the question you cannot answer by reading the code, because it does
 * not depend on the code: Apps Script sends as whichever ACCOUNT is running,
 * and a time-based trigger runs as whoever created it. Two people looking at
 * the same project can therefore get two different answers, which is exactly
 * why this reports rather than asserts.
 *
 * Sends nothing. Run it from the editor and read the log.
 *
 * ScriptApp.getProjectTriggers() only ever returns the CURRENT user's triggers,
 * which is not a limitation here but the actual measurement: if the reminder
 * trigger does not appear, you do not own it, and mail will not go out as you.
 */
function DIAGNOSE_MAIL() {
  var cfg = (ORG && ORG.mail) || {};
  var me = '';
  try { me = Session.getEffectiveUser().getEmail() || ''; } catch (e) {}

  var expected = String(cfg.senderAccount || '').trim().toLowerCase();
  var lines = [
    'Running as            : ' + (me || 'unknown'),
    'Should send as        : ' + (expected || '(no senderAccount set, the check is off)'),
    'Configured from       : ' + (cfg.fromAddress || '(blank, sends as the account running)'),
    'Configured reply-to   : ' + (cfg.replyTo || cfg.fromAddress || supportEmail_()),
    'Display name          : ' + senderName_() + '   (also the sign-off in the body)',
    ''
  ];

  if (expected) {
    lines.push(String(me).toLowerCase() === expected
      ? 'You ARE the sending account. A live run from here would go out as ' + expected + '.'
      : 'You are NOT the sending account, so sendReminders(true) will refuse from here.\n' +
        '  That is the guard working, not a fault. Dry runs and previews are unaffected.');
    lines.push('');
  }

  // Who owns the schedule. Absence here is the finding, not an error.
  var mine = [];
  try {
    mine = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  } catch (e) {
    lines.push('Could not read triggers: ' + e.message);
  }
  lines.push('Triggers YOU own      : ' + (mine.length ? mine.join(', ') : 'none'));
  lines.push(mine.indexOf('weeklyReminderJob') > -1
    ? '  -> you own the weekly reminder, so it will send as ' + me
    : '  -> you do NOT own the weekly reminder. Either nobody has installed it, or ' +
      'somebody else did and it will send as them. Ask them to run this function.');
  lines.push('');

  // The send-as list on this account. Delegated access to a mailbox does NOT
  // put that address in here, which is the single most common surprise: being
  // able to open training@ and being allowed to send as it are different
  // permissions, and only the second one is what GmailApp reads.
  var from = String(cfg.fromAddress || '').trim();
  if (!from) {
    lines.push('No from address is configured, so no send-as alias is needed or checked.');
    lines.push('Mail goes out as whoever runs the job, which is the intended arrangement:');
    lines.push('the sending account owns the trigger, so it is the sender.');
  } else {
    var aliases = null;
    try { aliases = GmailApp.getAliases(); } catch (e) {
      lines.push('Could not read the send-as list (' + e.message + ').');
      lines.push('That check needs a Gmail settings scope this project does not request. It is');
      lines.push('optional: the send itself is the real test. Run PREVIEW_REMINDERS().');
    }
    if (aliases) {
      lines.push('Send-as addresses on ' + me + ':');
      lines.push(aliases.length ? '  ' + aliases.join('\n  ') : '  none');
      var ok = aliases.some(function (a) { return String(a).toLowerCase() === from.toLowerCase(); });
      lines.push('');
      lines.push(ok
        ? 'VERDICT: ' + from + ' is a verified send-as on this account. Mail will go out as it.'
        : 'VERDICT: ' + from + ' is NOT a send-as on this account, so sending will fail.\n' +
          '  Fix it in Gmail on ' + me + ': Settings, Accounts, "Send mail as", Add another\n' +
          '  email address, ' + from + '. Google emails a confirmation link to that mailbox.\n' +
          '  Delegated access is not enough on its own: it lets you read and reply in that\n' +
          '  mailbox, it does not add the address here.');
    }
  }

  var out = lines.join('\n');
  Logger.log(out);
  return out;
}
