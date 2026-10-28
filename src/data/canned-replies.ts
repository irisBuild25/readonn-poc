/** Adapted from journal.md answers and summary refine pattern */

export function askReply(question: string, quote: string): string {
  const q = question.toLowerCase()
  if (q.includes('no') || quote.toLowerCase().includes('no')) {
    return (
      'Yes — and the book treats “No” as safety, not rejection. ' +
      '“No” is often temporary: it means “I’m not comfortable yet,” not “I considered every fact.” ' +
      'Invite it early so the other person feels control; then the real talk can start.\n\n' +
      '**Evidence:** “No is the start of the negotiation, not the end of it.” (CHAPTER 4)'
    )
  }
  if (q.includes('yes') || q.includes('counterfeit') || q.includes('commitment')) {
    return (
      'There are three kinds of “Yes”: Counterfeit, Confirmation, and Commitment. ' +
      'Only Commitment leads to action. A counterfeit yes is often used to make you go away.\n\n' +
      '**Evidence:** “A counterfeit yes is one in which your counterpart plans on saying no…” (CHAPTER 4)'
    )
  }
  if (q.includes('autonomy') || q.includes('control') || q.includes('veto')) {
    return (
      'People need autonomy. Camp’s “right to veto” — giving permission to say No — calms emotions ' +
      'so they can actually look at your proposal.\n\n' +
      '**Evidence:** “When you preserve a person’s autonomy… the emotions calm.” (CHAPTER 4)'
    )
  }
  return (
    'Half of that is in the text around your selection. Look for what “No” does for both sides: ' +
    'it clarifies what they don’t want, protects the status quo for a moment, and opens space to pivot. ' +
    'Ask yourself: is the other person defending a boundary, or rejecting the whole idea?\n\n' +
    '**Evidence:** “No is a safe choice that maintains the status quo.” (CHAPTER 4)'
  )
}

/** Follow-ups on an open Ask thread (no new selection required) */
export function askFollowUp(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('more') || q.includes('example') || q.includes('how')) {
    return (
      'Try this: open with “Is now a bad time?” instead of “Do you have a minute?” ' +
      'You invite a No, they feel control, and if they stay they are already leaning in.\n\n' +
      '**Evidence:** “Get them to say it early.” (CHAPTER 4)'
    )
  }
  if (q.includes('work') || q.includes('apply') || q.includes('use')) {
    return (
      'Pick one real conversation this week. Before you ask for anything, give them an easy No. ' +
      'Then listen for which of the seven meanings of No you hear.\n\n' +
      '**Evidence:** the list of alternative meanings for No (CHAPTER 4)'
    )
  }
  return (
    'Stay with the same passage. The next useful move is often a label or a calibrated question: ' +
    '“What about this doesn’t work for you?” Keep the thread on their world, not your pitch.\n\n' +
    '**Evidence:** “What would you need to make it work?” (CHAPTER 4)'
  )
}

export const reviewCornellLines = [
  'Cornell note has been generated from this session’s annotations and Q&A.',
  'Please review what you have learnt in the session.',
] as const

export const reviewOpening = [
  'Putting what you learned into your own words helps it stick. Write a short summary of today’s reading.',
]

export const reviewPrompt = {
  title: 'Write a short summary',
  body: 'Today’s reading, in your own words. That’s what makes it stick.',
} as const

/** Shown after the reader hits Send. Their typed text is ignored. */
export const mockSummary =
  'Voss flips the usual fear of “No”: for good negotiators it is gold — a safe choice that keeps control ' +
  'and clarifies what each side does not want. Amy’s repeated No’s were a gateway to the one Yes that mattered. ' +
  'Train yourself to hear No as “not ready yet,” then ask what would make it work. ' +
  'Watch for counterfeit Yes — agreement that hides a plan to say no later.'

export const seedComments = [
  {
    quote:
      'For good negotiators, “No” is pure gold. That negative provides a great opportunity for you and the other party to clarify what you really want by eliminating what you don’t want.',
    body: 'Getting people to say NO is to get them to feel safe and in control, and it’s where real talk can begin.',
  },
  {
    quote:
      'There are actually three kinds of “Yes”: Counterfeit, Confirmation, and Commitment.',
    body: '3 kinds of yes and its different meaning',
  },
]

export const seedHighlights = [
  {
    quote:
      '“No” is the start of the negotiation, not the end of it. We’ve been conditioned to fear the word “No.”',
  },
  {
    quote:
      'There are actually three kinds of “Yes”: Counterfeit, Confirmation, and Commitment.',
  },
]

export const seedQnas = [
  {
    quote:
      'When you preserve a person’s autonomy by clearly giving them permission to say “No” to your ideas, the emotions calm…',
    question: 'Why does inviting No make the other side more open?',
    answer:
      'Autonomy calms emotions. Once they can refuse, they can really look at the proposal instead of defending against a trap.\n\n**Evidence:** “People need to feel in control.” (CHAPTER 4)',
  },
]
