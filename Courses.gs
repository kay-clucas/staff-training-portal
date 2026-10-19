/**
 * Course registry.
 *
 * Each course lives in its own file and defines one global. This file is the
 * only place that knows which globals those are. It knows nothing about what a
 * course CONTAINS: it hands out course objects and serialises them. That is
 * what lets a new course be added by writing one file, naming it in
 * courseObjects_() below, and adding its id to CATALOGUE in Config.gs, with no
 * change to the engine, the results sheet or the client.
 *
 * WHY THE COURSES ARE PULLED IN HERE rather than each file registering itself:
 * Apps Script concatenates every .gs file into one script and runs their
 * top-level statements in file order. A course file calling a register
 * function at its own top level would depend on that order, which is decided
 * by filename. Reading the globals lazily, inside a function that only runs
 * during a request, removes the question entirely.
 *
 * Every course object must have the SAME SHAPE as the others, because
 * Index.html renders whatever it is given and does not know which course it is
 * showing. The shape is checked on first use, so a malformed course fails with
 * a message naming the problem rather than halfway through rendering for a
 * member of staff.
 */

var REQUIRED_COURSE_FIELDS = ['id', 'version', 'title', 'passMark', 'modules', 'finalExam'];

/**
 * The global each course file defines. Add a line when you add a course.
 * A course whose file is missing or failed to parse is simply absent, which is
 * why each is guarded rather than listed directly.
 */
function courseObjects_() {
  var out = [];
  if (typeof TRAINING !== 'undefined' && TRAINING) out.push(TRAINING);
  // SAFEGUARDING IS TEMPORARILY OFF THE CATALOGUE. Commented out on 2026-10-07
  // so the all-staff launch of the cyber course does not also expose a child
  // safeguarding course that still has «CONFIRM» placeholders where each
  // school's Designated Safeguarding Leads should be named, and that has not
  // yet been signed off by HR or Legal.
  //
  // TO BRING IT BACK: fill in the dsls arrays in CourseSafeguarding.js for EOA,
  // Riverside School, Hillcrest and the org, get HR/Legal sign-off, then
  // uncomment the line below, push and cut a new version on BOTH deployments.
  // The course file stays in src/ and stays deployed; it is simply not
  // registered, so it is absent from the picker and cannot be opened.
  // if (typeof SAFEGUARDING !== 'undefined' && SAFEGUARDING) out.push(SAFEGUARDING);
  // Sexual Harassment training is NOT part of the Example Academies catalogue.
  // EA does not run this course, so the file is not deployed and the global is
  // never defined. Left here as a comment rather than deleted silently so that
  // anyone comparing this against the Example Education platform can see the
  // difference is deliberate. The course file is kept in _removed/ outside the
  // clasp root; to bring it back, move it into src/ and uncomment this line.
  // if (typeof HARASSMENT !== 'undefined' && HARASSMENT) out.push(HARASSMENT);
  return out;
}

// Built once per execution by allCourses_(). Not populated at load time, for
// the ordering reason described above.
var COURSES_CACHE = null;

/** Every valid course, keyed by id. */
function allCourses_() {
  if (COURSES_CACHE) return COURSES_CACHE;

  var built = {};
  courseObjects_().forEach(function (course) {
    var problem = courseProblem_(course);
    if (problem) {
      // One broken course must not take down the courses that are fine, so it
      // is logged and skipped rather than thrown. It will be absent from every
      // catalogue, which is visible immediately.
      Logger.log('Course "' + ((course && course.id) || 'with no id') + '" was not loaded: ' + problem);
      return;
    }
    if (built[course.id]) {
      Logger.log('Two courses are both using the id "' + course.id + '". Keeping the first, ignoring ' +
        'the second. Course ids must be unique.');
      return;
    }
    built[course.id] = course;
  });

  COURSES_CACHE = built;
  return COURSES_CACHE;
}

/**
 * Why a course object is unusable, or empty string if it is fine.
 */
function courseProblem_(course) {
  if (!course || typeof course !== 'object') return 'it is not an object';
  for (var i = 0; i < REQUIRED_COURSE_FIELDS.length; i++) {
    var f = REQUIRED_COURSE_FIELDS[i];
    if (course[f] === undefined || course[f] === null) {
      return 'it is missing the required field "' + f + '". Every course needs: ' +
        REQUIRED_COURSE_FIELDS.join(', ') + '.';
    }
  }
  if (!course.finalExam.questions || !course.finalExam.questions.length) {
    return 'its finalExam has no questions, so it could never be scored';
  }
  if (!(course.passMark > 0 && course.passMark <= 1)) {
    return 'its passMark is ' + course.passMark + ', which should be a fraction between 0 and 1 ' +
      '(0.8 means 80 per cent)';
  }
  return '';
}

/**
 * One course by id. Throws a readable error rather than returning undefined,
 * because every caller treats a missing course as unrecoverable.
 */
function getCourse_(id) {
  var all = allCourses_();
  var c = all[id];
  if (!c) {
    var known = Object.keys(all);
    throw new Error('Unknown course "' + id + '". ' +
      (known.length ? 'Loaded courses are: ' + known.join(', ') + '.'
                    : 'No courses loaded at all, which means every course file failed to load. ' +
                      'Check the Apps Script execution log.'));
  }
  return c;
}

/**
 * The course ids this person should be offered, in catalogue order.
 * Ids listed in CATALOGUE but not actually loaded are skipped rather than
 * throwing, so a half-finished course sitting in the catalogue cannot take the
 * whole platform down for everyone.
 */
var COURSE_IDS_BY_DOMAIN = null;

function courseIdsFor_(email) {
  // The answer depends only on the domain, and the dashboard asks this question
  // once per roster row: 1600 times for an answer with about fourteen possible
  // values. Memoised per execution, keyed by domain.
  var domain = domainOf_(email);
  if (!COURSE_IDS_BY_DOMAIN) COURSE_IDS_BY_DOMAIN = {};
  if (!COURSE_IDS_BY_DOMAIN.hasOwnProperty(domain)) {
    COURSE_IDS_BY_DOMAIN[domain] = computeCourseIdsFor_(email);
  }
  // A copy, so a caller that sorts or splices what it is handed cannot corrupt
  // the answer every later caller gets.
  return COURSE_IDS_BY_DOMAIN[domain].slice();
}

function computeCourseIdsFor_(email) {
  var entry = catalogueFor_(email);
  if (!entry || entry.redirect || !entry.courses) return [];
  var all = allCourses_();
  return entry.courses.filter(function (id) {
    if (all[id]) return true;
    Logger.log('Catalogue lists course "' + id + '" but no course loaded under that id. Skipping it.');
    return false;
  });
}

/**
 * Enough about each of this person's courses to render the picker.
 * Deliberately not the whole course object: the picker does not need the
 * content, and serialising three full courses to draw a menu is wasteful.
 */
function courseSummariesFor_(email) {
  return courseIdsFor_(email).map(function (id) {
    var c = getCourse_(id);
    return {
      id: c.id,
      title: c.title,
      subtitle: c.subtitle || '',
      summary: c.pickerSummary || c.subtitle || '',
      estimatedMinutes: c.estimatedMinutes || null,
      moduleCount: (c.modules || []).length,
      version: c.version
    };
  });
}

/**
 * Serialised for the client. The web app never defines content of its own, it
 * renders whatever this returns, so there is exactly one place to edit.
 *
 * The support address is swapped at serialisation time rather than written
 * into each course, so one course file can serve any deployment.
 * @param {string} courseId
 */
function getContentJson(courseId) {
  var course = getCourse_(courseId);

  // Org-level links are merged in at serialisation time rather than written
  // into each course file. A course's own links win, so a course can point at
  // a policy of its own without losing the shared ones. The course object
  // itself is not modified: a shallow copy is serialised.
  var merged = {};
  Object.keys(course).forEach(function (k) { merged[k] = course[k]; });
  merged.links = {};
  Object.keys(ORG.links || {}).forEach(function (k) { merged.links[k] = ORG.links[k]; });
  Object.keys(course.links || {}).forEach(function (k) {
    if (course.links[k]) merged.links[k] = course.links[k];
  });

  var json = JSON.stringify(merged);
  var support = supportEmail_();
  if (support && support !== DEFAULT_SUPPORT) {
    json = json.split(DEFAULT_SUPPORT).join(support);
  }
  return json;
}

/**
 * Flat answer key used by the server to re-score every submission.
 * Server-side only. This must never be sent to the client.
 * @param {string} courseId
 */
function getAnswerKey(courseId) {
  var key = {};
  getCourse_(courseId).finalExam.questions.forEach(function (q) {
    var c = q.options.filter(function (o) { return o.correct; })[0];
    key[q.id] = c ? c.id : null;
  });
  return key;
}
