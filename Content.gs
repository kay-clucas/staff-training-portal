/**
 * Example Academies: Cybersecurity Awareness Training
 * SINGLE SOURCE OF TRUTH for all training content.
 *
 * Everything downstream is generated from this file:
 *   - the interactive web app (Apps Script HTML Service)
 *   - the presentable Google Slides deck
 *   - the answer key used for scoring
 *
 * Never edit content in the web app, the deck or the Sheet. Edit it here,
 * bump CONTENT_VERSION, and re-run the build. That is what stops the three
 * copies drifting apart, which is how the Canva version went wrong.
 *
 * CONTENT_VERSION is written onto every training record so you can prove
 * which version of the training a given member of staff actually completed.
 */

var CONTENT_VERSION = '2.2';

// 2.2 adds the fake sign-in module after the October calendar-invite incident.
// Bumping is safe: on this platform a pass expires on a DATE, not a version
// (see RECERTIFY in Config.gs), so nobody is forced to retake anything by this.
// The number's job is to record which wording a given result was earned
// against, which is why a real content change should move it and a typo fix
// should not. Anyone who passed on 2.1 stays compliant until their date.
var CONTENT_UPDATED = '2026-10-07';

var TRAINING = {
  // Required by the course registry in Courses.gs. Must match the id listed in
  // CATALOGUE in Config.gs, or the course loads and is then never offered.
  id: 'cyber',
  version: CONTENT_VERSION,
  updated: CONTENT_UPDATED,
  title: 'Cybersecurity Awareness Training',
  // Shown on the picker, which did not exist when this course was written.
  pickerSummary: 'Recognise phishing and scams, protect your account, and know where school information belongs.',
  subtitle: 'Protecting Example Academies, our students, our colleagues and our families',
  passMark: 0.8,
  estimatedMinutes: 25,

  intro: {
    lead: 'We are an entirely online school. Almost everything we do for our students happens through a screen, which means our security habits are not a back-office concern. They are part of how we keep students safe.',
    body: [
      'Most cyber incidents do not happen because technology fails. They happen because someone is tricked into clicking a link, sharing information, or signing in to a page that looks real.',
      'You do not need to be technical to stop that. You need to recognise the pattern and know what to do next. That is all this training is for.'
    ],
    outcomes: [
      'Recognise how attackers actually target a school like ours',
      'Spot phishing, impersonation and scam messages before you act on them',
      'Protect your account with strong sign-in habits, including MFA and passkeys',
      'Know where student and company information is allowed to live',
      'Know exactly what to do when something does not look right'
    ],
    privacyNotice: 'Your answers and completion are recorded against your Example Academies account so we can evidence that training has been completed. Getting an answer wrong is not held against you. The results are used to decide what we need to explain better. You can retake this at any time.'
  },

  modules: [

    /* ------------------------------------------------------------------ */
    {
      id: 'why',
      number: 1,
      title: 'Why this matters here',
      summary: 'We are a global online school. That makes us a target, and it makes our students part of what we are protecting.',
      art: 'globe',
      blocks: [
        { type: 'lead', text: 'Cybersecurity protects our systems, our information and our reputation. At an online school it also protects our students directly.' },
        { type: 'para', text: 'Example Academies teaches students and works with families in dozens of countries. We hold enrolment records, academic results, safeguarding notes, passport and visa details, payment information and family contact details. That combination is valuable to attackers and sensitive for the people it belongs to.' },
        { type: 'para', text: 'Because we are fully online, we also do not have the accidental safety net of a physical campus. Nobody notices that the person asking for a file is not really a colleague, because nobody sees them in a corridor. Every interaction is a message, a call or a link, and every one of those can be faked.' },
        {
          type: 'stats',
          items: [
            { figure: 'Every', label: 'staff member holds or can reach student data' },
            { figure: '1 click', label: 'is all it takes to hand over an account' },
            { figure: 'Minutes', label: 'is how fast a reported incident can be contained' }
          ]
        },
        {
          type: 'callout', tone: 'info', title: 'What we are actually protecting',
          text: 'Not just "company data". Student names, ages, addresses, learning needs, safeguarding information and family financial details. If that leaks, the harm lands on children and their families first.'
        },
        { type: 'para', text: 'The good news: the same handful of habits stops the overwhelming majority of attacks. None of them require technical knowledge.' }
      ],
      check: {
        id: 'q-why-1',
        type: 'mcq',
        prompt: 'Why is an online school like Example Academies an attractive target?',
        options: [
          { id: 'b', text: 'We hold sensitive information about students and families around the world, and all our contact happens remotely', correct: true, feedback: 'Exactly. Sensitive data plus entirely remote contact means impersonation is easy and the payoff is high.' },
          { id: 'a', text: 'We use expensive software that attackers want to steal', feedback: 'Not really. Software licences are not the prize. What attackers want is the information we hold.' },
          { id: 'c', text: 'We are not a target: schools are too small to be worth attacking', feedback: 'A common and dangerous assumption. Education is one of the most heavily targeted sectors precisely because of the data held and the trust involved.' },
          { id: 'd', text: 'Only our IT team is a target', feedback: 'Attackers usually avoid IT staff. They go for people who are busy, helpful and hold access, which is everyone else.' }
        ],
        explain: 'Attackers pick targets on data value and ease of access. A global online school scores high on both.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'attacks',
      number: 2,
      title: 'How attacks actually happen',
      summary: 'Almost always by impersonating someone you trust and pushing you to act quickly.',
      art: 'impersonation',
      blocks: [
        { type: 'lead', text: 'Most attacks do not start with someone breaking into a system. They start with someone asking you, politely, to help.' },
        { type: 'para', text: 'The attacker’s job is to be believable for about thirty seconds, long enough for you to click, reply or send. They do that by borrowing an identity you already trust.' },
        {
          type: 'list', title: 'Messages are commonly made to look like they come from:',
          items: [
            'A colleague asking you to review or approve a document',
            'A manager or senior leader making an urgent request',
            'A service you use, Google, Zoom, Canvas, Slack, asking you to sign in again',
            'A parent or student with an unusual request about an account or a payment',
            'The IT team asking you to "verify" your account'
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'Impersonation of our leadership is not hypothetical',
          text: 'In this example, scammers use Alex Morgan’s name and photograph to approach people. Alex never contacts staff through WhatsApp or a personal number asking for help, information, gift cards or anything done urgently, a genuine message from her comes from alex.morgan@academies.example.org or her Example Slack account. If you receive a message like that: do not reply, report it, block the sender.'
        },
        {
          type: 'flow',
          steps: [
            { kicker: 'The request', title: 'Something arrives', body: 'A call, a video meeting, a WhatsApp message, an email. It looks and sounds like someone you know.', tone: '' },
            { kicker: 'The trap', title: 'Reply on the same channel', body: 'Sending back down the channel it arrived on, or to a number or link it gave you. This is the step attackers rely on.', tone: 'stop' },
            { kicker: 'The habit', title: 'Reply on a channel you own', body: 'Their known Example Academies email address, or their Example Slack account. Look it up yourself.', tone: 'go' }
          ],
          caption: 'You do not have to work out whether the message is real. You only have to change where your reply goes.'
        },
        { type: 'para', text: 'The same rule holds for every senior leader and for the IT team. A genuine request from us will come through a Example Academies official channel and will survive being checked. An attacker’s request will not.' },
        {
          type: 'heading', text: 'The 2026 version: AI voice and video'
        },
        { type: 'para', text: 'Impersonation used to mean a lookalike email address. It now includes cloned voices and live video. A short clip of someone speaking, a recorded webinar, a marketing video, a Zoom class, is enough raw material to convincingly fake them on a call.' },
        {
          type: 'callout', tone: 'warn', title: 'For an online school this matters more than most',
          text: 'We are all used to seeing colleagues only as a face in a Zoom window. That is exactly the context a deepfake exploits. Seeing or hearing someone is no longer proof of who they are.'
        },
        {
          type: 'list', title: 'If a call or video feels off, or the request is unusual:',
          items: [
            'Do not action anything during that call: payments, credentials, access, student information',
            'End the call and contact the person through a channel you already know works: their Example email, or Slack DM',
            'Never call a number the caller gives you, look it up yourself',
            'Report it, even if you turn out to be wrong'
          ]
        },
        {
          type: 'callout', tone: 'good', title: 'The one habit that beats all of this',
          text: 'Attackers rely on you reacting quickly. Verifying through a second, known channel defeats almost every impersonation attack, email, WhatsApp, phone call or video.'
        }
      ],
      check: {
        id: 'q-attacks-1',
        type: 'mcq',
        prompt: 'You are on a video call with someone who appears and sounds like a senior leader. They ask you to send over a list of student contact details straight away. Requests like this are a normal part of the job here, so what is the safe way to handle it?',
        options: [
          { id: 'a', text: 'Paste the details into the chat on the call, or email them to the address the caller gives you', feedback: 'This is the one that gets exploited. The call and the address it hands you are both under the attacker\u2019s control, so nothing about them proves who you are sending to.' },
          { id: 'b', text: 'Send it after the call through an official Example Academies channel, their known Example email address or their Slack account, rather than anything given to you on the call', correct: true, feedback: 'Correct. You still do the work, and quickly. You just deliver it down a channel that only the real person can receive on.' },
          { id: 'c', text: 'Refuse, end the call and report it as an attack', feedback: 'Too blunt for a request that is usually legitimate. You do not need to refuse. You need to change how you deliver it. Report it only if something else about the request is off.' },
          { id: 'd', text: 'Ask them a personal question to check it is really them', feedback: 'An attacker who has researched the person may well pass, and it keeps you inside a conversation they are controlling.' }
        ],
        explain: 'The control is the channel, not the refusal. Send data to a Example Academies address you already have for that person, never to a number, address or link supplied during the call itself. That habit costs nothing when the request is genuine and defeats it entirely when it is not.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'redflags',
      number: 3,
      title: 'Spot the red flags',
      summary: 'Seven warning signs, and practice finding them in a real-looking message.',
      art: 'flags',
      blocks: [
        { type: 'lead', text: 'Scams are increasingly convincing. They rely on a believable story and enough pressure that you act before you check.' },
        {
          type: 'flags',
          title: 'Seven warning signs',
          items: [
            { title: 'Too good to be true', text: 'Offers to make or save money quickly, unexpected refunds, prizes, or bargains.' },
            { title: 'Pressure to act quickly', text: 'Urgent requests, deadlines, or a "senior leader" who needs it right now and cannot be reached to confirm.' },
            { title: 'Emotional stories or requests for help', text: 'Sympathy used to get money or information. Often framed as a colleague or family in difficulty.' },
            { title: 'Unusual payment requests', text: 'Gift cards, cryptocurrency, vouchers, or any payment method that cannot be reversed.' },
            { title: 'Requests to create new payment accounts', text: 'Being asked to set up new bank accounts, PayIDs or payment methods to move money.' },
            { title: 'Unexpected links or attachments', text: 'Messages pushing you to click a link or open a file you were not expecting, including QR codes in emails, PDFs or posters.' },
            { title: 'Wrong sender, right name', text: 'Professional-looking messages from personal, unknown, misspelled, or unusually long email addresses.' }
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'QR codes deserve their own mention',
          text: 'A QR code in an email or attachment hides the destination completely and moves you onto your phone, where the address bar is short and your work protections may not apply. Treat an unexpected QR code exactly like an unexpected link: do not scan it.'
        },
        {
          type: 'para', text: 'Below is a message of the kind that reaches Example inboxes. Before you scroll on, see how many warning signs you can find in it.'
        }
      ],
      check: {
        id: 'q-redflags-hotspot',
        type: 'hotspot',
        prompt: 'Click every part of this message that should make you suspicious. There are five.',
        email: {
          fromName: 'Alex Morgan',
          fromAddress: 'alex.morgan@accounts-alert.example.net',
          to: 'you@academies.example.org',
          subject: 'Quick favour — need this before my next call',
          received: 'Today, 4:52 PM',
          body: [
            { text: 'Hi,' },
            { text: 'Are you at your desk? I am going into back-to-back meetings and cannot take calls, but I need something handled discreetly in the next 30 minutes.', hotspot: 'urgency', why: 'Pressure to act quickly, plus a reason you cannot verify by calling. That combination is the single most common feature of a fraud attempt.' },
            { text: 'We need to settle a supplier invoice today. Please purchase 4 x $500 gift cards and send me the codes: I will get you reimbursed on Friday.', hotspot: 'payment', why: 'Gift cards are an irreversible, untraceable payment method. No legitimate Example process ever involves buying gift cards.' },
            { text: 'Full details are in the document here: review-invoice-example.zip', hotspot: 'attachment', why: 'An unexpected attachment, and a .zip at that, a common way to deliver malware past basic filtering.' },
            { text: 'Please keep this between us until it is done.', hotspot: 'secrecy', why: 'Requests for secrecy exist to stop you checking with anyone else. A genuine request never needs you to keep quiet.' },
            { text: 'Sent from my iPhone' }
          ],
          senderHotspot: { hotspot: 'sender', why: 'The display name says Alex Morgan, but the actual address is a personal, unrelated domain designed to look official. Alex\u2019s real address is alex.morgan@academies.example.org. Always read the address, not the name.' }
        },
        explain: 'Five red flags: the sender address, the urgency and unreachability, the gift card request, the unexpected .zip attachment, and the request for secrecy. Any one of these alone is enough to stop and check.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'pause',
      number: 4,
      title: 'Pause and check',
      summary: 'Four questions that take ten seconds and stop most attacks.',
      art: 'pause',
      blocks: [
        { type: 'lead', text: 'Before you click a link, open a document, or act on an unusual request, ask yourself four questions.' },
        {
          type: 'numbered',
          items: [
            'Was I expecting this message?',
            'Does the sender’s actual email address look right, not just the display name?',
            'Is there pressure to act quickly, or to keep it quiet?',
            'Does the link, attachment or request look unusual for this person?'
          ]
        },
        { type: 'para', text: 'If any answer gives you pause, verify through a different channel before you act. Message the person on Slack. Email the address you already have for them. Ring the number in the directory, not the one in the message.' },
        {
          type: 'callout', tone: 'good', title: 'You will never be criticised for checking',
          text: 'Not by IT, not by your manager, not by leadership. Checking a genuine request costs someone thirty seconds. Not checking a fake one can cost a student their privacy.'
        }
      ],
      check: {
        id: 'q-pause-1',
        type: 'mcq',
        prompt: 'You receive an email that appears to be from a senior leader, asking you to review a document. The tone is right but the email address is unfamiliar. What is the best action?',
        options: [
          { id: 'a', text: 'Click the link to see what the document is', feedback: 'Opening it is the outcome the attacker wants. A phishing link can capture your sign-in the moment you land on it.' },
          { id: 'b', text: 'Reply asking for more information', feedback: 'Replying confirms your address is live and monitored, and puts you into a conversation the attacker controls.' },
          { id: 'c', text: 'Report it as phishing and let IT know', correct: true, feedback: 'Correct. Report it in Gmail and email itsupport@academies.example.org. If it turns out to be genuine, no harm done.' },
          { id: 'd', text: 'Forward it to colleagues to ask whether it is real', feedback: 'This spreads the risk. Now several people have a live phishing link in their inbox. Verify with the sender directly or report it instead.' }
        ],
        explain: 'Report, do not engage. Reporting is free and reversible; clicking is neither.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'accounts',
      number: 5,
      title: 'Passwords, MFA and passkeys',
      summary: 'Your account is the front door. Multi-factor authentication is the lock that actually holds.',
      art: 'key',
      blocks: [
        { type: 'lead', text: 'A password on its own is no longer enough. If an attacker has your password, multi-factor authentication is what stops them getting in.' },
        { type: 'heading', text: 'Multi-factor authentication (MFA)' },
        { type: 'para', text: 'MFA means proving who you are with something in addition to your password: a prompt on your phone, a code, or a passkey. It is the single most effective protection on your account, and it is required on all Example Academies accounts.' },
        {
          type: 'callout', tone: 'warn', title: 'Never approve a prompt you did not trigger',
          text: 'If your phone shows a sign-in prompt and you were not signing in, someone else has your password. Deny it, change your password, and email itsupport@academies.example.org straight away. Attackers deliberately send repeated prompts late at night hoping you will tap "Yes" to make it stop. That is called MFA fatigue and it works far too often.'
        },
        {
          type: 'mfaMock',
          time: '02:14', day: 'Tue', app: 'Google',
          title: 'Is this you trying to sign in?',
          body: 'Someone is signing in to your Example Academies account from a device in another country.',
          yes: 'Yes, it’s me',
          no: 'No, it’s not me',
          notes: [
            'You were asleep. You did not trigger this. That means somebody already has your password.',
            'Tap No. Then change your password and email itsupport@academies.example.org, do not just dismiss it.'
          ],
          caption: 'Attackers send these repeatedly, often in the middle of the night, hoping you will tap Yes to make it stop. It is called MFA fatigue and it works far more often than it should.'
        },
        { type: 'heading', text: 'Passkeys: the better option' },
        { type: 'para', text: 'A passkey replaces your password with your device’s own unlock: fingerprint, face, or device PIN. It cannot be phished, because there is no code or password to hand over, and it will not work on a fake sign-in page. If you are offered a passkey for your Example account, set one up.' },
        { type: 'heading', text: 'Password habits' },
        {
          type: 'goodbad',
          good: {
            title: 'Do',
            items: [
              'Use long passphrases: four random words, such as redcoffeeriverlaptop. Length beats complexity.',
              'Use a different password for every service',
              'Let Google Password Manager, or another approved password manager, generate and remember them',
              'Change a password immediately if you think it may have been exposed'
            ]
          },
          bad: {
            title: 'Don’t',
            items: [
              'Reuse a password across work and personal accounts',
              'Build passwords around Example, an academy name, or the current year',
              'Add a number on the end of an old password and call it new',
              'Write passwords in a document, a note, or a spreadsheet'
            ]
          }
        },
        {
          type: 'callout', tone: 'info', title: 'We no longer ask you to change passwords on a schedule',
          text: 'Forced regular changes are no longer recommended practice. They push people towards small predictable edits like Example2026!, which are easier to guess, not harder. A long unique passphrase plus MFA is stronger. Change it when there is a reason to, not on a calendar.'
        },
        { type: 'heading', text: 'Shared and system passwords' },
        {
          type: 'list',
          items: [
            'Never share generic or system passwords. This is strictly against our Acceptable Use Policy.',
            'Passwords must never be sent by email, Slack, Google Chat or any messaging app.',
            'If someone needs access to a system, log a support request so access is granted properly to their own account.',
            'Sharing a password means anything done with it is recorded as done by you.'
          ]
        }
      ],
      check: {
        id: 'q-accounts-1',
        type: 'mcq',
        prompt: 'A colleague asks you for the login to a shared system so they can finish some work before a deadline. What do you do?',
        options: [
          { id: 'a', text: 'Send it to them in a Slack DM, it is private', feedback: 'Slack messages persist, can be exported, and are visible to anyone who gains access to either account. It is also against the Acceptable Use Policy.' },
          { id: 'b', text: 'Send it by email so there is a record', feedback: 'A record of a shared password is worse, not better. Email is one of the first places an attacker looks after compromising an account.' },
          { id: 'd', text: 'Put it in a shared document only the two of you can see', feedback: 'Sharing settings change, documents get re-shared, and the password now exists in writing indefinitely.' },
          { id: 'c', text: 'Log a support request so they are given their own access', correct: true, feedback: 'Correct. It takes a few minutes, it is auditable, and their actions are recorded as theirs rather than yours.' }
        ],
        explain: 'Access is granted to people, not passed between them. If a deadline makes that feel impossible, say so in the support request and it can be prioritised.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'signin',
      number: 6,
      title: 'The sign-in page that isn\u2019t',
      summary: 'An incident scenario, and why MFA did not stop it.',
      art: 'lock',
      blocks: [
        { type: 'lead', text: 'This module follows a realistic incident scenario, rather than an abstract warning.' },
        { type: 'heading', text: 'What happened' },
        { type: 'para', text: 'An attacker added a calendar event to thousands of our users\u2019 calendars. Nobody clicked a link in an email, and nobody was tricked into accepting anything: the invite simply appeared in their calendar, because that is what calendar software is built to let people do.' },
        { type: 'para', text: 'The event contained a link. The link opened a page that looked like a Google sign-in screen. People signed in.' },
        {
          type: 'callout', tone: 'warn', title: 'Then multi-factor authentication did not save us',
          text: 'With a real password, the attacker started a real sign-in. Google sent a genuine prompt to the real person\u2019s real phone, and people approved it. Every control worked exactly as designed. The approval was the breach.'
        },
        { type: 'para', text: 'That is worth sitting with. MFA is not a wall. It is a question, asked at the moment somebody is trying to get in, and it only protects you if the answer is no when it should be no.' },
        {
          type: 'callout', tone: 'info', title: 'The rule this gives us',
          text: 'A prompt you did not trigger is an alarm, not an inconvenience. If a code or an approval request arrives when you were not signing in, somebody else has your password. Deny it, change your password, and report it. Do not approve it to make it stop.'
        },
        { type: 'heading', text: 'Why the page was convincing' },
        { type: 'para', text: 'A sign-in page is one of the easiest things in the world to copy, because all of it is public. The logo, the fonts, the spacing, the wording: anyone can save the real page and change one thing. The one thing they cannot copy is the address.' },
        {
          type: 'list',
          items: [
            'The address bar is the only part of a page an attacker does not control',
            'Read it from the right: the real site is the last part before the first single slash',
            'Anything can be put to the left of that, including the words you were looking for'
          ]
        },
        {
          type: 'callout', tone: 'good', title: 'The habit that beats this entirely',
          text: 'Do not sign in from a link. If a page asks for your Example password, close it, open a new tab, and go to the service yourself. A real session will still be there. A fake one will not follow you.'
        }
      ],
      check: {
        id: 'q-signin-spot',
        type: 'signinSpot',
        prompt: 'This page is a fake. Find what gives it away, then answer the question that follows.',
        instruction: 'Click anything that looks wrong. You need the one that always proves it.',
        required: 'url',
        page: {
          urlText: 'accounts.google.com.secure-login-verify.net/signin?svc=mail',
          securityLabel: 'Not secure',
          wordmark: 'GoogIe',
          heading: 'Sign in',
          sub: 'to continue to your acount',
          banner: 'Your session expired. Verify within 10 minutes or your mailbox will be suspended.',
          emailValue: 'you@academies.example.org',
          passwordPlaceholder: 'Enter your password',
          spots: [
            { key: 'url', required: true, label: 'The address',
              why: 'This is the one that settles it. Read from the right: the real site is secure-login-verify.net, not Google. Everything to the left of it is just words the attacker chose, including "accounts.google.com". An address can contain any brand name you like.' },
            { key: 'notsecure', label: 'Not secure',
              why: 'No certificate, where Google would always have one. Worth noticing, but do not rely on it: plenty of fake sign-in pages do have a padlock. A padlock means the connection is private, not that the site is honest.' },
            { key: 'wordmark', label: 'The logo',
              why: 'A capital I in place of the lowercase L, and the colours are not the real ones. Attackers copy logos from memory or rebuild them badly, and a wordmark is the sort of thing the eye accepts without reading.' },
            { key: 'spelling', label: 'The spelling',
              why: '"acount" is missing a letter. A real Google page has been read by thousands of people. A typo on a sign-in screen is a strong signal that it was assembled in a hurry.' },
            { key: 'urgency', label: 'The warning banner',
              why: 'A deadline and a threat, to stop you looking too closely. Google does not suspend your mailbox in ten minutes. Urgency on a sign-in page is a tactic, not information.' }
          ]
        },
        followUp: {
          prompt: 'You realise, a minute after typing it, that you have just entered your Example password into a page like this. What do you do first?',
          options: [
            { id: 'a', text: 'Wait to see whether anything actually happens before worrying anyone' },
            { id: 'b', text: 'Change your password immediately, from a tab you opened yourself, then report it', correct: true },
            { id: 'c', text: 'Close the tab and clear your browser history so nothing is stored' },
            { id: 'd', text: 'Report it and wait for IT to tell you what to do about the password' }
          ],
          explain: 'Change it first, because the password is already gone and every second it stays valid is a second somebody can use it. Then report, so we can look for sign-ins we did not expect. Closing the tab changes nothing: the password left your machine the moment you pressed enter. And if an approval prompt arrives while you are doing this, deny it.'
        },
        explain: 'The address is the only part of a page an attacker cannot fake. Everything else on this screen, the logo, the wording, the layout, can be copied perfectly, and on a better forgery it would have been.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'data',
      number: 7,
      title: 'Where information belongs',
      summary: 'Approved systems only: and that now includes being careful what you paste into AI tools.',
      art: 'vault',
      blocks: [
        { type: 'lead', text: 'Company and student information should always live in the systems designed for work. Those systems have protections that personal accounts and personal devices do not.' },
        {
          type: 'goodbad',
          good: {
            title: 'Store work information in',
            items: [
              'Google Drive: in a Shared Drive where possible, not just My Drive',
              'The application the data normally lives in: the SIS, the LMS, the HR or finance system',
              'Other Example-provided work applications'
            ]
          },
          bad: {
            title: 'Never store it in',
            items: [
              'Files saved only on your own computer',
              'USB drives or external storage',
              'Personal email, personal Google Drive, iCloud, Dropbox or WhatsApp',
              'A personal notes app or personal phone gallery'
            ]
          }
        },
        {
          type: 'callout', tone: 'info', title: 'Why Shared Drives, not My Drive',
          text: 'Files in your My Drive belong to your account. When someone leaves, that work can be lost or need recovering. Files in a Shared Drive belong to the team and stay with it.'
        },
        {
          type: 'boundary',
          inside: {
            title: 'Inside our systems',
            items: ['Google Drive and Shared Drives', 'The SIS, the LMS, HR and finance systems', 'Example-provided applications', 'Approved AI tools IT has confirmed'],
            note: 'Backed up. Access can be granted, reviewed and taken away. Recoverable when someone leaves.'
          },
          outside: {
            title: 'Outside our systems',
            items: ['Your laptop’s own hard drive', 'USB sticks and external drives', 'Personal email, iCloud, Dropbox, WhatsApp', 'Public AI tools and chatbots'],
            note: 'Once information is here we cannot protect it, find it, or take it back. Nor can we prove it was ever deleted.'
          },
          caption: 'The line is not about how careful you are. It is about whether the organisation can still control the information after you have put it somewhere.'
        },
        { type: 'heading', text: 'AI tools and student information' },
        { type: 'para', text: 'AI assistants are genuinely useful for planning lessons, drafting communications and summarising documents, and we are not asking you to avoid them. But what you paste into a tool leaves our systems.' },
        {
          type: 'goodbad',
          good: {
            title: 'Safe to use AI for',
            items: [
              'Drafting or rewriting general material with no personal details in it',
              'Explaining a concept, or generating example questions',
              'Summarising a document you have anonymised first',
              'Approved Example tools, used with Example data, where IT has confirmed the arrangement'
            ]
          },
          bad: {
            title: 'Never paste into a public AI tool',
            items: [
              'Student names, ages, addresses, photographs or contact details',
              'Grades, reports, references or assessment records tied to a named student',
              'Safeguarding, wellbeing, medical or learning-needs information',
              'Passport, visa, immigration or payment details',
              'Staff personal data, or anything from an HR file'
            ]
          }
        },
        {
          type: 'callout', tone: 'warn', title: 'The simple test',
          text: 'If you would not be comfortable emailing it to a stranger, do not paste it into a tool that is not on our approved list. If you are unsure whether a tool is approved, ask IT before you use it, not after.'
        }
      ],
      check: {
        id: 'q-data-1',
        type: 'mcq',
        prompt: 'You want to use an AI assistant to help write end-of-term report comments. What is the safe way to do it?',
        options: [
          { id: 'b', text: 'Ask it for help with phrasing and structure using no real names or identifying details, then write the actual comments yourself in the school system', correct: true, feedback: 'Correct. You get the drafting help without any student data leaving our environment.' },
          { id: 'a', text: 'Paste the full class list with each student’s grades and notes, and ask it to write the comments', feedback: 'This sends identifiable student records outside our systems. It is exactly the case the rules exist for.' },
          { id: 'c', text: 'Paste the data but remove surnames first', feedback: 'First names plus grades, year group and comments are still identifiable, particularly in small classes. Partial anonymisation is not anonymisation.' },
          { id: 'd', text: 'Use it however you like as long as you delete the chat afterwards', feedback: 'Deleting your side of a conversation does not undo the data having left our systems.' }
        ],
        explain: 'Use AI for the craft of writing, not as a place to put student records. Structure and phrasing help is fine; identifiable data is not.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sharing',
      number: 8,
      title: 'Sharing documents safely',
      summary: 'Two settings decide who can see a file. Most accidental leaks come from the second one.',
      art: 'share',
      blocks: [
        { type: 'lead', text: 'When you share a Google document there are two separate parts to the sharing settings, and they do different things.' },
        {
          type: 'heading', text: '1. Share with specific people'
        },
        { type: 'para', text: 'This is where you add the people who should have access. For each person you choose what they can do:' },
        {
          type: 'list',
          items: [
            'Viewer: can read the document',
            'Commenter: can read and comment',
            'Editor: can change it, and can often re-share it to others'
          ]
        },
        { type: 'heading', text: '2. General access: everyone else' },
        { type: 'para', text: 'This setting decides whether people who were never added individually can still open the file. It is the one that causes accidental exposure.' },
        {
          type: 'accessLevels',
          items: [
            { level: 'Restricted', tone: 'good', text: 'Only the people you added. This should be your default for anything containing student or staff information.' },
            { level: 'Example Academies', tone: 'warn', text: 'Anyone in the organisation with an active login. Fine for general internal material, not for sensitive records.' },
            { level: 'Example Education', tone: 'warn', text: 'A much wider group than our school. Check whether you really mean this.' },
            { level: 'Anyone with the link', tone: 'bad', text: 'The entire internet, including our competitors, anyone the link is forwarded to, and search engines in some cases. Almost never appropriate for work documents.' }
          ]
        },
        {
          type: 'shareMock',
          fileName: 'Student wellbeing notes - Term 3',
          peopleLabel: 'People with access',
          people: [
            { name: 'Sam Parker', email: 'sam@academies.example.org', role: 'Viewer', tone: 'good' },
            { name: 'Jamie Blake', email: 'jamie@academies.example.org', role: 'Editor', tone: '' }
          ],
          peopleNote: 'Editors can usually re-share the file to other people. Give Viewer unless someone genuinely needs to change the content.',
          accessLabel: 'General access',
          accessValue: 'Restricted',
          accessSub: 'Only people with access can open with the link',
          accessNote: 'This is the setting that causes accidental exposure. For anything containing student or staff information it should say Restricted.',
          caption: 'Two settings, two different jobs. Part 1 decides who you invited. Part 2 decides who else can walk in.'
        },
        {
          type: 'callout', tone: 'warn', title: 'Links get forwarded',
          text: '"Anyone with the link" is not a private setting. Once that link is in an email, a Slack message or a calendar invite, it can travel anywhere and it will keep working.'
        },
        {
          type: 'callout', tone: 'good', title: 'Two habits worth having',
          text: 'Give Viewer access unless someone genuinely needs to edit. And when a piece of work finishes, review who still has access to it.'
        }
      ],
      check: {
        id: 'q-sharing-sim',
        type: 'sharingSim',
        prompt: 'You need to share a spreadsheet of student wellbeing notes with two named colleagues in your team. Set the sharing correctly.',
        fileName: 'Student wellbeing notes - Term 3.xlsx',
        fields: [
          {
            id: 'people',
            label: 'Share with specific people',
            options: [
              { id: 'named-editor', text: 'Add the two colleagues as Editors', feedback: 'Close, but Editors can usually re-share the file. Use Viewer unless they need to change the content.' },
              { id: 'team-editor', text: 'Add the whole team mailing list as Editors', feedback: 'This is wider than needed. Wellbeing notes go only to the people who need them.' },
              { id: 'named-viewer', text: 'Add the two colleagues as Viewers', correct: true, feedback: 'Correct, the two people who need it, with the least access that does the job.' }
        ]
          },
          {
            id: 'general',
            label: 'General access',
            options: [
              { id: 'restricted', text: 'Restricted: only people added', correct: true, feedback: 'Correct. Nobody outside the two named colleagues can open it, even with the link.' },
              { id: 'org', text: 'Example Academies: anyone with the link in the organisation', feedback: 'That exposes wellbeing information to everyone with a login. Far too wide for this content.' },
              { id: 'anyone', text: 'Anyone with the link', feedback: 'This would publish student wellbeing information to anyone the link reaches. This is the setting that causes real incidents.' }
        ]
          }
        ],
        explain: 'Named people, least privilege, general access set to Restricted. For anything about students, that combination should be automatic.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'devices',
      number: 9,
      title: 'Devices, Zoom and working from home',
      summary: 'We teach from our homes. Our security habits have to work there too.',
      art: 'laptop',
      blocks: [
        { type: 'lead', text: 'The computer you work on is one of the main routes to company and student information. A few habits remove most of the risk.' },
        {
          type: 'list', title: 'On your work computer',
          items: [
            'Use a password, PIN or biometric to unlock it, so a lost or unattended device is not an open door',
            'Lock your screen whenever you step away, even briefly: Ctrl+Cmd+Q on a Mac, Windows+L on a PC',
            'Install system and security updates as soon as they are offered. Most updates exist to close a known hole.',
            'Keep antivirus and device protection enabled',
            'Do not install software from outside the approved sources, ask IT if you need something'
          ]
        },
        { type: 'heading', text: 'Working from home' },
        {
          type: 'list',
          items: [
            'Household members should not use your work device, and should not see student information on your screen',
            'Secure your home Wi-Fi with a strong password: and change the router’s default admin password if you never have',
            'Avoid public Wi-Fi for work. If you must, use your phone’s hotspot instead',
            'Be aware of what is visible and audible behind you during a call'
          ]
        },
        { type: 'heading', text: 'Zoom and screen sharing' },
        { type: 'para', text: 'We share our screens constantly, and it is one of the easiest ways to disclose information by accident.' },
        {
          type: 'list',
          items: [
            'Share a single window or tab, not your entire screen, whenever the option exists',
            'Close or minimise anything containing other students’ information before you share',
            'Watch for notification pop-ups: a Slack or email preview appearing mid-lesson can expose a name or a detail to a whole class',
            'Check the participant list before discussing anything sensitive, and use the waiting room for meetings that need it',
            'Never post a class or meeting link somewhere public'
          ]
        },
        {
          type: 'pickerMock',
          title: 'Choose what to share',
          tiles: [
            { kind: 'screen', label: 'Entire Screen', tone: 'avoid', tag: 'Avoid' },
            { kind: 'window', label: 'Window', tone: 'pick', tag: 'Use this' },
            { kind: 'tab', label: 'Browser Tab', tone: 'pick', tag: 'Use this' }
          ],
          caption: 'Sharing your entire screen shares your notifications, your other tabs and whatever you open next. Sharing one window or one tab shares only that.'
        },
        {
          type: 'callout', tone: 'warn', title: 'Recordings count too',
          text: 'A recorded lesson that captured a student’s details, or an open tab, is now a stored copy of that disclosure. If it happens, report it so it can be handled properly.'
        }
      ],
      check: {
        id: 'q-devices-1',
        type: 'mcq',
        prompt: 'You are about to share your screen in a lesson with 20 students. What is the safest approach?',
        options: [
          { id: 'a', text: 'Share your entire screen, it is easier to switch between things', feedback: 'Easier, but everything you open is visible, including notifications, other tabs and other students’ information.' },
          { id: 'c', text: 'Share your whole screen but move sensitive windows to a second desktop', feedback: 'Better than nothing, but one mistaken keystroke or an incoming notification undoes it.' },
          { id: 'd', text: 'It does not matter, students would not understand what they were seeing', feedback: 'Students very often would, and either way it is a disclosure of information that is not theirs to see.' },
          { id: 'b', text: 'Share only the specific window or tab you need, after closing anything with other students’ information in it', correct: true, feedback: 'Correct. Single-window sharing plus a quick tidy-up removes almost all of the accidental disclosure risk.' }
        ],
        explain: 'Share the narrowest thing that does the job, and clear the decks first.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'privacy',
      number: 10,
      title: 'Student data and our obligations',
      summary: 'The rules are not just internal policy. They are legal duties we owe to children and families.',
      art: 'balance',
      blocks: [
        { type: 'lead', text: 'Because we teach students internationally, information about them is protected by law in several countries at once.' },
        { type: 'para', text: 'You do not need to know the detail of each regime. You do need to know that student information carries legal obligations wherever the student lives, and that "I did not realise" is not a defence available to us.' },
        {
          type: 'list', title: 'Four principles that cover most situations',
          items: [
            'Only access student information you need for your role. Curiosity is not a reason.',
            'Only collect what you actually need, and only use it for the purpose it was given for.',
            'Only share it with people who need it to do their job, internally or externally.',
            'Keep it in approved systems so it can be found, protected and deleted properly when the time comes.'
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'Safeguarding information is the most sensitive we hold',
          text: 'Wellbeing, medical, learning-needs and safeguarding records go only to those with a specific need to know. If you are unsure whether someone qualifies, ask before you share, not afterwards.'
        },
        { type: 'para', text: 'If information about a student is exposed, sent to the wrong person, shared too widely, or left in an unapproved place, there may be a legal duty to notify regulators and the family, sometimes within tight deadlines. That clock starts when the incident happens, not when it is reported. Reporting quickly is what keeps us compliant.' },
        {
          type: 'callout', tone: 'good', title: 'A parent asks for their child’s data',
          text: 'Families have a right to ask what we hold about them. Do not attempt to answer that yourself and do not send records directly, forward the request to IT and your manager so it is handled correctly and on time.'
        }
      ],
      check: {
        id: 'q-privacy-1',
        type: 'mcq',
        prompt: 'You are working on a document containing sensitive student information. Where should it be stored?',
        options: [
          { id: 'c', text: 'In Google Drive or the Example application it belongs in, shared only with those who need it', correct: true, feedback: 'Correct. Approved system, protected, recoverable, and access limited to those who need it.' },
          { id: 'a', text: 'On your local computer, so nobody else can reach it', feedback: 'A local-only file is not backed up, not recoverable and not protected by our controls. It is also invisible if we ever need to find it.' },
          { id: 'b', text: 'In your personal Google account, so it is separate from work', feedback: 'This moves student data outside our environment entirely, which is where the legal problems begin.' },
          { id: 'd', text: 'On an encrypted USB drive kept in a safe place', feedback: 'Encryption helps, but the drive is still outside our systems, unmonitored, easily lost, and impossible to revoke access to.' }
        ],
        explain: 'Approved systems exist so that access can be controlled, recorded and withdrawn. Nothing you keep on the side has any of those properties.'
      }
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'report',
      number: 11,
      title: 'If something goes wrong',
      summary: 'Report early, report anything. You will not be in trouble for it.',
      art: 'report',
      blocks: [
        { type: 'lead', text: 'If you think something suspicious has happened, or you are simply unsure, report it. Reporting quickly is what lets us contain a problem before it spreads.' },
        {
          type: 'callout', tone: 'good', title: 'You will not get in trouble for reporting',
          text: 'This includes reporting your own mistake. Someone who clicked a link and told us within five minutes has done us an enormous favour. Someone who clicked it and said nothing for a week has not. We would far rather investigate ten false alarms than miss one real incident.'
        },
        { type: 'heading', text: 'What to do' },
        {
          type: 'steps',
          items: [
            { title: 'Report it straight away', text: 'Speed matters more than certainty. Do not wait until you are sure.' },
            { title: 'Report phishing in Gmail', text: 'Open the message, click the three dots next to Reply, and choose Report phishing. This helps protect everyone else at Example, not just you.' },
            { title: 'Email itsupport@academies.example.org', text: 'Include whatever detail you have: the message, the sender, what you clicked, and roughly when.' },
            { title: 'Tell your manager', text: 'So they know what is happening and can support you.' },
            { title: 'If you clicked or signed in: change your password immediately', text: 'Then check your account for anything you did not do: unfamiliar sign-ins, new forwarding rules, or sent messages you did not send.' }
          ]
        },
        {
          type: 'callout', tone: 'warn', title: 'Signs your account may already be compromised',
          text: 'Emails in your Sent folder you did not send. A mail forwarding rule or filter you did not create. MFA prompts you did not trigger. Colleagues mentioning messages from you that you never sent. Any of these, report immediately.'
        },
        {
          type: 'clock',
          marks: [
            { when: 'Within minutes', what: 'The account can be locked and the session cut before anything is taken. Usually no harm at all.' },
            { when: 'Within an hour', what: 'Mailbox rules and sent items can still be checked and reversed. Damage is limited.' },
            { when: 'Next day', what: 'Data may already have been copied. Other staff have probably been targeted from your account.' },
            { when: 'A week later', what: 'A notifiable breach, with families and regulators to inform, and deadlines that started on day one.' }
          ],
          caption: 'The clock starts when the incident happens, not when it is reported. This is the entire reason we would rather hear about ten false alarms than miss one real thing.'
        },
        { type: 'para', text: 'Many incidents are stopped early simply because someone spoke up. That is the single most valuable thing you can take away from this training.' }
      ],
      check: {
        id: 'q-report-1',
        type: 'mcq',
        prompt: 'You clicked a link in an email and entered your Example password before realising it was a fake sign-in page. What do you do first?',
        options: [
          { id: 'a', text: 'Wait and watch to see whether anything bad actually happens', feedback: 'Every minute you wait is a minute the attacker has your credentials. Waiting is the worst option available.' },
          { id: 'b', text: 'Change your password immediately, then report it to IT and tell your manager', correct: true, feedback: 'Correct. Change the password first to cut off access, then report it so we can check the account and warn others.' },
          { id: 'c', text: 'Delete the email so there is no trace of it', feedback: 'Deleting it destroys the evidence IT needs to investigate and to protect everyone else. Keep it and report it.' },
          { id: 'd', text: 'Tell nobody, you would rather not be blamed for it', feedback: 'You will not be blamed. Staying quiet is the only thing here that would genuinely cause harm.' }
        ],
        explain: 'Contain first, then report. Changing your password immediately is what stops the attacker using what they captured.'
      }
    }
  ],

  /* -------------------------------------------------------------------- */
  finalExam: {
    title: 'Final check',
    intro: 'Ten questions covering everything above. You need 80% to complete the training, and you can retake it as many times as you like.',
    questions: [
      {
        id: 'f1',
        prompt: 'A message arrives on WhatsApp from someone using Alex’s name and photo, asking you to urgently sort something out. What do you do?',
        options: [
          { id: 'a', text: 'Reply to find out what they need' },
          { id: 'c', text: 'Do what is asked, it is the CEO' },
          { id: 'b', text: 'Ignore it, report it to IT, and block the sender', correct: true },
          { id: 'd', text: 'Forward it to a colleague to ask whether it is genuine' }
        ],
        explain: 'Alex never contacts staff directly on WhatsApp with urgent requests. Ignore, report, block. A genuine request from Alex comes from alex.morgan@academies.example.org or her Example Slack account.'
      },
      {
        id: 'f11',
        prompt: 'A senior leader on a video call asks you to send them student data. This is a normal request in your role. What is the safe way to do it?',
        options: [
          { id: 'a', text: 'Put it in the call chat while you are both there' },
          { id: 'b', text: 'Email it to the address they read out on the call' },
          { id: 'd', text: 'Refuse and report the call as an attack' },
          { id: 'c', text: 'Send it through an official Example Academies channel, their known Example email or Slack account', correct: true }
        ],
        explain: 'You still do the work. You just deliver it to an address the real person owns, rather than to anything supplied during the call.'
      },
      {
        id: 'f2',
        prompt: 'Which of these is the strongest protection on your account if your password is stolen?',
        options: [
          { id: 'c', text: 'Multi-factor authentication or a passkey', correct: true },
          { id: 'a', text: 'Changing your password every 90 days' },
          { id: 'b', text: 'Adding numbers and symbols to the end' },
          { id: 'd', text: 'Using a different browser' }
        ],
        explain: 'MFA and passkeys stop an attacker even when they already have the correct password.'
      },
      {
        id: 'f3',
        prompt: 'Your phone shows an MFA approval prompt, repeatedly, and you are not signing in to anything. What does that mean?',
        options: [
          { id: 'a', text: 'A glitch: approve it to clear it' },
          { id: 'b', text: 'Someone has your password and is trying to get in. Deny it, change your password, report it', correct: true },
          { id: 'c', text: 'Your session has expired' },
          { id: 'd', text: 'Ignore it and it will stop' }
        ],
        explain: 'Repeated unexpected prompts mean your password is already known to someone else. Deny, change, report.'
      },
      {
        id: 'f4',
        prompt: 'Which sharing setting should you use for a document containing student information?',
        options: [
          { id: 'a', text: 'Anyone with the link' },
          { id: 'b', text: 'Example Education' },
          { id: 'c', text: 'Restricted, shared with named colleagues only', correct: true },
          { id: 'd', text: 'Example Academies' }
        ],
        explain: 'Restricted plus named people. Anything wider exposes student information beyond those who need it.'
      },
      {
        id: 'f5',
        prompt: 'You want AI help drafting a difficult email to a parent. What can you safely paste in?',
        options: [
          { id: 'a', text: 'The full email thread including the student’s name and details' },
          { id: 'c', text: 'Everything, then delete the chat afterwards' },
          { id: 'd', text: 'The student’s first name only, plus their grades' },
          { id: 'b', text: 'A description of the situation with no names or identifying details', correct: true }
        ],
        explain: 'Get help with phrasing and structure. Keep identifiable student information out of tools that are not approved.'
      },
      {
        id: 'f6',
        prompt: 'An email you were not expecting contains a QR code to "verify your account". What should you do?',
        options: [
          { id: 'c', text: 'Treat it as a suspicious link: do not scan it, and report it', correct: true },
          { id: 'a', text: 'Scan it with your phone: phones are safer than computers' },
          { id: 'b', text: 'Scan it but do not enter your password' },
          { id: 'd', text: 'Forward it to IT and scan it while you wait' }
        ],
        explain: 'A QR code hides its destination and moves you to a device with fewer protections. Treat it exactly like an unexpected link.'
      },
      {
        id: 'f7',
        prompt: 'Where should work files be stored?',
        options: [
          { id: 'a', text: 'On your own computer' },
          { id: 'c', text: 'Google Drive or the Example application the data belongs in', correct: true },
          { id: 'b', text: 'A USB drive' },
          { id: 'd', text: 'Your personal cloud storage' }
        ],
        explain: 'Approved systems only. They are protected, recoverable, and access can be withdrawn.'
      },
      {
        id: 'f8',
        prompt: 'A colleague asks you to send them a system password so they can meet a deadline. What is the right response?',
        options: [
          { id: 'a', text: 'Send it in Slack' },
          { id: 'c', text: 'Send it by email' },
          { id: 'b', text: 'Log a support request so they are given their own access', correct: true },
          { id: 'd', text: 'Put it in a shared document' }
        ],
        explain: 'Access is granted to people, never passed between them. Sharing it means their actions are recorded as yours.'
      },
      {
        id: 'f9',
        prompt: 'You are about to share your screen in a lesson. What should you do first?',
        options: [
          { id: 'a', text: 'Nothing: just share' },
          { id: 'b', text: 'Turn your camera off' },
          { id: 'd', text: 'Ask students to look away if something private appears' },
          { id: 'c', text: 'Close anything with other students’ information in it and share a single window rather than your whole screen', correct: true }
        ],
        explain: 'Share the narrowest thing that does the job, after clearing anything else off the screen.'
      },
      {
        id: 'f10',
        prompt: 'You realise you entered your password on a fake sign-in page an hour ago. What is the first thing to do?',
        options: [
          { id: 'c', text: 'Change your password immediately, then report it to IT and your manager', correct: true },
          { id: 'a', text: 'Delete the email' },
          { id: 'b', text: 'Wait to see if anything happens' },
          { id: 'd', text: 'Change your password next time you are prompted' }
        ],
        explain: 'Contain first, then report. Speed is the whole point, and you will not be in trouble for it.'
      }
    ]
  },

  takeaways: [
    'Pause before clicking links or acting on unexpected requests',
    'Verify unusual requests through a second, known channel, voice and video can be faked',
    'Never share passwords; protect your account with MFA or a passkey',
    'Keep student and company information in approved systems, and out of public AI tools',
    'Share documents with named people, set to Restricted',
    'Report anything suspicious immediately, including your own mistakes',
    'When in doubt, stop and ask'
  ],

  closing: {
    title: 'Security is built through everyday habits',
    body: [
      'As Example continues to grow globally, attacks are becoming more sophisticated and more common. We are an attractive target because we work with students and families around the world and hold information that matters to them.',
      'Not all attacks are obvious. Many are designed to look like ordinary messages from colleagues, leaders or trusted services. That is exactly why small actions matter: pausing before a click, protecting your account, storing data properly, and reporting anything that feels wrong.',
      'If something feels off, or you are unsure, please ask. It is always okay to double-check, and reporting early protects everyone.'
    ],
    contact: 'itsupport@academies.example.org'
  },

  links: {
    acceptableUse: 'https://example.org/policies/safeguarding',
    supportRequest: 'https://example.org/support',
    changePassword: 'https://support.google.com/a/answer/6236387',
    itSupportEmail: 'itsupport@academies.example.org'
  }
};

/* The getContentJson() and getAnswerKey() that used to live here have been
   removed, NOT lost. Courses.gs now defines both, taking a course id, because
   the platform serves more than one course. Leaving these here would have been
   a real fault rather than dead code: Apps Script concatenates every .gs file
   into one script, so two functions of the same name resolve by file order,
   and whichever won would have decided whether the answer key came back for
   the right course. See git history for the originals. */
