import { Info, PenLine } from 'lucide-react'
import { useState } from 'react'
import { CornellNotesFrame } from '@/components/CornellNotesFrame'
import { mockSummary, reviewCornellLines, reviewPrompt } from '@/data/canned-replies'
import type { Book, ChatMessage } from '@/data/types'
import { publicUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  book: Book
  reviewThread: ChatMessage[]
  summaryOnPage: string | null
  onReviewMessages: (msgs: ChatMessage[]) => void
  onAddSummary: (summary: string) => void
  onReadOn: () => void
}

export function RetainView({
  book,
  reviewThread,
  summaryOnPage,
  onReviewMessages,
  onAddSummary,
  onReadOn,
}: Props) {
  const [input, setInput] = useState('')
  const [ackOpen, setAckOpen] = useState(true)
  const hasRealCornell = book.id === 'never-split'
  const waitingForSummary =
    !summaryOnPage && !reviewThread.some((m) => m.role === 'user')

  const send = () => {
    if (!input.trim()) return
    const now = Date.now()
    onReviewMessages([
      ...reviewThread,
      { id: `u-${now}`, role: 'user', text: input.trim() },
      {
        id: `a-${now}`,
        role: 'assistant',
        text: `Refined version:\n\n${mockSummary}`,
      },
      {
        id: `a-${now}-done`,
        role: 'assistant',
        text: 'Added to today’s Cornell summary on the latest page. Ready when you are.',
      },
    ])
    onAddSummary(mockSummary)
    setInput('')
  }

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col overflow-hidden lg:flex-row">
      <Dialog open={ackOpen} onOpenChange={setAckOpen}>
        <DialogContent className="max-w-md gap-5 border-[#279989]/25 bg-card p-6 sm:rounded-2xl">
          <DialogHeader className="gap-3 pr-6">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f5f3] text-[#279989]"
                aria-hidden
              >
                <Info className="h-5 w-5" />
              </span>
              <div className="min-w-0 space-y-2">
                <DialogTitle className="font-display text-xl leading-snug text-foreground">
                  Review to make it yours
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-2 text-left text-sm leading-relaxed text-muted-foreground">
                    {reviewCornellLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="ink"
              className="min-h-11 min-w-[7.5rem] px-6"
              onClick={() => setAckOpen(false)}
              autoFocus
            >
              Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-desk">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cornell notebook
            </p>
            <p className="text-sm leading-snug">
              {hasRealCornell
                ? 'Latest page · Session 6 · Oct 28'
                : book.title}
            </p>
          </div>
          {hasRealCornell && (
            <a
              href={publicUrl('cornell-notes.html#session-6')}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Open full notes
            </a>
          )}
        </div>

        {hasRealCornell ? (
          <CornellNotesFrame
            anchor="session-6"
            title="Cornell notes — latest session"
            summaryToInject={summaryOnPage}
            className="min-h-[36vh] w-full flex-1 border-0 lg:min-h-0"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            No generated Cornell notebook for this book yet.
          </div>
        )}
      </main>

      <aside className="flex max-h-[48dvh] w-full shrink-0 flex-col overflow-y-auto border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:h-auto lg:max-h-none lg:min-h-0 lg:w-96 lg:overflow-hidden lg:border-t-0 lg:border-l">
        <div className="border-b border-border px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1b7a6d]">
            Your turn
          </p>
          <h2 className="font-display text-2xl leading-tight text-foreground">
            Review
          </h2>
          <p className="mt-1 text-sm leading-snug text-foreground/75">
            Make what you read your own
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-3 p-4">
            {reviewThread
              .filter((m) => !m.id.startsWith('rev-open'))
              .map((m) => (
              <div
                key={m.id}
                className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'ml-8 bg-foreground text-background'
                    : 'mr-3 border border-border/80 bg-paper text-foreground'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-border bg-muted/40 p-4">
          {waitingForSummary && (
            <div
              className="relative mb-3 overflow-hidden rounded-xl border border-[#279989]/30 bg-paper p-3.5 shadow-[0_1px_0_rgba(26,26,26,0.05)]"
              role="status"
            >
              <div
                className="absolute inset-y-0 left-0 w-1 bg-[#279989]"
                aria-hidden
              />
              <div className="flex gap-3 pl-2">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6f5f3] text-[#1b7a6d]"
                  aria-hidden
                >
                  <PenLine className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-lg leading-snug text-foreground">
                    {reviewPrompt.title}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {reviewPrompt.body}
                  </p>
                </div>
              </div>
            </div>
          )}
          {!summaryOnPage ? (
            <>
              <label
                htmlFor="review-summary"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Today’s summary
              </label>
              <Textarea
                id="review-summary"
                placeholder="A few sentences in your own words…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mb-2 min-h-20 bg-background lg:min-h-24"
              />
              <Button className="w-full" onClick={send} disabled={!input.trim()}>
                Submit summary
              </Button>
            </>
          ) : (
            <Button className="w-full" size="lg" onClick={onReadOn}>
              Read on
            </Button>
          )}
        </div>
      </aside>
    </div>
  )
}
