/**
 * Example Education Training Platform
 * Web app entry point and result recording.
 *
 * DEPLOYMENT (this matters, get it wrong and either identity or logging breaks):
 *   Execute as:      Me (the owner of this script)
 *   Who has access:  Anyone within Example
 *
 * Running as the owner is what lets the script write to the results
 * spreadsheet without every member of staff needing edit access to it.
 * Because the accessing user is in the same Workspace as the owner,
 * Session.getActiveUser() still returns their real address, so we get
 * identity from SSO without asking anyone to type their name.
 *
 * ROUTING: EOA addresses are redirected to the separate EOA training app.
 * Everyone else gets the Example Education catalogue. That rule lives in
 * Config.gs, not here.
 *
 * Content lives in the course files and nowhere else. Do not edit copy here.
 */

var PROP_SHEET_ID = 'RESULTS_SHEET_ID';
var PROP_SUPPORT = 'SUPPORT_EMAIL';
// Checked: this address is not baked into any course file, so changing it is
// safe. getContentJson still swaps it for the SUPPORT_EMAIL script property
// wherever it does appear, which is how one codebase serves both deployments.
var DEFAULT_SUPPORT = 'itsupport@academies.example.org';

/**
 * Script properties, read once per execution.
 *
 * Every getProperty() is a round trip to the property store, and a single page
 * load asks for the support address, the sheet id, the admin list and the web
 * app URL separately. They are fetched together the first time any of them is
 * wanted and held for the rest of the execution. Nothing persists between
 * executions, so a property changed in the editor still takes effect on the
 * very next request.
 *
 * Anything that WRITES a property in the same execution must call
 * clearScriptProps_() afterwards, or it will read its own stale value back.
 */
var SCRIPT_PROPS_CACHE = null;

function scriptProp_(key) {
  if (!SCRIPT_PROPS_CACHE) {
    SCRIPT_PROPS_CACHE = PropertiesService.getScriptProperties().getProperties() || {};
  }
  return SCRIPT_PROPS_CACHE[key] || '';
}

function clearScriptProps_() {
  SCRIPT_PROPS_CACHE = null;
}

/**
 * Every data row of a sheet, raw, or [] if there are none.
 *
 * Raw rows rather than parsed objects, deliberately: the same block is wanted by
 * callers that read different things from it, and one of them (leavers) needs
 * rows another one filters out. Parsing stays with each caller. This exists only
 * so one request does not ask Sheets for the same block three times.
 *
 * getLastRow() is itself a round trip, so it is called once and reused.
 */
function sheetRows_(ss, name, width) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, width).getValues();
}

/**
 * The IT address staff are told to contact. Held as a script property so it
 * can be changed without a code change, falling back to the constant above.
 */
function supportEmail_() {
  return scriptProp_(PROP_SUPPORT) || DEFAULT_SUPPORT;
}

/* ------------------------------------------------------------------ web */

/**
 * Apply the tab icon, if there is one that Apps Script will accept.
 *
 * setFaviconUrl only takes a real http(s) URL to an image file. A data URI is
 * rejected outright with "The favicon icon image type is not supported", which
 * takes the whole page down rather than degrading, so this checks first and
 * swallows anything unexpected. No icon is a cosmetic loss; a dead web app is
 * not.
 *
 * To turn it on: host the PNG somewhere public and put that URL in ORG.favicon.
 */
function withFavicon_(out) {
  var url = (typeof ORG !== 'undefined' && ORG.favicon) ? String(ORG.favicon).trim() : '';
  if (!/^https:\/\/\S+$/i.test(url)) return out;          // unset, or not a URL Apps Script can use
  try { return out.setFaviconUrl(url); }
  catch (e) { Logger.log('Favicon not applied: ' + e.message); return out; }
}

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  var wanted = (e && e.parameter && e.parameter.course) || '';
  var me = getActiveEmail_();

  // One line per visit in the execution log. There is no other way to answer
  // "did this person actually reach us, and were they recognised": the app runs
  // as its owner, so the Executions list attributes every request to the owner
  // whoever made it. Logger only, never the Log sheet: this fires on every page
  // view and a spreadsheet append on each one would be both slow and a quota
  // problem. Reading it is Executions, then the row's log.
  Logger.log('doGet ' + tenantKey_() + ' identified=' + (me ? me : 'NO') +
    ' page=' + (page || 'course') + ' course=' + (wanted || '-') +
    (e && e.parameter && e.parameter[TENANT.handoverParam] ? ' handedOverFrom=' + e.parameter[TENANT.handoverParam] : '') +
    (e && e.parameter && e.parameter.probe ? ' probe=1' : ''));

  // PROBE. Answers one question for the front door at training.academies.example.org
  // school: "can you identify this visitor?" Nothing else. It renders no
  // content, touches no spreadsheet and reveals no address, so it is safe to
  // load for anybody, signed in or not, and it is fast enough to sit in front
  // of every visit.
  //
  // WHY IT EXISTS. Each deployment can only identify users from its own
  // Workspace, and an Apps Script page cannot redirect a browser on its own
  // (its iframe is sandboxed with allow-top-navigation-by-user-activation, so
  // only a click navigates). A plain page on our own domain is not sandboxed
  // and can navigate freely, but it has no way to know who the visitor is. So
  // the front door asks both deployments and each answers here.
  //
  // The reply deliberately does NOT include the address, only whether there is
  // one. The front door needs to pick a URL, not to know who is knocking, and
  // a page on another origin should not be handed an identity it has no use
  // for.
  //
  // THE ANSWER GOES TO EVERY ANCESTOR, not just window.top.
  //
  // Google wraps this HTML in an iframe of its own, so the front door is
  // already two frames up rather than the immediate parent. window.top looked
  // like the right target and is, as long as the front door is the top-level
  // document. It is not always: previewing the front door inside another page
  // puts a third frame above it, window.top resolves to that outer page, and
  // the front door never hears the reply. That cost a round of testing and
  // looked exactly like a browser blocking the probe, which is the wrong
  // conclusion to draw from it.
  //
  // Walking the chain costs nothing and removes the whole class of problem.
  // postMessage and the parent/top properties are readable across origins, so
  // this is safe from inside the sandbox. The loop is bounded because a frame
  // tree should never be this deep and an unbounded walk is a hang.
  if (e && e.parameter && e.parameter.probe) {
    var answer = JSON.stringify({
      source: 'example-training-probe',
      tenant: tenantKey_(),
      known: !!me
    });
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><body><script>(function(){' +
      'var msg=' + answer + ';' +
      'var seen=[],w=window.parent,i=0;' +
      'while(w&&i<8){try{if(seen.indexOf(w)<0){seen.push(w);w.postMessage(msg,"*");}}catch(e){}' +
      'if(w===window.top)break;w=w.parent;i++;}' +
      'try{if(seen.indexOf(window.top)<0)window.top.postMessage(msg,"*");}catch(e){}' +
      '})();</' + 'script></body></html>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }


  // Identity first. Everything below depends on knowing who this is, and a
  // blank address means no record can be written, so deal with it now rather
  // than letting someone spend twenty minutes on training that cannot be saved.
  //
  // A BLANK ADDRESS IS NOT NECESSARILY A PROBLEM. This deployment is only told
  // the identity of users in its own Google Workspace; for a colleague in the
  // other Example Workspace it is blank by design. See the TENANT block in
  // Config.gs. So blank means one of three things, and they need different
  // answers: the person belongs to the other Workspace and should be handed
  // over, the person has already been handed over and is still unknown, or the
  // person is not signed in with a Example account at all.
  if (!me) {
    return handoverPage_(e);
  }

  if (page === 'admin') {
    if (!isAdmin_(me)) {
      return simplePage_('Not available to this account',
        '<p>The training dashboard is limited to the IT team. You are signed in as <b>' +
        escapeHtml_(me) + '</b>.</p>' +
        '<p>If you should have access, ' + supportLink_() + ' and ask to be added as an ' +
        'administrator.</p>' +
        '<p><a href="?">Go to the training instead</a></p>');
    }
    var a = HtmlService.createTemplateFromFile('Admin');
    a.viewerEmail = me;
    // Everything the shell and the training view need, inlined at template time.
    // Without this the page sat blank until getAdminData returned, even though
    // the default view does not use any of that data. Reading the whole results
    // workbook before drawing a rail and an iframe is what made it feel slow.
    a.bootJson = JSON.stringify({
      viewer: me,
      orgName: ORG.name,
      webAppUrl: getWebAppUrl_(),
      supportRequestUrl: (ORG.links && ORG.links.supportRequest) || '',
      supportEmail: supportEmail_()
    });
    return withFavicon_(a.evaluate()
      .setTitle('Training dashboard | ' + ORG.name))
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  var entry = catalogueFor_(me);

  // Student and alias-only domains. Checked BEFORE the redirect and before any
  // course lookup: an excluded account should never be bounced to another
  // portal to be refused there, and should never appear in anyone's numbers.
  if (entry.deny) {
    return simplePage_('Not a staff account',
      '<p>' + escapeHtml_(entry.denyMessage || 'This training is for staff accounts.') + '</p>' +
      accountEscapeHtml_(me) +
      '<p>If you think that is wrong, ' + supportLink_() + '.</p>');
  }

  // Example Education staff are served by the separate EE platform. Nothing
  // about their catalogue lives here, so send them there rather than showing
  // them ours.
  if (entry.redirect) return redirectPage_(entry);

  var ids = courseIdsFor_(me);
  if (!ids.length) {
    return simplePage_('No training assigned',
      '<p>There is no training assigned to <b>' + escapeHtml_(me) + '</b> at the moment. ' +
      'If that is not the account you meant to use, switch below.</p>' +
      accountEscapeHtml_(me) +
      '<p>If you were expecting training on this account, ' + supportLink_() +
      ' and we will sort it out.</p>');
  }

  // A course id in the URL is only honoured if it is genuinely in this
  // person's catalogue. Otherwise the parameter becomes a way to take any
  // course by guessing its id.
  if (wanted && ids.indexOf(wanted) < 0) {
    return simplePage_('Course not available',
      '<p>That course is not one of yours, or the link is out of date.</p>' +
      '<p><a href="?">See the training assigned to you</a></p>');
  }

  // One course means no menu worth showing. This is what keeps a single-course
  // audience seeing exactly what it saw before the picker existed.
  var courseId = wanted || (ids.length === 1 ? ids[0] : '');

  if (!courseId) {
    var p = HtmlService.createTemplateFromFile('Picker');
    p.baseUrl = getWebAppUrl_();          // links must be absolute: the page renders in a sandboxed iframe
    p.coursesJson = JSON.stringify(courseSummariesFor_(me));
    p.statusJson = JSON.stringify(courseStatusFor_(me, ids));
    p.orgJson = JSON.stringify(ORG);
    p.userJson = JSON.stringify({ email: me });
    // Controls whether the dashboard link is OFFERED, nothing more. ?page=admin
    // does its own check server side, so a non-admin who types the URL is still
    // refused. This flag only decides whether they are shown a door they cannot
    // open.
    p.isAdmin = can_(me, 'viewDashboard');
    return withFavicon_(p.evaluate()
      .setTitle('Your training | ' + ORG.name))
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var t = HtmlService.createTemplateFromFile('Index');
  t.contentJson = getContentJson(courseId);
  t.orgJson = JSON.stringify(ORG);      // the page brands itself from this, never from hardcoded copy
  t.userJson = JSON.stringify({
    email: me,
    name: '',
    courseId: courseId,
    canGoBack: ids.length > 1,
    // The escape hatch for somebody who opened the training on the wrong
    // account. Cheap to compute: both are string building, no Sheets call.
    switchUrl: selfUrl_() ? accountChooserUrl_(selfUrl_()) : '',
    signOutUrl: signOutUrl_(),
    // Absolute, because the page renders in a sandboxed iframe: a relative link
    // resolves against googleusercontent.com, not the web app. Carried in this
    // object rather than as a template variable of its own, so there is one
    // injection point and one escaping rule for everything the page is handed.
    baseUrl: getWebAppUrl_()
  });
  return withFavicon_(t.evaluate()
    .setTitle(getCourse_(courseId).title + ' | ' + ORG.name))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * What to show someone this deployment cannot identify.
 *
 * Three outcomes, in order of likelihood:
 *
 *   1. They are staff in the other Example Workspace. Hand them over to the
 *      twin deployment, which can identify them. This is the normal path and
 *      is why only one link is ever published.
 *   2. They arrived here having ALREADY been handed over. Stop. Handing back
 *      would put them in a loop between the two portals, so this says plainly
 *      that neither side recognises the account and points at IT.
 *   3. The other portal's URL has never been configured. Say so, and name the
 *      script property, rather than showing a dead button.
 *
 * The handover is a link the person clicks, not an automatic redirect. An
 * automatic one would send a signed-out browser straight into case 2 without
 * the person ever seeing why, and would make the loop above invisible.
 */
/**
 * A link that makes Google ask which account to use, then continues here.
 *
 * "Open a private window" is the advice these pages used to give, and it is
 * poor advice for the people who hit this most: anybody signed into several
 * Google accounts at once, which is most of our leadership. A private window
 * means signing in again from scratch. This asks Google to show the account
 * picker and then come back, which is two clicks and no re-authentication.
 */
/** The one published address, for sending somebody back after a sign-out. */
function portalUrl_() {
  return (ORG.links && ORG.links.portal) || selfUrl_();
}

/**
 * Sign out of Google, then come back to the front door.
 *
 * THIS IS THE BIG HAMMER, and the pages that offer it say so. Google has no
 * per-site sign-out: Logout ends every Google session in that browser profile,
 * so a teacher who clicks it is also signed out of Gmail, Drive and Classroom.
 * That is the correct trade for somebody genuinely stuck in the wrong account
 * and the wrong one for somebody who just has two accounts open, which is why
 * "Switch account" is always offered first and this second.
 *
 * continue= is honoured sometimes and ignored sometimes, so it is set because
 * it helps when it works, and every page that offers this ALSO prints the
 * portal address in plain text so somebody who lands on Google's own signed-out
 * page can still find the way back.
 */
function signOutUrl_() {
  var back = portalUrl_();
  return back
    ? 'https://accounts.google.com/Logout?continue=' + encodeURIComponent(back)
    : 'https://accounts.google.com/Logout';
}

/**
 * The quiet one-line version, for pages that ALREADY have a primary button.
 *
 * The handover and redirect pages are not dead ends: their Continue button is
 * the right action for almost everybody who sees them. But continuing carries
 * the current account to the other portal, so somebody on the wrong account is
 * only moved, not helped. This gives them the way out without competing with
 * the action that is usually correct, which is why it is text rather than two
 * more buttons.
 */
function accountEscapeInline_(me) {
  var chooser = selfUrl_() ? accountChooserUrl_(selfUrl_()) : '';
  var out = signOutUrl_();
  var html = '<p class="quiet">';
  html += me ? 'Signed in as <b>' + escapeHtml_(me) + '</b>. Not the right account? '
             : 'Not the right account? ';
  if (chooser) {
    html += '<a href="' + escapeHtml_(chooser) + '" target="_top">Switch account</a> or ';
  }
  html += '<a href="' + escapeHtml_(out) + '" target="_top">sign out</a>. ' +
    'Signing out ends every Google session in this browser, including Gmail and Drive.</p>';
  return html;
}

/**
 * The block every dead end ends with: who you are, and the two ways out.
 *
 * Switch account first because it is two clicks and costs nothing. Sign out
 * second because it works when the chooser does not, at the price of every
 * other Google session. Both are plain anchors with target="_top": the page
 * renders in a sandboxed iframe where only a real click can move the browser,
 * so a scripted redirect here would silently do nothing.
 */
function accountEscapeHtml_(me) {
  var chooser = selfUrl_() ? accountChooserUrl_(selfUrl_()) : '';
  var out = signOutUrl_();
  var portal = portalUrl_();

  var html = '';
  if (me) {
    html += '<p class="quiet">You are signed in as <b>' + escapeHtml_(me) + '</b>.</p>';
  }
  html += '<p style="margin:26px 0 14px">';
  if (chooser) {
    html += '<a class="cta" href="' + escapeHtml_(chooser) + '" target="_top">Switch account</a> ';
  }
  html += '<a class="cta ghost" href="' + escapeHtml_(out) + '" target="_top">Sign out of Google</a></p>';
  html += '<p class="quiet">Switching asks Google which account to use and brings you back. ' +
    'Signing out ends every Google session in this browser, including Gmail and Drive, ' +
    'so use it only if switching does not work.';
  if (portal) {
    html += ' Either way, the training is at <b>' + escapeHtml_(portal.replace(/^https?:\/\//, '')) + '</b>.';
  }
  html += '</p>';
  return html;
}

function accountChooserUrl_(target) {
  return 'https://accounts.google.com/AccountChooser?continue=' + encodeURIComponent(target);
}

/** This deployment's own /exec URL, for sending somebody back through the door. */
function selfUrl_() {
  try { return getWebAppUrl_(); } catch (err) { return ''; }
}

function handoverPage_(e) {
  var alreadyHandedOver = !!(e && e.parameter && e.parameter[TENANT.handoverParam]);
  var support = supportLink_();

  if (alreadyHandedOver) {
    // Loud on purpose: this is the case that means something is actually
    // wrong, and it is invisible to us unless it is logged.
    Logger.log('Handover dead end: a user reached ' + tenantKey_() +
      ' from ' + e.parameter[TENANT.handoverParam] +
      ' and could not be identified by either deployment.');
    return simplePage_('We could not identify your account',
      '<p>Neither Example training portal recognises the account you are signed in with. ' +
      'That usually means the browser is signed in with a personal Google account, or with ' +
      'more than one account at once.</p>' +
      accountEscapeHtml_('') +
      '<p>If it still will not work, ' + support + ' and say which address you are using.</p>');
  }

  var url = partnerPortalUrl_();
  if (!url) {
    Logger.log('Handover requested but ' + TENANT.partnerUrlProperty + ' is not set on the ' +
      tenantKey_() + ' deployment. Nobody from the other Workspace can get in.');
    Logger.log('CONFIGURATION GAP: ' + TENANT.partnerUrlProperty + ' is not set on the ' +
      tenantKey_() + ' deployment, so an unidentified visitor has nowhere to be sent.');
    return simplePage_('Sign in required',
      '<p>We could not identify your account. That usually means the browser is signed in with ' +
      'a personal Google account, or with more than one account at once.</p>' +
      accountEscapeHtml_('') +
      '<p>If that does not help, ' + support + ' and say which address you are using.</p>');
  }

  // The handover parameter is what stops case 2 becoming a loop.
  var target = url + (url.indexOf('?') > -1 ? '&' : '?') +
    encodeURIComponent(TENANT.handoverParam) + '=' + encodeURIComponent(tenantKey_());

  // THE REDIRECT CANNOT BE AUTOMATIC, and the page must not pretend otherwise.
  //
  // Apps Script renders web app HTML inside an iframe sandboxed with
  // allow-top-navigation-by-user-activation. A script assigning
  // window.top.location without a user gesture is blocked by the browser, so
  // the assignment below does nothing on its own. Only the click works. An
  // earlier version of this page said "we are taking you there now" and then
  // sat there, which is worse than saying nothing.
  //
  // The assignment is kept because it costs nothing and does fire in the few
  // contexts that permit it. The button is the real mechanism, so it is
  // presented as the action rather than as a fallback.
  return withFavicon_(HtmlService.createHtmlOutput(
    pageShell_('One step to your training',
      '<p>You are signed in with a ' + escapeHtml_(partnerPortalLabel_()) +
      ' account, which is hosted separately. The button below takes you straight there.</p>' +
      '<p style="margin:26px 0"><a class="cta" href="' + escapeHtml_(target) +
      '" target="_top">Continue to your training</a></p>' +
      accountEscapeInline_('') +
      '<p class="quiet">You will only see this step when you open the link with this account. ' +
      'Any trouble, ' + support + '.</p>' +
      '<script>try{window.top.location.href=' + JSON.stringify(target) + ';}catch(e){}</script>')))
    .setTitle('Your training | ' + ORG.name)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Send EOA addresses to the EOA training app.
 *
 * HtmlService renders inside a sandboxed iframe, so a meta refresh only
 * reloads the frame. window.top.location is what actually moves the browser.
 * The visible link is not decoration: if the redirect is blocked, it is the
 * only way out of this page.
 */
function redirectPage_(entry) {
  var url = redirectUrlFor_(entry);
  if (!url) {
    Logger.log('No redirect URL configured for audience "' + (entry.label || '') +
      '". Set the ' + entry.urlProperty + ' script property.');
    return simplePage_('Training has moved',
      '<p>Your training is hosted separately, but the link has not been configured yet.</p>' +
      '<p>Please ' + supportLink_() + ' and let them know, quoting ' +
      '<code>' + escapeHtml_(entry.urlProperty) + '</code>.</p>');
  }
  // Same constraint as handoverPage_: the assignment below is blocked without a
  // user gesture, so the button is the mechanism, not the fallback.
  return withFavicon_(HtmlService.createHtmlOutput(
    pageShell_('One step to your training',
      '<p>Training for ' + escapeHtml_(entry.label) + ' is hosted separately. ' +
      'The button below takes you straight there.</p>' +
      '<p style="margin:26px 0"><a class="cta" href="' + escapeHtml_(url) +
      '" target="_top">Continue to your training</a></p>' +
      accountEscapeInline_('') +
      '<script>try{window.top.location.href=' + JSON.stringify(url) + ';}catch(e){}</script>')))
    .setTitle('Your training | ' + escapeHtml_(entry.label))
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------------------------------------------------------------- pages */

/**
 * The small branded pages the server renders directly: sign-in problems,
 * access refusals, redirects. Not the training itself, which is Index.html.
 */
function pageShell_(heading, bodyHtml) {
  // Dark mode matters more here than it looks. These pages are the handover and
  // the refusals, so on a dark desktop they are the white flash between two dark
  // pages. Same values as Index.html and Picker.html, driven by custom
  // properties so the light and dark definitions sit next to each other rather
  // than being two separate stylesheets to keep in step.
  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>' +
    ':root{--bg:' + ORG.brand.mist + ';--fg:' + ORG.brand.mocha + ';--accent:' + ORG.brand.maroon + ';' +
    '--card:#fff;--line:' + ORG.brand.beige + '}' +
    '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' +
    '--bg:#141011;--fg:#f3efee;--accent:#e0687a;--card:#1c1719;--line:#332b2d}}' +
    ':root[data-theme="dark"]{--bg:#141011;--fg:#f3efee;--accent:#e0687a;--card:#1c1719;--line:#332b2d}' +
    'body{margin:0;background:var(--bg);color:var(--fg);' +
    'font:15px/1.6 Lato,-apple-system,Segoe UI,Arial,sans-serif}' +
    '.wrap{max-width:560px;margin:0 auto;padding:48px 20px}' +
    'h1{color:var(--accent);font-size:22px;margin:0 0 16px;font-weight:700}' +
    'code{background:var(--card);padding:2px 5px;border:1px solid var(--line);border-radius:3px;font-size:13px}' +
    'a{color:var(--accent)}' +
    'a.cta{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;' +
    'padding:13px 24px;border-radius:6px;font-weight:700;font-size:16px}' +
    'a.cta:hover{filter:brightness(1.12)}' +
    'a.cta.ghost{background:none;color:var(--accent);border:1px solid var(--line);font-weight:600}' +
    'a.cta.ghost:hover{background:var(--card);filter:none}' +
    '.quiet{color:var(--fg);opacity:.7;font-size:13.5px;margin-top:28px}' +
    '</style></head><body><div class="wrap">' +
    '<h1>' + heading + '</h1>' + bodyHtml + '</div></body></html>';
}

function simplePage_(heading, bodyHtml) {
  return withFavicon_(HtmlService.createHtmlOutput(pageShell_(heading, bodyHtml)))
    .setTitle(heading + ' | ' + ORG.name);
}

/**
 * How a member of staff asks for help.
 *
 * ALWAYS the ticket form, never an address. A mailto lands in one person's
 * inbox, which means it is missed when they are away and invisible to everyone
 * else; the form is a queue with an audit trail, and it is what EA IT actually
 * works from. An address also drifts: this platform served pages telling staff
 * to email a named individual because a script property had been set to a
 * person rather than a team.
 *
 * Falls back to a mailto only when no form URL is configured, so a missing
 * link never leaves a member of staff with no way to ask.
 */
function supportLink_(label) {
  var url = (ORG.links && ORG.links.supportRequest) || '';
  var text = label || 'Log an IT Support Ticket';
  if (url) {
    return '<a href="' + escapeHtml_(url) + '" target="_blank" rel="noopener">' +
      escapeHtml_(text) + '</a>';
  }
  return mailto_(supportEmail_());
}

function mailto_(addr) {
  return '<a href="mailto:' + escapeHtml_(addr) + '">' + escapeHtml_(addr) + '</a>';
}

function escapeHtml_(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * The signed-in user's address. Empty string rather than a throw, so the
 * page still renders and the failure surfaces with a message the user can
 * act on.
 */
function getActiveEmail_() {
  try {
    var e = Session.getActiveUser().getEmail();
    return e || '';
  } catch (err) {
    Logger.log('getActiveEmail_ failed: ' + err);
    return '';
  }
}

/**
 * Is a scope present in the manifest? Used to give a readable message when an
 * optional feature (reminders, deck export, roster) is run before its
 * permission has been added.
 */
function hasScope_(scope) {
  try {
    return ScriptApp.getOAuthToken && (getManifestScopes_().indexOf(scope) > -1);
  } catch (e) {
    return false;
  }
}

function getManifestScopes_() {
  // Apps Script exposes no runtime API for the manifest, so this is a mirror of
  // the oauthScopes array in appsscript.json.
  //
  // THE TWO MUST BE EDITED TOGETHER. A scope added to appsscript.json but not
  // here leaves its feature blocked, and the guard then tells you to add the
  // scope you have just added. Every guard message names both files for that
  // reason.
  return [
    'https://www.googleapis.com/auth/spreadsheets',          // results workbook
    'https://www.googleapis.com/auth/drive.file',            // create the workbook
    'https://www.googleapis.com/auth/userinfo.email',        // who is taking the training
    'https://www.googleapis.com/auth/script.send_mail',      // reminder emails
    // NOT requested. training@ owns the weekly trigger, so it is the account
    // running the job and MailApp already sends as it. This scope is only
    // needed for the other arrangement, where some other account sends AS
    // training@ through GmailApp. If ORG.mail.fromAddress is ever filled in,
    // add this line back here and in appsscript.json together:
    //   https://www.googleapis.com/auth/gmail.send
    'https://www.googleapis.com/auth/script.scriptapp',      // install the scheduled triggers
    // Both Admin SDK scopes need a Workspace admin to consent and the Admin SDK
    // advanced service enabled. The group one is required for the roster: it is
    // what reads who is in example-staff. GroupsApp cannot do this, as it only
    // reads groups the running account belongs to. The user one is enrichment
    // only: without it the roster is still complete, names are simply blank.
    //
    // Deck export is the one feature still unscoped: it needs
    // https://www.googleapis.com/auth/presentations added to both files.
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.member.readonly'
  ];
}

/* -------------------------------------------------------------- results */

/**
 * Column layout of the Attempts sheet, by index. Defined here because this is
 * the file that writes the rows. Setup.gs builds the headers in the same
 * order and Dashboard.gs reads them back. If you change one, change all three.
 */
// 'unit' is the SCHOOL, derived from the email domain. The Team column that
// used to sit between it and Manager has been removed: Department is not
// populated in the EA Admin console, so it was a column of '(not set)' pretending
// to be a dimension. Reinstating it later means adding it back here, in
// SHEET_SPEC, and in the appendRow in recordAttempt, and nowhere else, because
// every reader goes through this map rather than a literal index.
var ATTEMPTS_COL = {
  recorded: 0, email: 1, name: 2, unit: 3, manager: 4,
  course: 5, version: 6, attempt: 7, score: 8, outOf: 9, percent: 10,
  result: 11, started: 12, finished: 13, minutes: 14
};
var ATTEMPTS_WIDTH = 15;

/**
 * Do a stored version and a course's version refer to the same content?
 *
 * NOT a string comparison, and this is the reason why. Google Sheets coerces
 * anything that looks numeric into a number, so a version of '3.0' is written
 * to the cell and comes back as the number 3. String(3) is '3', which does not
 * equal '3.0', so every attempt looks like it belongs to an older version of
 * the course. The symptom is nasty because it is silent and partial: the
 * attempts table lists the row, because it filters on course alone, while
 * every total above it reads zero, because those filter on version too.
 *
 * Exact string match first, so non-numeric versions like '2.1-draft' still
 * work. Numeric comparison second, which is what catches 3 against '3.0'.
 */
function sameVersion_(stored, current) {
  var a = String(stored === null || stored === undefined ? '' : stored).trim();
  var b = String(current === null || current === undefined ? '' : current).trim();
  if (a === b) return true;
  if (a === '' || b === '') return false;
  var na = Number(a), nb = Number(b);
  return !isNaN(na) && !isNaN(nb) && na === nb;
}

/**
 * Record one completed attempt.
 * Called from the client. Everything here is re-validated and re-scored
 * server-side: the browser's score is treated as untrusted input, and so is
 * the course it claims to be answering.
 *
 * @param {Object} payload from the client
 * @return {Object} { ok: true, attempt: n, score: n, passed: bool }
 */
function recordAttempt(payload) {
  var email = getActiveEmail_();
  if (!email) {
    throw new Error('Could not identify your account. Please make sure you are signed in with your ' +
      ORG.name + ' account, then try again. If it keeps happening, email ' + supportEmail_() + '.');
  }
  if (!payload || !payload.examAnswers || !payload.examAnswers.length) {
    throw new Error('No answers were received. Nothing has been recorded, please try submitting again.');
  }

  // The course is re-checked against this person's own catalogue. A client
  // naming a course they were never offered is not recorded against it.
  var allowed = courseIdsFor_(email);
  var courseId = String(payload.courseId || '');
  if (allowed.indexOf(courseId) < 0) {
    Logger.log('recordAttempt refused: ' + email + ' submitted course "' + courseId +
      '" but is only offered [' + allowed.join(', ') + ']');
    throw new Error('That course is not one of yours, so the result has not been saved. ' +
      'Please reload the page and start from your training list. If this looks wrong, email ' +
      supportEmail_() + '.');
  }
  var course = getCourse_(courseId);

  // Re-score from the server-side answer key. Never trust the client's score.
  var key = getAnswerKey(courseId);
  var total = course.finalExam.questions.length;
  var right = 0;
  payload.examAnswers.forEach(function (a) {
    if (key[a.id] && key[a.id] === a.answer) right++;
  });
  var percent = Math.round((right / total) * 100);
  var passed = (right / total) >= course.passMark;

  // Opening the workbook and looking this person up are both read-only, and
  // neither takes any part in the attempt-number race the lock exists for, so
  // they happen BEFORE the lock is taken. The roster lookup is the expensive one,
  // and holding a script-wide lock while it runs is what turns a burst of
  // submissions after a reminder goes out into a queue.
  var ss, person;
  try {
    ss = getResultsSheet_();
    person = lookupRoster_(ss, email);
  } catch (err) {
    Logger.log('recordAttempt could not read the workbook for ' + email + ': ' + err);
    throw new Error('Your answers could not be saved. Please email ' + supportEmail_() + ' ' +
      'and let them know, do not just close the tab. (' + err.message + ')');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);                     // appends from several staff at once must not interleave
  try {
    var attempts = ss.getSheetByName('Attempts');
    var answers = ss.getSheetByName('Answers');

    // Attempts are counted per course. Someone's first go at safeguarding is
    // attempt 1, whatever they have already done on the other courses.
    var attemptNo = countAttempts_(attempts, email, courseId) + 1;
    var version = payload.contentVersion || course.version;
    var now = new Date();

    // School comes from the email domain, not the roster. The domain is
    // always present and always current; the roster may be empty or stale.
    attempts.appendRow([
      now,                                  // Recorded
      email,
      person.name,
      businessUnitFor_(email),
      person.manager,
      courseId,
      version,
      attemptNo,
      right,
      total,
      percent,
      passed ? 'PASS' : 'FAIL',
      payload.startedAt ? new Date(payload.startedAt) : '',
      payload.finishedAt ? new Date(payload.finishedAt) : '',
      minutesBetween_(payload.startedAt, payload.finishedAt)
    ]);

    var rows = [];
    (payload.examAnswers || []).forEach(function (a) {
      rows.push([now, email, courseId, version, attemptNo,
        'Final check', a.id, a.prompt || '', a.answer || '',
        (key[a.id] && key[a.id] === a.answer) ? 'Correct' : 'Incorrect']);
    });
    (payload.moduleAnswers || []).forEach(function (a) {
      rows.push([now, email, courseId, version, attemptNo,
        a.module || 'Section check', a.id, '', a.answer || '',
        a.correct ? 'Correct' : 'Incorrect']);
    });
    if (rows.length) {
      answers.getRange(answers.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    log_(ss, 'recordAttempt', email, courseId + ' attempt ' + attemptNo + ', ' +
      right + '/' + total + ', ' + (passed ? 'PASS' : 'FAIL'));
    return { ok: true, attempt: attemptNo, score: right, total: total, passed: passed };
  } catch (err) {
    Logger.log('recordAttempt FAILED for ' + email + ' on ' + courseId + ': ' + err);
    throw new Error('Your answers could not be saved. Please email ' + supportEmail_() + ' ' +
      'and let them know, do not just close the tab. (' + err.message + ')');
  } finally {
    lock.releaseLock();
  }
}

/**
 * How many times this person has attempted this particular course.
 *
 * This one read is the only thing that genuinely has to happen inside the lock,
 * because the number it produces is written straight back. So it reads as little
 * as it can: only the span of columns from Email to Course, rather than all
 * sixteen. The span is derived from ATTEMPTS_COL rather than hardcoded, so
 * reordering the sheet cannot silently make it read the wrong cells.
 */
function countAttempts_(sheet, email, courseId) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;

  var first = Math.min(ATTEMPTS_COL.email, ATTEMPTS_COL.course);
  var width = Math.abs(ATTEMPTS_COL.course - ATTEMPTS_COL.email) + 1;
  var emailAt = ATTEMPTS_COL.email - first;
  var courseAt = ATTEMPTS_COL.course - first;

  var data = sheet.getRange(2, first + 1, last - 1, width).getValues();
  var wanted = String(email).toLowerCase();
  var n = 0;
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][emailAt]).toLowerCase() === wanted &&
        String(data[i][courseAt]) === String(courseId)) n++;
  }
  return n;
}

/**
 * Per-course state for one person, used by the picker.
 *
 * Two independent things make a course due. Passing on the CURRENT version is
 * what counts as done, because a pass on older content means they have not seen
 * what changed. On top of that a pass ages out after RECERTIFY months, because
 * people forget. Either one puts the course back on their list.
 */
function courseStatusFor_(email, ids) {
  var status = {};
  ids.forEach(function (id) {
    status[id] = { attempts: 0, passed: false, lastPercent: null,
                   lastPassed: '', dueDate: '', dueSoon: false };
  });

  var data;
  try {
    data = sheetRows_(getResultsSheet_(), 'Attempts', ATTEMPTS_WIDTH);
  } catch (e) {
    Logger.log('courseStatusFor_ could not open the results sheet: ' + e);
    return status;                          // the picker still renders, just without progress
  }
  if (!data.length) return status;

  // The content version a pass was sat on is deliberately NOT consulted here.
  // What this page tells a person has to agree with what the dashboard tells an
  // administrator and with who the weekly reminder chases, and both of those
  // ask only whether the pass is inside the recertification window. Scoping
  // this to the current version meant someone who passed last week could open
  // the picker after a typo fix was published and be told they had not passed.

  var wanted = String(email).toLowerCase();
  var latestPass = {};                      // courseId -> the best pass date seen so far
  data.forEach(function (r) {
    if (String(r[ATTEMPTS_COL.email]).toLowerCase() !== wanted) return;
    var id = String(r[ATTEMPTS_COL.course]);
    if (!status[id]) return;
    status[id].attempts++;
    status[id].lastPercent = Number(r[ATTEMPTS_COL.percent]) || 0;
    if (String(r[ATTEMPTS_COL.result]) === 'PASS') {
      var when = r[ATTEMPTS_COL.recorded];
      var date = (when instanceof Date) ? when : new Date(when);
      if (!isNaN(date.getTime())) {
        // Take the LATER date rather than the last row seen. Rows are appended
        // in order today, but a hand-edited sheet or a repaired record should
        // not be able to make an older pass win and read as expired.
        if (latestPass[id] && date <= latestPass[id]) return;
        latestPass[id] = date;

        var state = certificationState_(date, id);
        // An expired pass leaves passed false, so the card reads as due rather
        // than complete, but the date is still carried so the page can say when
        // they last did it instead of pretending it never happened.
        status[id].lastPassed = longDate_(date);
        status[id].passed = (state !== 'expired');
        status[id].dueSoon = (state === 'due soon');
        var due = certificationDueDate_(date, id);
        status[id].dueDate = (state !== 'expired' && due) ? longDate_(due) : '';
      }
    }
  });
  return status;
}

/**
 * One person's roster row: name, school, manager.
 *
 * Cached per address, because this runs on every submission and the roster only
 * changes once a night. What it avoids is a read of all 1600-odd roster rows in
 * the middle of recording somebody's result.
 *
 * A hit is held for six hours. A MISS is held for ten minutes only: a new
 * starter who submits before their first roster refresh should pick their name
 * up shortly afterwards rather than at the end of the day.
 *
 * Cache failures are swallowed on purpose. An unavailable cache must make a
 * submission slower, never make it fail.
 */
var ROSTER_CACHE_HIT_SECONDS = 21600;    // six hours
var ROSTER_CACHE_MISS_SECONDS = 600;     // ten minutes

function lookupRoster_(ss, email) {
  var blank = { name: '', unit: '', manager: '' };
  var key = 'roster:' + String(email || '').toLowerCase();

  var cache = null;
  try { cache = CacheService.getScriptCache(); } catch (e) { cache = null; }

  if (cache) {
    try {
      var hit = cache.get(key);
      if (hit) return JSON.parse(hit);
    } catch (e) {
      Logger.log('lookupRoster_ cache read failed, falling back to the sheet: ' + e);
    }
  }

  // Values are coerced to strings here rather than passed through raw, so a row
  // served from the cache and a row read from the sheet are identical. A JSON
  // round trip stringifies anyway, and a silent difference between the two paths
  // would be a miserable thing to debug.
  var found = null;
  var rows = sheetRows_(ss, 'Roster', ROSTER_WIDTH);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][ROSTER_COL.email]).toLowerCase() === String(email).toLowerCase()) {
      // Status is deliberately ignored here: someone who has left the group can
      // still be finishing a course, and their name belongs on the record.
      found = {
        name: String(rows[i][ROSTER_COL.name] || ''),
        unit: String(rows[i][ROSTER_COL.school] || ''),
        manager: String(rows[i][ROSTER_COL.managerEmail] || '')
      };
      break;
    }
  }

  if (cache) {
    try {
      cache.put(key, JSON.stringify(found || blank),
        found ? ROSTER_CACHE_HIT_SECONDS : ROSTER_CACHE_MISS_SECONDS);
    } catch (e) {
      Logger.log('lookupRoster_ cache write failed: ' + e);
    }
  }
  return found || blank;
}

function minutesBetween_(a, b) {
  if (!a || !b) return '';
  var ms = new Date(b).getTime() - new Date(a).getTime();
  if (!(ms > 0)) return '';
  return Math.round(ms / 60000);
}

/* ------------------------------------------------------------- plumbing */

/**
 * The results workbook, opened once per execution.
 *
 * SpreadsheetApp.openById costs the better part of a second every time. The
 * admin dashboard was paying that three times for a single page of the
 * administrator list, which is most of why it felt slow. Globals in Apps Script
 * live for exactly one execution, so this cache cannot go stale between
 * requests.
 */
/**
 * The admin links for the course page rail, fetched by the client AFTER the
 * page has already rendered.
 *
 * WHY THIS IS NOT PART OF doGet. Working out whether somebody is an admin means
 * opening the results workbook and reading the Admins sheet, which costs the
 * better part of a second. The course page is the most loaded page in the
 * project and almost nobody who loads it is an admin, so paying that on every
 * visit to show a link to three people is the wrong trade, particularly during
 * an all-staff launch. The page renders first, this answers afterwards, and the
 * links appear for the people who have them.
 *
 * It returns a boolean and two addresses, and the workbook address only once
 * the caller has actually passed the permission check. An ordinary member of
 * staff calling this directly gets { isAdmin: false } and nothing else.
 */
function getAdminRailLinks() {
  var me = getActiveEmail_();
  if (!me || !can_(me, 'viewDashboard')) return { isAdmin: false };
  return {
    isAdmin: true,
    adminUrl: getWebAppUrl_() + '?page=admin',
    sheetUrl: resultsSheetUrl_()
  };
}

/**
 * The results workbook's address, built from the id rather than by opening the
 * file. A URL does not need the spreadsheet, and openById is the expensive call
 * this whole function exists to avoid.
 */
function resultsSheetUrl_() {
  var id = scriptProp_(PROP_SHEET_ID);
  return id ? 'https://docs.google.com/spreadsheets/d/' + id + '/edit' : '';
}

var RESULTS_SS_ = null;

function getResultsSheet_() {
  if (RESULTS_SS_) return RESULTS_SS_;
  var id = scriptProp_(PROP_SHEET_ID);
  if (!id) {
    throw new Error('Results spreadsheet is not configured. Run RUN_SETUP_FOR_REAL() once from the ' +
      'Apps Script editor before deploying.');
  }
  RESULTS_SS_ = SpreadsheetApp.openById(id);
  return RESULTS_SS_;
}

function log_(ss, action, who, detail) {
  try {
    var sheet = ss.getSheetByName('Log');
    if (sheet) sheet.appendRow([new Date(), action, who, detail]);
  } catch (e) {
    Logger.log('log_ failed: ' + e);   // logging must never break the thing it is logging
  }
}

/**
 * Which favicon URLs will Apps Script actually accept?
 *
 * Run this from the editor's Run dropdown and read the execution log. It
 * deploys nothing and changes nothing: it builds a throwaway HtmlOutput per
 * candidate and reports whether setFaviconUrl took it.
 *
 * This exists because the failure is silent from the outside. An icon that
 * does not appear could be a rejected URL, a URL Google cannot fetch, or the
 * browser holding on to the old icon, and those have three different fixes.
 */
function TEST_FAVICON() {
  var candidates = [
    ['Configured value (ORG.favicon)', (typeof ORG !== 'undefined' && ORG.favicon) || ''],
    ['Drive direct content',   'https://example.org/assets/training-icon.png'],
    ['Drive thumbnail',        'https://example.org/assets/training-icon.png'],
    ['Drive uc export',        'https://example.org/assets/training-icon.png'],
    ['A plain .png elsewhere', 'https://www.google.com/favicon.ico'],
    ['Control: obvious junk',  'https://example.org/not-an-image']
  ];

  var lines = ['Does setFaviconUrl accept the URL? This says nothing about whether',
               'Google can then fetch it, only whether Apps Script will store it.',
               ''];
  candidates.forEach(function (c) {
    var label = c[0], url = c[1];
    if (!url) { lines.push('  SKIPPED  ' + label + ' (empty)'); return; }
    try {
      HtmlService.createHtmlOutput('<p>x</p>').setFaviconUrl(url);
      lines.push('  ACCEPTED ' + label);
    } catch (e) {
      lines.push('  REFUSED  ' + label + '  ->  ' + e.message);
    }
    lines.push('           ' + url);
  });

  lines.push('');
  lines.push('Reading this:');
  lines.push('  Everything refused, including the .ico  -> the method is unavailable here, drop the icon.');
  lines.push('  Only the .ico accepted                  -> Apps Script wants a real file extension,');
  lines.push('                                             so no Drive URL can ever work. Host a .png.');
  lines.push('  Drive accepted but no icon appears      -> Apps Script is fine with it and Google cannot');
  lines.push('                                             fetch it, or your browser cached the old one.');
  lines.push('                                             Try a fresh tab before anything else.');

  var out = lines.join('\n');
  Logger.log(out);
  return out;
}
