/**
 * Example Academies, Child Safeguarding Training.
 * SINGLE SOURCE OF TRUTH for this course's content.
 *
 * ORIGIN AND STATUS. The substance here came from the original course author's Example
 * Education course, which was built from the EE Child Safeguarding deck. The
 * teaching content (the Four Rs, boundaries, signs of distress, the mental
 * health material, the two pathways) transfers to Example Academies as it
 * stands and has not been rewritten.
 *
 * WHAT DOES NOT TRANSFER is every fact about who to tell and how. Those are EE
 * facts: EE's report form, EE's Child Safety Lead, EE's regional contacts, EE's
 * policy. Shipping them to a Hillcrest teacher would send a real concern
 * about a real child to the wrong organisation. They have therefore been pulled
 * out into SAFEGUARDING_UNIVERSAL and SCHOOLS below.
 *
 * The placeholders read «HR TO CONFIRM» on purpose. If this course is deployed
 * before HR has answered, a member of staff sees that phrase in the middle of
 * the reporting instructions and raises it within the hour. A quietly plausible
 * wrong address would not be noticed at all.
 *
 * Built from the Example Education Child Safeguarding deck. The wording
 * follows the deck closely. Where this file departs from it, the departure is
 * marked with a NOTE comment so it can be reviewed rather than discovered.
 *
 * This course carries material about abuse, self-harm and suicide. That is
 * deliberate and necessary: staff cannot recognise what they have never been
 * shown. The deck's own content warning is carried into the intro rather than
 * dropped, and the reporting routes are repeated at the end of every module
 * that describes something a person might need to act on, because someone
 * reading this while worried about a specific child should never have to hunt
 * for what to do next.
 *
 * This file defines one global, SAFEGUARDING, and does nothing else at load
 * time. Courses.gs picks it up lazily by name.
 */

var SAFEGUARDING_VERSION = '1.0';

/**
 * The Example Academies facts this course depends on.
 *
 * Everything HR needs to supply is here and nowhere else, so their answers are
 * a single edit to this block rather than a hunt through 600 lines of content.
 *
 * ON NAMING INDIVIDUALS. the author's version lists ten regional contacts by name.
 * Be aware of what that costs: naming people couples the course content to
 * staff changes, so every leaver or role change is a content edit, and a
 * content edit that matters means bumping SAFEGUARDING_VERSION, and a version
 * bump means every member of staff is owed the course again. Across five small
 * schools that churn will be constant. RECOMMENDATION: name the role and the
 * shared mailbox, and link out to a page that lists the current people, so the
 * list stays right without ever reissuing the training.
 */
/**
 * WHAT IS THE SAME EVERYWHERE.
 *
 * These five schools share a duty and a vocabulary, not a phone list. Anything
 * that is true wherever a member of staff works lives here; anything that
 * depends on which school they work at lives in SCHOOLS below.
 *
 * ON "DSL". Designated Safeguarding Lead is the term the academies' own
 * safeguarding policies use, so it is the term the training uses. the author's EE
 * version said "Child Safety Lead" and "Designated Child Safety Officer",
 * neither of which is a role that exists here. A member of staff who has just
 * been told a child is at risk should not have to work out who the course
 * meant.
 */
var SAFEGUARDING_UNIVERSAL = {
  // Reporting a concern about a DSL. Deliberately NOT per school: the whole
  // point is a route that does not pass through the person concerned, and a
  // school-level route would sooner or later run back into them.
  escalationLegal: 'legal@academies.example.org',
  escalationCeoName: 'Alex Morgan, CEO',
  escalationCeoEmail: 'alex.morgan@academies.example.org',

  // Statutory agencies. The NZ academies sit under New Zealand law; EOA teaches
  // students in many countries, so the wording has to carry both without
  // implying a New Zealand agency can act for a child in another jurisdiction.
  agenciesNz: 'Oranga Tamariki or the New Zealand Police',
  emergencyNz: '111',
  internationalNote: 'If the child is outside New Zealand, call the local emergency number and, where there is one, the child protection authority for the country they are in. A New Zealand agency cannot act for a child overseas.',

  // TODO(maintainer): who staff go to for their own support if this material raises
  // something personal. Left as a placeholder rather than guessed: pointing a
  // distressed member of staff at the wrong team is its own harm.
  pastoralContact: '«CONFIRM: who staff go to for their own support»'
};

/**
 * WHAT DIFFERS BY SCHOOL.
 *
 * One entry per school, rendered as its own block in the reporting module, so a
 * Hillcrest teacher reads Hillcrest's contacts and is not left deciding
 * whether an Northbridge address applies to them.
 *
 * This structure exists because of the mistake it prevents. The course this was
 * built from carried Example Education's ten regional contacts, which were
 * wrong for every reader it now has. Filling one school's names into a single
 * shared list would repeat that error with a different set of names.
 *
 * Northbridge's entry is complete, taken from that school's current
 * safeguarding policy. The rest are placeholders and read as «CONFIRM» on the
 * page, so an unfilled school is obvious to the reader and to whoever signs the
 * course off, rather than quietly absent.
 */
var SCHOOLS = [
  {
    name: 'Northbridge Academy',
    dsls: [
      { title: 'Jordan Lee, Principal', text: 'Whole-school safeguarding and compliance oversight. principal@northbridge-academy.example.org' },
      { title: 'Casey Taylor, Deputy Principal', text: 'Online learning safeguarding and student wellbeing. deputy-principal@northbridge-academy.example.org' },
      { title: 'Safeguarding Team', text: 'Open to anyone at the school. safeguarding@northbridge-academy.example.org' }
    ],
    reportRoute: 'Submit a safeguarding concern form, or speak to or email a DSL below.',
    policyName: 'Safeguarding and Child Protection Policy (AIA-CP-01)',
    policyUrl: ''
  },
  {
    name: 'Example Online Academy',
    dsls: [{ title: '«CONFIRM: EOA DSLs»', text: '«CONFIRM: name, role and email»' }],
    reportRoute: '«CONFIRM: how EOA staff file a safeguarding concern»',
    policyName: '«CONFIRM: EOA safeguarding policy»',
    policyUrl: ''
  },
  {
    name: 'Riverside School',
    dsls: [{ title: '«CONFIRM: Riverside School DSLs»', text: '«CONFIRM: name, role and email»' }],
    reportRoute: '«CONFIRM: how Riverside School staff file a safeguarding concern»',
    policyName: '«CONFIRM: Riverside School safeguarding policy»',
    policyUrl: ''
  },
  {
    name: 'Hillcrest School',
    dsls: [{ title: '«CONFIRM: Hillcrest DSLs»', text: '«CONFIRM: name, role and email»' }],
    reportRoute: '«CONFIRM: how Hillcrest staff file a safeguarding concern»',
    policyName: '«CONFIRM: Hillcrest safeguarding policy»',
    policyUrl: ''
  },
  {
    name: 'Example Academies Org',
    dsls: [{ title: '«CONFIRM: org-level DSLs»', text: '«CONFIRM: name, role and email»' }],
    reportRoute: '«CONFIRM: how org staff file a safeguarding concern»',
    policyName: '«CONFIRM: org safeguarding policy»',
    policyUrl: ''
  }
];

/** Every school's contacts, as blocks the renderer already understands. */
function schoolBlocks_() {
  var out = [];
  SCHOOLS.forEach(function (sc) {
    out.push({ type: 'heading', text: sc.name });
    out.push({ type: 'para', text: sc.reportRoute });
    out.push({ type: 'steps', items: sc.dsls });
  });
  return out;
}

var SAFEGUARDING = {
  id: 'safeguarding',
  version: SAFEGUARDING_VERSION,
  updated: '2026-09-15',
  title: 'Child Safeguarding Training',
  pickerSummary: 'Recognise when a child may be at risk, and know exactly how to record and report it.',
  subtitle: 'For all Example Academies staff who work directly with minors',
  passMark: 0.8,
  estimatedMinutes: 25,

  intro: {
    lead: 'Every adult has a legal and moral duty to protect children. This training ensures you know what to look for and how to respond.',
    body: [
      'This training is designed to provide general awareness and guidance on child safeguarding and mental health recognition and response for all Example Academies staff who work directly with minors. It is intended to supplement, not replace, your professional judgment, organisational policies, and any jurisdiction-specific legal requirements.',
      'This training contains material that may be distressing or triggering for some. It covers abuse, self-harm and suicide. If you find it difficult, it is fine to stop, take a break and come back. If it raises something for you personally, please speak to ' + SAFEGUARDING_UNIVERSAL.pastoralContact + '.',
      'Your role is not to investigate, diagnose or counsel. Your role is to notice, write it down, and report it.'
    ],
    outcomes: [
      'Understand the Four Rs: Recognise, Record, Report, Refer',
      'Know what a Designated Safeguarding Lead is, and who yours is',
      'Keep professional boundaries that protect both children and you',
      'Recognise universal signs of distress, and the mental health concerns we most often see',
      'Know the red flags that mean acting immediately',
      'Know which reporting pathway to use, and how to record a concern properly',
      'Know how to report a concern about a member of staff'
    ],
    privacyNotice: 'Your answers and completion are recorded against your Example account so we can evidence that training has been completed. Getting an answer wrong is not held against you. The results are used to decide what we need to explain better. You can retake this at any time.'
  },

  modules: [

    /* ------------------------------------------------------------------ 1 */
    {
      id: 'why',
      number: 1,
      title: 'Why this matters',
      summary: 'You are the trusted adult who notices when something is not right.',
      art: 'globe',
      blocks: [
        { type: 'lead', text: 'Every adult has a legal and moral duty to protect children. This training ensures you know what to look for and how to respond.' },
        {
          type: 'stats',
          items: [
            /* The tile that used to sit here read "3 to 4 child safety concerns
               are raised each month on average across all regions". It was
               Example Education's figure, it had no source, and it described a
               different organisation. A number on a compliance course is read as
               fact, so an unsourced one is worse than no number at all. */
            { figure: 'Under 18', label: 'is a child in law, and that is everyone we teach' },
            { figure: 'Most', label: 'concerns do not involve immediate physical risk' },
            { figure: 'Your role', label: 'is to notice, record and report' }
          ]
        },
        { type: 'para', text: 'Most concerns do not involve immediate physical risk. They involve mental health, emotional distress, or suspected emotional abuse. Those are harder to spot than a physical injury, which is exactly why the person who notices matters so much.' },
        {
          type: 'callout', tone: 'info', title: 'You are the trusted adult who notices',
          text: 'Your role is to be the eyes and ears. You are not expected to investigate, diagnose, or decide whether a concern is serious enough. You are expected to notice, record, and report.'
        }
      ],
      check: {
        id: 'q-sg-why',
        type: 'mcq',
        prompt: 'A student seems withdrawn and unlike themselves over several sessions. Nothing has been said outright and there is no sign of physical harm. What is your role?',
        options: [
          { id: 'b', text: 'Notice it, write down what you observed, and report it', correct: true, feedback: 'Correct. Recognise, record, report. Deciding what it means is the Designated Safeguarding Lead’s job, not yours.' },
          { id: 'a', text: 'Wait until you have something concrete before raising it', feedback: 'Most concerns are exactly this: a pattern with nothing concrete. Waiting for certainty is how patterns get missed.' },
          { id: 'c', text: 'Ask the student directly whether they are being abused', feedback: 'Investigating is not your role, and direct questioning can compromise a later investigation. Report what you noticed.' },
          { id: 'd', text: 'Mention it informally to a colleague and see what they think', feedback: 'An informal chat leaves no record and triggers no support. Use the reporting pathway.' }
        ],
        explain: 'Most concerns are patterns rather than incidents. You are not being asked to be certain, only to notice and report.'
      }
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'four-rs',
      number: 2,
      title: 'Our responsibilities: the Four Rs',
      summary: 'Recognise, Record, Report, Refer, and who you report to.',
      art: 'shield',
      blocks: [
        { type: 'lead', text: 'Four steps, in order. They are deliberately simple, because they have to work on the day you are worried and not thinking clearly.' },
        {
          type: 'steps',
          items: [
            { title: 'Recognise', text: 'Notice the sign, behaviour, or disclosure. Trust your instincts.' },
            { title: 'Record', text: 'Make brief, factual notes immediately. Use the child’s exact words. Include date and time.' },
            { title: 'Report', text: 'Submit a Safeguarding Report immediately. Do not wait.' },
            { title: 'Refer', text: 'A Designated Safeguarding Lead connects the child with support. Your job is done once you report.' }
          ]
        },
        {
          type: 'callout', tone: 'good', title: 'Your job is done once you report',
          text: 'You do not have to decide what happens next, follow up with the family, or judge whether the concern was serious enough. Referring is the safeguarding team’s responsibility, not yours.'
        },
        { type: 'heading', text: 'Who is a DSL?' },
        { type: 'para', text: 'A Designated Safeguarding Lead, usually shortened to DSL, is a senior member of staff at your school whose job includes safeguarding. Every Example Academies school has at least one, and most have a deputy who steps in when the DSL is unavailable. They are the person you send a concern to.' },
        {
          type: 'steps',
          items: [
            { title: 'They are trained for this', text: 'DSLs are trained in child protection law and guidance, including the specific risks of teaching online, which is why the decision about what a concern means is theirs and not yours.' },
            { title: 'They are the first point of contact', text: 'For any concern, disclosure or allegation, about a student, a colleague, a contractor or anyone else connected to the school.' },
            { title: 'They decide what happens next', text: 'Including whether to involve outside agencies, whether to tell parents, and whether anything further is needed. You will not always be told the outcome, and that is not a sign nothing happened.' },
            { title: 'They keep the record', text: 'Safeguarding records are held securely and separately from academic files, and only the safeguarding team can see them.' }
          ]
        },
        {
          type: 'callout', tone: 'info', title: 'Find out who yours is before you need to know',
          text: 'Your school’s DSLs are listed by name in section 7, Reporting and documentation. Two minutes now is better than looking it up while you are worried about a child.'
        }
      ],
      check: {
        id: 'q-sg-rs',
        type: 'mcq',
        prompt: 'A child tells you something worrying at the end of a call. What do you do first?',
        options: [
          { id: 'a', text: 'Ask follow-up questions so your report is more complete', feedback: 'Questioning risks leading the child and can compromise a later investigation. Record what was actually said.' },
          { id: 'b', text: 'Write down what they said, in their exact words, with the date and time', correct: true, feedback: 'Correct. Record comes straight after Recognise, and it is done immediately while the words are fresh.' },
          { id: 'c', text: 'Contact the parents to check what is going on', feedback: 'That is not your call to make, and in some circumstances it could put the child at greater risk.' },
          { id: 'd', text: 'Wait until you can speak to a DSL in person', feedback: 'Reporting does not wait on a conversation. Record it, then send it.' }
        ],
        explain: 'Record immediately, in the child’s own words. Memory degrades quickly, and exact wording is what makes a record useful later.'
      }
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'boundaries',
      number: 3,
      title: 'Professional boundaries',
      summary: 'Boundaries protect the child, and they protect you.',
      art: 'boundary',
      blocks: [
        { type: 'lead', text: 'Clear boundaries keep relationships safe. They protect children from harm, and they protect you from conduct that could be misread.' },
        {
          type: 'goodbad',
          good: {
            title: 'Always',
            items: [
              'Use official Example channels for communication',
              'Be mindful of your language and behaviour',
              'Be open, accessible, and prepared to listen'
            ]
          },
          bad: {
            title: 'Never',
            items: [
              'Engage in personal texts or phone conversations with a child, unless parents are looped in',
              'Accept a child’s personal friend requests on social media',
              'Meet a child alone in an unobserved setting',
              'Engage in conduct that could lead others to question your motives'
            ]
          }
        },
        { type: 'heading', text: 'What we expect from all employees' },
        {
          type: 'list',
          items: [
            'Respect: respect all individuals regardless of their age, gender, ethnicity, developmental stage, sexual orientation, religion, belief, or disability.',
            'Digital awareness: be mindful that students and parents can look up your social media profiles.',
            'Accessibility: when you work with children, be open, accessible, and always prepared to listen to their needs.',
            'Reporting: report any concern, however small it seems.'
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'The last one is the one people talk themselves out of',
          text: 'Conduct that could lead others to question your motives is a boundary even when your intentions are entirely good. If a situation would be hard to explain later, do not put yourself in it.'
        }
      ],
      check: {
        id: 'q-sg-bound',
        type: 'mcq',
        prompt: 'A student you work with sends you a friend request on Instagram and messages you there about a session. What do you do?',
        options: [
          { id: 'a', text: 'Accept it but keep the conversation strictly about work', feedback: 'The boundary is the channel itself, not the subject matter. Personal social media is not an official Example channel.' },
          { id: 'c', text: 'Accept it so you do not seem cold or dismissive', feedback: 'A brief explanation that you keep work conversations on Example channels is not cold. It is the rule, and it protects you both.' },
          { id: 'b', text: 'Do not accept it, and move the conversation back to official Example channels', correct: true, feedback: 'Correct. Never accept a child’s personal friend requests, and keep communication where it can be seen.' },
          { id: 'd', text: 'Ignore it and say nothing', feedback: 'Ignoring it is better than accepting, but the student still needs to know where to reach you properly.' }
        ],
        explain: 'Official channels exist so that contact with a child is observable. A private channel removes the thing that makes it safe.'
      }
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'signs',
      number: 4,
      title: 'Recognising signs',
      summary: 'Universal signs that apply to any type of abuse or distress.',
      art: 'eye',
      blocks: [
        { type: 'lead', text: 'These signs apply to any type of abuse or distress. If you notice them, pay attention.' },
        {
          type: 'flags',
          items: [
            { title: 'Emotional and behavioural', text: 'Appearing anxious or withdrawn. Drastic changes from their baseline behaviour.' },
            { title: 'Physical', text: 'Significant weight loss or gain. Looking unkempt, sloppy, or unhealthy.' },
            { title: 'Appearance', text: 'Looking always tired, or looking like they have recently been crying.' }
          ]
        },
        { type: 'para', text: 'The word that matters most here is “baseline”. A quiet child who is quiet today is not a concern. A talkative child who has gone quiet for three weeks is. You know what normal looks like for the students you work with, and that is exactly why you are the person who will spot it.' },
        {
          type: 'callout', tone: 'info', title: 'Trust your instincts',
          text: 'A gut feeling that something is wrong is a legitimate reason to file a report. You do not need evidence, and you are not expected to be right.'
        }
      ],
      check: {
        id: 'q-sg-signs',
        type: 'mcq',
        prompt: 'Which of these is most likely to be a safeguarding concern?',
        options: [
          { id: 'a', text: 'A student who is quiet in sessions and always has been', feedback: 'Quiet is not a concern in itself. What matters is change from their own baseline.' },
          { id: 'c', text: 'A student who is tired the morning after an exam', feedback: 'Context explains it. A one-off with an obvious cause is different from a sustained change.' },
          { id: 'd', text: 'A student who disagrees with your feedback', feedback: 'Disagreement is normal and healthy, not a sign of distress.' },
          { id: 'b', text: 'A normally engaged student who has become withdrawn and looks like they have been crying', correct: true, feedback: 'Correct. A drastic change from baseline, plus a physical sign, is exactly the pattern to notice.' }
        ],
        explain: 'Change from a child’s own baseline is the signal. Not how they compare to other students, but how they compare to themselves.'
      }
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'mental-health',
      number: 5,
      title: 'Mental health',
      summary: 'What we most often encounter, and why it is a safeguarding matter.',
      art: 'clock',
      blocks: [
        { type: 'lead', text: 'The World Health Organization defines mental health as not merely the absence of illness but a state of well-being in which every individual realises their potential, copes with normal life stresses, works productively, and contributes to their community.' },
        { type: 'heading', text: 'Why this sits inside safeguarding' },
        { type: 'para', text: 'Mental health concerns can be both a consequence of abuse or neglect, and a vulnerability factor that increases a child’s risk of experiencing harm. That is why they belong here rather than somewhere separate.' },
        {
          type: 'heading', text: 'Vulnerability factors in our students'
        },
        {
          type: 'list',
          items: [
            'Cultural displacement',
            'Academic pressure',
            'Family separation',
            'Identity exploration across cultures'
          ]
        },
        { type: 'heading', text: 'Common mental health concerns we encounter' },
        {
          type: 'steps',
          items: [
            { title: 'Depression', text: 'Persistent sadness, loss of interest, withdrawal, fatigue.' },
            { title: 'Anxiety', text: 'Excessive worry, panic attacks, avoidance behaviours.' },
            { title: 'Emotional breakdown', text: 'Crying spells, inability to focus, emotional volatility.' },
            { title: 'Panic attacks', text: 'Shortness of breath, racing heart, trembling, feeling of impending doom.' },
            { title: 'Suicidal ideation', text: 'Statements about wanting to die, giving away possessions, talking about being a burden.' },
            { title: 'Self-harm', text: 'Unexplained cuts, burns, or scratches. Wearing long sleeves in warm weather.' },
            { title: 'Eating concerns', text: 'Drastic weight changes, obsession with food or body image.' },
            { title: 'SEN-related distress', text: 'Students with Autism Spectrum Disorder, ADHD, or other conditions experiencing overwhelm.' }
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'Recognising is not diagnosing',
          text: 'This list is here so you can describe what you are seeing, not so you can label it. Write down the behaviour you observed, not the condition you think it is.'
        }
      ],
      check: {
        id: 'q-sg-mh',
        type: 'mcq',
        prompt: 'Why is mental health part of safeguarding rather than a separate topic?',
        options: [
          { id: 'b', text: 'Because it can be both a consequence of abuse or neglect, and a factor that increases a child’s risk of harm', correct: true, feedback: 'Correct. It works in both directions, which is why it cannot be separated out.' },
          { id: 'a', text: 'Because safeguarding covers anything to do with student welfare', feedback: 'True but vague. There is a more specific reason.' },
          { id: 'c', text: 'Because staff are expected to provide mental health support', feedback: 'They are not. Your role is to recognise and report, and to let the safeguarding team refer.' },
          { id: 'd', text: 'Because most concerns raised turn out to be mental health related', feedback: 'Most concerns do involve mental health or emotional distress, but that is a statistic, not the reason the two are linked.' }
        ],
        explain: 'Mental health is both an outcome of harm and a risk factor for it. That two-way link is why it belongs inside safeguarding.'
      }
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'red-flags',
      number: 6,
      title: 'Red flags: when to act immediately',
      summary: 'Suicide risk is the most critical red flag. These are the words and behaviours to know.',
      art: 'flag',
      blocks: [
        { type: 'lead', text: 'Most concerns follow the ordinary reporting pathway. Some do not. These are the signs that mean acting immediately.' },
        { type: 'heading', text: 'Direct statements' },
        {
          type: 'list',
          items: [
            '"I want to die."',
            '"I’m going to kill myself."',
            '"I wish I was dead."',
            '"I have a plan to end my life."',
            '"I won’t be a problem for you much longer."',
            '"What’s the point?"',
            '"Everyone would be better off without me."',
            '"I just want to sleep forever."'
          ]
        },
        { type: 'heading', text: 'Behavioural red flags' },
        {
          type: 'list',
          items: [
            'Giving away prized possessions',
            'Sudden calm after a period of depression, which may indicate a decision to attempt suicide',
            'Researching methods of suicide',
            'Writing a goodbye letter or note',
            'Expressing feeling like a burden to others'
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'Sudden calm is not recovery',
          text: 'A student who has been visibly distressed and then seems suddenly at peace is not necessarily better. It can indicate that a decision has been made. Treat it as a red flag, not a relief.'
        },
        {
          type: 'callout', tone: 'info', title: 'If any of these are present',
          text: 'Use Reporting Pathway 2 in the next section. Emergency services first, then a DSL, then the written record.'
        }
      ],
      check: {
        id: 'q-sg-flags',
        type: 'mcq',
        prompt: 'A student who has been low for weeks suddenly seems calm and settled, and mentions they have been sorting out who should have some of their things. How do you read that?',
        options: [
          { id: 'a', text: 'Good news, they appear to be recovering', feedback: 'This is the most dangerous misreading in the whole course. Sudden calm after depression can indicate a decision has been made.' },
          { id: 'b', text: 'Two red flags together, sudden calm and giving away possessions, so act immediately', correct: true, feedback: 'Correct. Both are recognised warning signs, and together they are urgent.' },
          { id: 'c', text: 'Worth keeping an eye on over the next few weeks', feedback: 'Watchful waiting is the wrong response to this combination. It needs acting on now.' },
          { id: 'd', text: 'Normal behaviour for a student finishing a programme', feedback: 'Giving away prized possessions is not routine tidying, and the sudden change in mood is the other half of the signal.' }
        ],
        explain: 'Sudden calm after a period of depression and giving away prized possessions are both recognised suicide warning signs. Together they mean acting immediately, not observing.'
      }
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'reporting',
      number: 7,
      title: 'Reporting and documentation',
      summary: 'Two pathways, and the four rules for writing a concern down.',
      art: 'inbox',
      blocks: [
        { type: 'heading', text: 'Pathway 1: most concerns, no immediate danger' },
        { type: 'para', text: 'Use this pathway when you notice a worrying pattern such as repeated signs of distress, when a child discloses but is currently safe, when you have a gut feeling something is wrong, or when you observe concerning behaviour but no immediate risk.' },
        {
          type: 'steps',
          items: [
            { title: 'Record', text: 'Write down what you saw or heard, using the child’s exact words in quotation marks. Include the date and time.' },
            { title: 'Report', text: 'Send it to a Designated Safeguarding Lead at your school, using your school’s safeguarding concern form or its messaging platform. Your school’s contacts are listed below.' },
            { title: 'Stop there', text: 'The DSL assesses it and decides what happens next, including whether to involve outside agencies. Referring is their step, not yours.' }
          ]
        },
        {
          type: 'callout', tone: 'info', title: 'Timeline',
          text: 'Report as soon as possible. Do not wait until the end of the day, and do not wait to see whether it happens again.'
        },
        {
          type: 'callout', tone: 'warn', title: 'You cannot promise to keep it secret',
          text: 'If a child asks you to keep something to yourself, do not agree to it. Tell them you have to pass it on to someone whose job is to help, and that you will tell them what happens next. Promising secrecy and then breaking it costs you the child’s trust at the worst possible moment.'
        },
        { type: 'heading', text: 'Pathway 2: immediate risk' },
        { type: 'para', text: 'Use this pathway when there is a risk to a child’s life, when serious harm is likely to occur right now, when a child expresses suicidal intent with a plan, or when you witness active self-harm or violence.' },
        {
          type: 'numbered',
          items: [
            'FIRST: call emergency services immediately. ' + SAFEGUARDING_UNIVERSAL.emergencyNz + ' in New Zealand, or the local emergency number where the child is.',
            'SECOND: contact a DSL at your school.',
            'THEN: write the record.'
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'Safety first',
          text: 'Your duty to protect the child overrides all other considerations. Do not delay an emergency response to complete internal paperwork.'
        },
        {
          type: 'callout', tone: 'info', title: 'Our students are not all in one country',
          text: SAFEGUARDING_UNIVERSAL.internationalNote + ' For students in New Zealand, a DSL may escalate to ' +
            SAFEGUARDING_UNIVERSAL.agenciesNz + '. That escalation is the DSL’s decision and their job, not yours.'
        },
        { type: 'heading', text: 'The threshold for acting' },
        { type: 'para', text: 'You do not need proof. You need a reasonable belief that something may not be right. The test that decides whether outside agencies get involved is whether a child is at risk of significant harm, and applying that test is the DSL’s job. Yours is to pass on what you noticed so that somebody can apply it.' },
        { type: 'heading', text: 'The four rules of recording' },
        {
          type: 'steps',
          items: [
            { title: 'Be factual', text: 'Record what you saw and heard. Do not record assumptions, opinions or conclusions.' },
            { title: 'Use quotations', text: 'Wherever you can, use the child’s exact words and put them in quotation marks. Paraphrasing loses the detail that matters later.' },
            { title: 'Date and sign', text: 'Every entry carries a date and time. If you add something later, mark it as a late entry rather than editing what you first wrote.' },
            { title: 'Chronological order', text: 'Record events in the order they happened.' }
          ]
        },
        {
          type: 'callout', tone: 'info', title: 'What happens to what you write',
          text: 'The record goes to a DSL and is held securely, separately from academic files, and for a long time: safeguarding records are typically kept until the student’s 25th birthday. Only the safeguarding team sees them. That is also why a factual record matters more than a tidy one.'
        },
        { type: 'heading', text: 'Who to contact at your school' },
        { type: 'para', text: 'Find your school below. If a name here is out of date, tell your DSL so the course can be corrected.' }
      ].concat(schoolBlocks_()),
      check: {
        id: 'q-sg-report',
        type: 'mcq',
        prompt: 'A student tells you during a call that they have a plan to end their life tonight. What is your first action?',
        options: [
          { id: 'a', text: 'Write the record so the DSL is alerted', feedback: 'The record matters, but it is not first. Internal paperwork never delays an emergency response.' },
          { id: 'c', text: 'Email a DSL and wait for a reply', feedback: 'Waiting for a reply is a delay this situation cannot absorb.' },
          { id: 'b', text: 'Call local emergency services immediately', correct: true, feedback: 'Correct. Suicidal intent with a plan is Pathway 2. Emergency services first, then a DSL, then the record.' },
          { id: 'd', text: 'Contact the parents so they can intervene', feedback: 'Not first, and not your call to make in an emergency. Emergency services come before every other consideration.' }
        ],
        explain: 'Suicidal intent with a plan is immediate risk. Emergency services first, a DSL second, the written record third. In that order, every time.'
      }
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'allegations',
      number: 8,
      title: 'Concerns about a colleague',
      summary: 'The obligation is the same, and you are protected for raising it.',
      art: 'key',
      blocks: [
        { type: 'lead', text: 'If you have concerns about any member of Example staff, contractors, or former staff members, you must report them.' },
        { type: 'heading', text: 'When to report a staff member' },
        {
          type: 'list',
          items: [
            'They behave in a way that harms or may have harmed a child',
            'They behave toward a child in a way that indicates they may pose a risk of harm',
            'They behave in a way that indicates they may not be suitable to work with children'
          ]
        },
        { type: 'heading', text: 'How to report' },
        { type: 'para', text: 'The same way as any other safeguarding concern. There is no separate form and no separate process, and that is deliberate: a different route for allegations about staff would be one more thing to work out at the worst possible moment.' },
        {
          type: 'list',
          items: [
            'Send it to a DSL at your school, using your school’s safeguarding concern form or its messaging platform.',
            'Or report to your manager or academic leadership.'
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'If the concern is about a DSL',
          text: 'Do not use the normal route, because it runs through the person you are concerned about. Report directly to Legal at ' +
            SAFEGUARDING_UNIVERSAL.escalationLegal + ', or to ' + SAFEGUARDING_UNIVERSAL.escalationCeoName +
            ' at ' + SAFEGUARDING_UNIVERSAL.escalationCeoEmail + '. It will be handled independently of the DSL concerned.'
        },
        {
          type: 'callout', tone: 'good', title: 'You are protected for raising it',
          text: 'Raising a safeguarding concern in good faith protects you from retaliation, professional disadvantage and discrimination, whether or not the concern turns out to be founded. Your school’s safeguarding policy says so, and for staff in New Zealand the Protected Disclosures (Protection of Whistleblowers) Act 2022 may also apply.'
        },
        { type: 'para', text: 'Note the standard. It is not that you are sure, and it is not that harm has occurred. Behaviour that indicates someone may pose a risk is enough to report.' }
      ],
      check: {
        id: 'q-sg-alleg',
        type: 'mcq',
        prompt: 'You notice a colleague messaging a student on a personal number. Nothing about the messages looks harmful, and you are worried about the consequences of being wrong.',
        options: [
          { id: 'a', text: 'Raise it with the colleague directly first', feedback: 'That risks a conversation that shapes what happens next, and it leaves no record.' },
          { id: 'c', text: 'Wait to see whether anything else happens', feedback: 'The boundary has already been crossed. Waiting adds risk without adding certainty.' },
          { id: 'd', text: 'Say nothing, since the messages looked harmless', feedback: 'Judging the content is not your role. Personal-channel contact with a child is itself the concern.' },
          { id: 'b', text: 'Report it, because behaviour that could indicate a risk is enough', correct: true, feedback: 'Correct. The threshold is behaviour that may indicate risk, not proof of harm. Whistleblowers are protected if the concern turns out to be unfounded.' }
        ],
        explain: 'You are not required to be certain, and you are protected if the concern turns out to be unfounded. Reporting a doubt is exactly what the process is for.'
      }
    }
  ],

  /* -------------------------------------------------------------------- */
  finalExam: {
    title: 'Final check',
    intro: 'Ten questions covering everything above. You need 80% to complete the training, and you can retake it as many times as you like.',
    questions: [
      {
        id: 's1',
        prompt: 'What are the Four Rs, in order?',
        options: [
          { id: 'a', text: 'Recognise, Record, Report, Refer', correct: true },
          { id: 'b', text: 'Recognise, Respond, Record, Report' },
          { id: 'c', text: 'Record, Recognise, Refer, Report' },
          { id: 'd', text: 'Report, Record, Recognise, Refer' }
        ],
        explain: 'Recognise, Record, Report, Refer. Referring is the safeguarding team’s job. Your job is done once you report.'
      },
      {
        id: 's2',
        prompt: 'A child discloses something to you. How should you write it down?',
        options: [
          { id: 'a', text: 'Summarise it in your own words once you have had time to think' },
          { id: 'b', text: 'Immediately, factually, in the child’s exact words, with the date and time', correct: true },
          { id: 'c', text: 'With your assessment of how serious you think it is' },
          { id: 'd', text: 'Only after you have checked whether it is likely to be true' }
        ],
        explain: 'Be factual, use quotations, date and sign, chronological order. Assumptions and opinions do not belong in the record.'
      },
      {
        id: 's3',
        prompt: 'A student expresses suicidal intent and describes a plan. What do you do first?',
        options: [
          { id: 'a', text: 'File the internal Safeguarding Report' },
          { id: 'b', text: 'Email a DSL' },
          { id: 'c', text: 'Call local emergency services immediately', correct: true },
          { id: 'd', text: 'Contact the student’s parents' }
        ],
        explain: 'This is Pathway 2. Emergency services, then a DSL, then the record. Never delay the emergency response for paperwork.'
      },
      {
        id: 's4',
        prompt: 'Which of these is a recognised suicide warning sign?',
        options: [
          { id: 'b', text: 'Asking for an extension on a deadline' },
          { id: 'c', text: 'Disagreeing with feedback on an application' },
          { id: 'd', text: 'Wanting to change university preferences' },
          { id: 'a', text: 'Sudden calm after a period of depression', correct: true }
        ],
        explain: 'Sudden calm can indicate that a decision has been made. It is a red flag, not a sign of recovery.'
      },
      {
        id: 's5',
        prompt: 'A student sends you a friend request on a personal social media account. What is the correct response?',
        options: [
          { id: 'b', text: 'Do not accept it, and keep contact on official Example channels', correct: true },
          { id: 'a', text: 'Accept it, but only discuss work' },
          { id: 'c', text: 'Accept it if their parents are also connected to you' },
          { id: 'd', text: 'Accept it so the student does not feel rejected' }
        ],
        explain: 'Never accept a child’s personal friend requests. Official channels are what make contact observable, and observable is what makes it safe.'
      },
      {
        id: 's6',
        prompt: 'You have a gut feeling that something is wrong with a student, but nothing concrete to point to. What should you do?',
        options: [
          { id: 'a', text: 'Wait until you have evidence' },
          { id: 'b', text: 'Report it. A gut feeling is a legitimate reason to file', correct: true },
          { id: 'c', text: 'Ask the student outright what is going on' },
          { id: 'd', text: 'Mention it informally to a colleague' }
        ],
        explain: 'Trust your instincts. You are not expected to be certain, and you are not expected to be right.'
      },
      {
        id: 's7',
        prompt: 'Which of these belongs in a safeguarding record?',
        options: [
          { id: 'a', text: 'Your view on whether the child is telling the truth' },
          { id: 'b', text: 'Your theory about what is causing the behaviour' },
          { id: 'c', text: 'What you saw and heard, with the child’s words in quotation marks', correct: true },
          { id: 'd', text: 'A summary written up at the end of the week' }
        ],
        explain: 'Record what you saw and heard. Do not record assumptions or opinions, and do not leave it until later.'
      },
      {
        id: 's8',
        prompt: 'You have a concern about a colleague’s behaviour toward a child, but you are not sure anything has actually happened. What is the threshold for reporting?',
        options: [
          { id: 'a', text: 'You must be reasonably sure harm has occurred' },
          { id: 'c', text: 'You should raise it with them first and report only if unsatisfied' },
          { id: 'd', text: 'You should report only if another colleague agrees with you' },
          { id: 'b', text: 'Behaviour that indicates they may pose a risk of harm is enough', correct: true }
        ],
        explain: 'The threshold is behaviour that may indicate risk, not proof of harm. If a concern turns out to be unfounded, whistleblowers are protected.'
      },
      {
        id: 's9',
        prompt: 'What is the single most useful thing to pay attention to when judging whether a student’s behaviour is a concern?',
        options: [
          { id: 'b', text: 'Change from their own usual baseline', correct: true },
          { id: 'a', text: 'How they compare to other students of the same age' },
          { id: 'c', text: 'Whether their academic results have dropped' },
          { id: 'd', text: 'Whether they say anything explicit' }
        ],
        explain: 'A quiet child who has always been quiet is not a concern. A change from how that particular child normally is, is.'
      },
      {
        id: 's10',
        prompt: 'After you submit a Safeguarding Report, what is your responsibility?',
        options: [
          { id: 'a', text: 'Follow up with the family to see how things are going' },
          { id: 'c', text: 'Your job is done once you report. Refer is the safeguarding team’s step', correct: true },
          { id: 'b', text: 'Investigate further so the safeguarding team has more to work with' },
          { id: 'd', text: 'Decide whether the concern was serious enough to escalate' }
        ],
        explain: 'Recognise, Record, Report is yours. Refer is theirs. If you see signs of risk again or worsening, file another report.'
      }
    ]
  },

  takeaways: [
    'Recognise, Record, Report. Refer is the safeguarding team’s step, not yours',
    'Record immediately, factually, in the child’s exact words, with date and time',
    'Change from a child’s own baseline is the signal to watch for',
    'Sudden calm after depression is a red flag, not a recovery',
    'Immediate risk means emergency services first, paperwork afterwards',
    'You cannot promise a child secrecy, so do not offer it',
    'A gut feeling is reason enough to report',
    'Concerns about a colleague carry the same obligation, and you are protected',
    'When in doubt, report'
  ],

  closing: {
    title: 'Building a culture of safeguarding',
    body: [
      'Child safety is everyone’s responsibility. A strong safeguarding culture is built on trust, transparency, and the understanding that reporting is always the right thing to do.',
      'When in doubt, report. It is always better to report a concern that turns out to be nothing than to miss a concern that turns into harm.',
      'Your school’s safeguarding policy is the authority on all of this. This course is the short version, written so you can act on it; the policy is the long version, written so it is complete. Where they differ, the policy wins, and tell your DSL so the course gets corrected.',
      'Together, we keep children safe.'
    ],
    // No single address: a concern goes to a DSL at the reader's own school, and
    // those are listed per school in the reporting module. A shared inbox here
    // would quietly become the route everybody used, which is the outcome the
    // per-school structure exists to avoid.
    contact: ''
  },

  /* POLICY LINKS, one per school, shown after the final check.
     At the END, deliberately. A wall of policy links at the start is a reason
     to close the tab before the training has said anything; at the end it is
     where somebody who now has a question goes next.
     TODO(maintainer): fill policyUrl in SCHOOLS above. Needs somewhere durable --
     a Shared Drive link that will still resolve in two years, not a copy
     somebody moved. */
  policyLinks: SCHOOLS.map(function (sc) {
    return { school: sc.name, name: sc.policyName, url: sc.policyUrl };
  }),

  links: {}
};
