export type View = 'books' | 'setup' | 'reading' | 'retain'

export type Book = {
  id: string
  title: string
  author: string
  lastReadAt: string | null
  fresh: boolean
  sleeve?: {
    goal: string
    started: string
    sessions: number
    readHours: string
    lastLocation: string
    next?: string
  }
}

export type TocItem = {
  id: string
  label: string
}

export type Annotation = {
  id: string
  quote: string
  body: string
  createdAt: number
}

export type Highlight = {
  id: string
  quote: string
  createdAt: number
}

export type QnA = {
  id: string
  quote: string
  question: string
  answer: string
  createdAt: number
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export type SessionState = {
  bookId: string
  timerMinutes: number
  comments: Annotation[]
  highlights: Highlight[]
  qnas: QnA[]
  askThread: ChatMessage[]
  reviewThread: ChatMessage[]
  summaryOnPage: string | null
}
