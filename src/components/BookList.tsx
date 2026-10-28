import { BookOpen, Upload } from 'lucide-react'
import { useRef } from 'react'
import type { Book } from '@/data/types'
import { publicUrl } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  books: Book[]
  onSelect: (book: Book) => void
  onUpload: (name: string) => void
}

export function BookList({ books, onSelect, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const sorted = [...books].sort((a, b) => {
    if (!a.lastReadAt && !b.lastReadAt) return 0
    if (!a.lastReadAt) return 1
    if (!b.lastReadAt) return -1
    return b.lastReadAt.localeCompare(a.lastReadAt)
  })

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <header className="w-full border-b border-border bg-hero px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] md:px-6 md:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <img
            src={publicUrl('readonn-logo.png?v=5')}
            alt="ReadOnn"
            width={788}
            height={317}
            decoding="async"
            fetchPriority="high"
            draggable={false}
            className="block h-12 w-auto max-w-[min(100%,18rem)] object-contain object-left select-none md:h-[3.5rem]"
            style={{ imageRendering: 'auto' }}
          />
          <h1 className="font-display mt-7 text-4xl leading-[1.2] md:text-5xl">
            <span className="slogan-muted">Read with </span>
            <span className="slogan-highlight">depth</span>
            <span className="slogan-muted">, </span>
            <span className="slogan-highlight">interactively</span>
          </h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6 md:py-8">
        <ul className="flex flex-1 flex-col gap-2">
          {sorted.map((book, index) => (
            <li key={book.id}>
              <button
                type="button"
                onClick={() => onSelect(book)}
                className="w-full cursor-pointer text-left"
              >
                <Card
                  className={
                    index === 0
                      ? 'book-card-featured'
                      : 'border-border/80 shadow-none transition-colors hover:border-foreground/30 hover:bg-card'
                  }
                >
                  <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 py-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
                        <BookOpen className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg not-italic">{book.title}</CardTitle>
                        <CardDescription className="mt-1">{book.author}</CardDescription>
                      </div>
                    </div>
                    {book.fresh ? (
                      <Badge variant="outline">New</Badge>
                    ) : (
                      <Badge variant="secondary">Last read {book.lastReadAt}</Badge>
                    )}
                  </CardHeader>
                  {!book.fresh && book.sleeve && (
                    <CardContent className="pb-4 pt-0">
                      <p className="text-xs text-muted-foreground">
                        {book.sleeve.next
                          ? `Next: ${book.sleeve.next}`
                          : book.sleeve.lastLocation}{' '}
                        · {book.sleeve.sessions} sessions
                      </p>
                    </CardContent>
                  )}
                </Card>
              </button>
            </li>
          ))}
        </ul>

        <div className="sticky bottom-0 mt-8 border-t border-border bg-background/95 py-5 backdrop-blur">
          <input
            ref={inputRef}
            type="file"
            accept=".md,.epub,.pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file.name.replace(/\.[^.]+$/, ''))
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="cta-bootleg w-full justify-center rounded-full border border-foreground/15 bg-card px-5 py-3 shadow-sm transition-colors hover:border-foreground/40 hover:bg-secondary"
            onClick={() => inputRef.current?.click()}
          >
            <span className="cta-bootleg__mark" aria-hidden>
              <Upload className="h-4 w-4" />
            </span>
            <span className="text-base">Upload a book</span>
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Prototype only — adds a row, does not parse the file.
          </p>
        </div>
      </div>
    </div>
  )
}
