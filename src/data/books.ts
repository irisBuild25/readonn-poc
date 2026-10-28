import type { Book } from './types'

/** Seeded from MDbook journals / cornell sleeve */
export const initialBooks: Book[] = [
  {
    id: 'never-split',
    title: 'Never Split the Difference',
    author: 'Chris Voss',
    lastReadAt: '2026-10-28',
    fresh: false,
    sleeve: {
      goal:
        "Pick up the book's communication tactics for work and personal conversations, and be able to explain the psychology behind each one.",
      started: 'Oct 19, 2026',
      sessions: 6,
      readHours: '6.6 hours',
      lastLocation: 'CHAPTER 4 — BEWARE “YES”—MASTER “NO”',
      next: 'Chapter 5 — Trigger the Two Words That Immediately Transform Any Negotiation',
    },
  },
  {
    id: 'getting-real',
    title: 'Getting Real',
    author: '37signals',
    lastReadAt: '2026-10-18',
    fresh: false,
    sleeve: {
      goal: 'Identify lessons with specific applications to my Bootstrap project',
      started: 'Oct 18, 2026',
      sessions: 1,
      readHours: '0.3 hours',
      lastLocation: 'Any time at all',
    },
  },
  {
    id: 'elements-fresh',
    title: 'The Elements of Style',
    author: 'Strunk & White',
    lastReadAt: null,
    fresh: true,
  },
]
