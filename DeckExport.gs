/**
 * Generate a presentable deck from the same course content the web app uses.
 *
 * Creates a BRAND NEW Google Slides file every time. It never opens, edits or
 * overwrites the existing Canva-imported deck, or any deck it made earlier,
 * so there is no path by which running this damages something.
 *
 * @param {boolean} apply  Pass true to create the deck. Anything else = dry run.
 */

var DECK_ACCENT = ORG.brand.maroon;
var DECK_INK = ORG.brand.mocha;
var DECK_MUTED = ORG.brand.walnut;

/**
 * @param {string} courseId  Which course to export. Required.
 * @param {boolean} apply    Pass true to create the deck. Anything else = dry run.
 */
function generateDeck(courseId, apply) {
  var live = (apply === true);
  var course = getCourse_(courseId);
  // V1 requests the smallest possible set of permissions, so this feature's
  // scope is not granted yet. Say so plainly instead of throwing a raw
  // Google permissions error at whoever runs it.
  var NEEDED = 'https://www.googleapis.com/auth/presentations';
  if (!hasScope_(NEEDED)) {
    var m = 'Generating the Slides deck needs a permission this project has not been granted yet.\n\n' +
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

  var name = 'Cybersecurity Awareness Training v' + course.version + ', generated ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  if (!live) {
    var n = 2 + course.modules.length * 2 + 2;
    var out = 'DRY RUN, no deck created. Re-run as generateDeck(true) to create.\n' +
      'Would create a new presentation "' + name + '" with about ' + n + ' slides.\n' +
      'No existing deck is opened or modified by this function.';
    Logger.log(out);
    return out;
  }

  var deck = SlidesApp.create(name);
  var slides = deck.getSlides();
  titleSlide_(slides[0], course.title, course.subtitle || '',
    ORG.name + ' · Content version ' + course.version);

  var s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  bodySlide_(s, 'Why this training exists', [course.intro.lead].concat(course.intro.outcomes));

  course.modules.forEach(function (m) {
    var lines = [];
    m.blocks.forEach(function (b) {
      if (b.type === 'lead' || b.type === 'para') { if (lines.length < 6) lines.push(b.text); }
      else if (b.type === 'list' || b.type === 'numbered') { b.items.forEach(function (i) { if (lines.length < 8) lines.push(i); }); }
      else if (b.type === 'callout') { if (lines.length < 8) lines.push(b.title + ': ' + b.text); }
      else if (b.type === 'flags') { b.items.forEach(function (i) { if (lines.length < 9) lines.push(i.title + ': ' + i.text); }); }
      else if (b.type === 'goodbad') {
        b.good.items.forEach(function (i) { if (lines.length < 8) lines.push('DO: ' + i); });
        b.bad.items.forEach(function (i) { if (lines.length < 10) lines.push('DON\'T: ' + i); });
      }
    });
    bodySlide_(deck.appendSlide(SlidesApp.PredefinedLayout.BLANK),
      m.number + '. ' + m.title, lines.slice(0, 8));

    var c = m.check;
    var qLines = [];
    if (c.type === 'mcq') {
      c.options.forEach(function (o, i) { qLines.push(String.fromCharCode(65 + i) + ': ' + o.text); });
      qLines.push('');
      qLines.push('Answer: ' + c.options.filter(function (o) { return o.correct; })
        .map(function (o) { return o.text; })[0]);
    } else {
      qLines.push(c.explain);
    }
    bodySlide_(deck.appendSlide(SlidesApp.PredefinedLayout.BLANK), 'Scenario: ' + m.title, [c.prompt, ''].concat(qLines));
  });

  bodySlide_(deck.appendSlide(SlidesApp.PredefinedLayout.BLANK), 'Key takeaways', course.takeaways);
  bodySlide_(deck.appendSlide(SlidesApp.PredefinedLayout.BLANK), course.closing.title,
    course.closing.body.concat(['', 'Questions or anything suspicious: ' + course.closing.contact]));

  deck.saveAndClose();
  Logger.log('Created: ' + deck.getUrl());
  return 'Created new deck: ' + deck.getUrl();
}

function titleSlide_(slide, title, sub, foot) {
  slide.getShapes().forEach(function (sh) { sh.remove(); });
  var t = slide.insertTextBox(title, 50, 130, 620, 90);
  style_(t, 34, true, DECK_ACCENT);
  var b = slide.insertTextBox(sub, 50, 225, 620, 60);
  style_(b, 16, false, DECK_INK);
  var f = slide.insertTextBox(foot, 50, 330, 620, 30);
  style_(f, 11, false, DECK_MUTED);
}

function bodySlide_(slide, title, lines) {
  slide.getShapes().forEach(function (sh) { sh.remove(); });
  var t = slide.insertTextBox(title, 50, 40, 620, 50);
  style_(t, 24, true, DECK_ACCENT);
  var body = lines.filter(function (l) { return l !== undefined && l !== null; }).join('\n');
  var b = slide.insertTextBox(body || ' ', 50, 105, 620, 280);
  style_(b, 13, false, DECK_INK);
  b.getText().getParagraphs().forEach(function (p) {
    p.getRange().getTextStyle().setFontFamily('Arial');
  });
}

function style_(shape, size, bold, colour) {
  var s = shape.getText().getTextStyle();
  s.setFontFamily('Arial').setFontSize(size).setBold(!!bold).setForegroundColor(colour);
}
