import { useMemo, useState } from 'react'
import { BookList } from '@/components/BookList'
import { ReadingShell } from '@/components/ReadingShell'
import { RetainView } from '@/components/RetainView'
import { SessionSetup } from '@/components/SessionSetup'
import { initialBooks } from '@/data/books'
import { seedComments, seedHighlights, seedQnas } from '@/data/canned-replies'
import type {
  Annotation,
  Book,
  ChatMessage,
  Highlight,
  QnA,
  View,
} from '@/data/types'

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function App() {
  const [view, setView] = useState<View>('books')
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [timerMinutes, setTimerMinutes] = useState(1)
  const [comments, setComments] = useState<Annotation[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [qnas, setQnas] = useState<QnA[]>([])
  const [askThread, setAskThread] = useState<ChatMessage[]>([])
  const [reviewThread, setReviewThread] = useState<ChatMessage[]>([])
  const [summaryOnPage, setSummaryOnPage] = useState<string | null>(null)

  const selected = useMemo(
    () => books.find((b) => b.id === selectedId) ?? null,
    [books, selectedId],
  )

  const seedSession = (book: Book) => {
    if (book.id === 'never-split') {
      setComments(
        seedComments.map((c, i) => ({
          id: uid('c'),
          quote: c.quote,
          body: c.body,
          createdAt: Date.now() - (seedComments.length - i) * 60_000,
        })),
      )
      setHighlights(
        seedHighlights.map((h, i) => ({
          id: uid('h'),
          quote: h.quote,
          createdAt: Date.now() - 2000 - i,
        })),
      )
      setQnas(
        seedQnas.map((q) => ({
          id: uid('q'),
          quote: q.quote,
          question: q.question,
          answer: q.answer,
          createdAt: Date.now() - 3000,
        })),
      )
    } else {
      setComments([])
      setHighlights([])
      setQnas([])
    }
    setAskThread([])
    setReviewThread([])
    setSummaryOnPage(null)
  }

  return (
    <div className="h-full w-full overflow-hidden">
      {view === 'books' && (
        <BookList
          books={books}
          onSelect={(book) => {
            setSelectedId(book.id)
            setView('setup')
          }}
          onUpload={(name) => {
            const id = uid('book')
            setBooks((prev) => [
              {
                id,
                title: name || 'Uploaded book',
                author: 'Uploaded',
                lastReadAt: null,
                fresh: true,
              },
              ...prev,
            ])
          }}
        />
      )}

      {view === 'setup' && selected && (
        <SessionSetup
          book={selected}
          onBack={() => setView('books')}
          onStart={(mins) => {
            setTimerMinutes(mins)
            seedSession(selected)
            setBooks((prev) =>
              prev.map((b) =>
                b.id === selected.id
                  ? { ...b, lastReadAt: new Date().toISOString().slice(0, 10), fresh: false }
                  : b,
              ),
            )
            setView('reading')
          }}
        />
      )}

      {view === 'reading' && selected && (
        <ReadingShell
          book={selected}
          timerMinutes={timerMinutes}
          comments={comments}
          highlights={highlights}
          qnas={qnas}
          askThread={askThread}
          onAddComment={(quote, body) => {
            setComments((prev) => [
              { id: uid('c'), quote, body, createdAt: Date.now() },
              ...prev,
            ])
          }}
          onUpdateComment={(id, body) => {
            setComments((prev) => prev.map((c) => (c.id === id ? { ...c, body } : c)))
          }}
          onDeleteComment={(id) => {
            setComments((prev) => prev.filter((c) => c.id !== id))
          }}
          onAddHighlight={(quote) => {
            setHighlights((prev) => [
              { id: uid('h'), quote, createdAt: Date.now() },
              ...prev,
            ])
          }}
          onAsk={(quote, question, answer) => {
            setAskThread((prev) => [
              ...prev,
              {
                id: uid('ask-u'),
                role: 'user',
                text: `“${quote.slice(0, 120)}${quote.length > 120 ? '…' : ''}”\n\n${question}`,
              },
              { id: uid('ask-a'), role: 'assistant', text: answer },
            ])
            setQnas((prev) => [
              { id: uid('q'), quote, question, answer, createdAt: Date.now() },
              ...prev,
            ])
          }}
          onAskFollowUp={(question, answer) => {
            setAskThread((prev) => [
              ...prev,
              { id: uid('ask-u'), role: 'user', text: question },
              { id: uid('ask-a'), role: 'assistant', text: answer },
            ])
          }}
          onEndSession={() => setView('retain')}
        />
      )}

      {view === 'retain' && selected && (
        <RetainView
          book={selected}
          reviewThread={reviewThread}
          summaryOnPage={summaryOnPage}
          onReviewMessages={setReviewThread}
          onAddSummary={setSummaryOnPage}
          onReadOn={() => setView('books')}
        />
      )}
    </div>
  )
}
