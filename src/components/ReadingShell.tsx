import {
  Highlighter,
  LogOut,
  MessageSquare,
  MessageCircleQuestion,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  Send,
  X,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { askFollowUp, askReply } from '@/data/canned-replies'
import { bookToc, chapter4Paragraphs } from '@/data/excerpt'
import type { Annotation, Book, ChatMessage, Highlight, QnA } from '@/data/types'
import { useMediaQuery } from '@/hooks/use-media-query'
import { BootlegButton } from '@/components/ui/bootleg-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatClock } from '@/lib/utils'

type Props = {
  book: Book
  timerMinutes: number
  comments: Annotation[]
  highlights: Highlight[]
  qnas: QnA[]
  askThread: ChatMessage[]
  onAddComment: (quote: string, body: string) => void
  onUpdateComment: (id: string, body: string) => void
  onDeleteComment: (id: string) => void
  onAddHighlight: (quote: string) => void
  onAsk: (quote: string, question: string, answer: string) => void
  onAskFollowUp: (question: string, answer: string) => void
  onEndSession: () => void
}

type SelectionUI = {
  text: string
  x: number
  y: number
}

type NumberedComment = Annotation & { number: number; paraId: string | null; blockLabel: string }

function findParaForQuote(quote: string) {
  const needle = quote.trim()
  if (!needle) return undefined
  const short = needle.slice(0, 48)
  return (
    chapter4Paragraphs.find((p) => p.text.includes(short)) ??
    chapter4Paragraphs.find((p) => short.includes(p.text.slice(0, 48))) ??
    chapter4Paragraphs.find((p) => {
      const overlap = needle.slice(0, 24)
      return overlap.length >= 12 && p.text.includes(overlap)
    })
  )
}

function formatStamp(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function truncateQuote(quote: string, max = 140) {
  const t = quote.trim()
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t
}

function CommentBadge({
  comment,
  active,
  onClick,
}: {
  comment: NumberedComment
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-comment-anchor={comment.id}
      className={`comment-badge ${active ? 'is-active' : ''}`}
      aria-label={`Go to comment ${comment.number}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {comment.number}
    </button>
  )
}

type TextMark = {
  id: string
  kind: 'highlight' | 'comment'
  start: number
  end: number
  comment?: NumberedComment
}

/** Exact highlight + comment spans; comment number sits right after its selection. */
function ParaWithAnnotations({
  text,
  paraId,
  focused,
  highlightsHere,
  commentsHere,
  activeCommentId,
  onBadgeClick,
}: {
  text: string
  paraId: string
  focused: boolean
  highlightsHere: Highlight[]
  commentsHere: NumberedComment[]
  activeCommentId: string | null
  onBadgeClick: (c: NumberedComment) => void
}) {
  const marks: TextMark[] = []
  for (const h of highlightsHere) {
    const quote = h.quote.trim()
    const start = text.indexOf(quote)
    if (start >= 0) marks.push({ id: h.id, kind: 'highlight', start, end: start + quote.length })
  }
  for (const c of commentsHere) {
    const quote = c.quote.trim()
    const start = text.indexOf(quote)
    if (start >= 0) {
      marks.push({ id: c.id, kind: 'comment', start, end: start + quote.length, comment: c })
    }
  }

  const points = new Set<number>([0, text.length])
  for (const m of marks) {
    points.add(m.start)
    points.add(m.end)
  }
  const sorted = [...points].sort((a, b) => a - b)

  const parts: ReactNode[] = []
  const unmatchedComments = commentsHere.filter(
    (c) => !marks.some((m) => m.kind === 'comment' && m.id === c.id),
  )

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (start >= end) continue
    const slice = text.slice(start, end)
    const mid = (start + end) / 2
    const inHl = marks.some((m) => m.kind === 'highlight' && m.start <= mid && mid < m.end)
    const commentMark = marks.find((m) => m.kind === 'comment' && m.start <= mid && mid < m.end)

    let node: ReactNode = slice
    if (inHl && commentMark) {
      node = (
        <mark key={`s-${start}`} className="comment-mark highlight-mark">
          {slice}
        </mark>
      )
    } else if (commentMark) {
      node = (
        <mark key={`s-${start}`} className="comment-mark">
          {slice}
        </mark>
      )
    } else if (inHl) {
      node = (
        <mark key={`s-${start}`} className="highlight-mark">
          {slice}
        </mark>
      )
    } else {
      node = <span key={`s-${start}`}>{slice}</span>
    }
    parts.push(node)

    // Badge immediately after the comment's selected text ends
    for (const m of marks) {
      if (m.kind === 'comment' && m.end === end && m.comment) {
        parts.push(
          <CommentBadge
            key={`badge-${m.id}`}
            comment={m.comment}
            active={activeCommentId === m.id}
            onClick={() => onBadgeClick(m.comment!)}
          />,
        )
      }
    }
  }

  for (const c of unmatchedComments) {
    parts.push(
      <CommentBadge
        key={`badge-fallback-${c.id}`}
        comment={c}
        active={activeCommentId === c.id}
        onClick={() => onBadgeClick(c)}
      />,
    )
  }

  return (
    <p
      data-para={paraId}
      className={`text-[17px] leading-8 text-foreground/90 ${focused ? 'para-focus' : ''}`}
    >
      {parts}
    </p>
  )
}

export function ReadingShell({
  book,
  timerMinutes,
  comments,
  highlights,
  qnas,
  askThread,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onAddHighlight,
  onAsk,
  onAskFollowUp,
  onEndSession,
}: Props) {
  const isLg = useMediaQuery('(min-width: 1024px)')
  const [tocOpen, setTocOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [remaining, setRemaining] = useState(timerMinutes * 60)
  const [paused, setPaused] = useState(false)
  const [timesUpOpen, setTimesUpOpen] = useState(false)
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)
  const targetSeconds = timerMinutes * 60
  const [selection, setSelection] = useState<SelectionUI | null>(null)
  const [commentOpen, setCommentOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [askOpen, setAskOpen] = useState(false)
  const [draftQuote, setDraftQuote] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [askInput, setAskInput] = useState('')
  const [rightTab, setRightTab] = useState('annotations')
  const [focusParaId, setFocusParaId] = useState<string | null>(null)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const readingRef = useRef<HTMLDivElement>(null)
  const askEndRef = useRef<HTMLDivElement>(null)
  const endedRef = useRef(false)
  const focusTimerRef = useRef<number | null>(null)

  const numberedComments: NumberedComment[] = useMemo(() => {
    const chronological = [...comments].sort((a, b) => a.createdAt - b.createdAt)
    return chronological.map((c, i) => {
      const para = findParaForQuote(c.quote)
      const blockIndex = para
        ? chapter4Paragraphs.findIndex((p) => p.id === para.id) + 1
        : 0
      return {
        ...c,
        number: i + 1,
        paraId: para?.id ?? null,
        blockLabel: blockIndex > 0 ? `Block ${blockIndex}` : 'Block —',
      }
    })
  }, [comments])

  const commentsByPara = useMemo(() => {
    const map = new Map<string, NumberedComment[]>()
    for (const c of numberedComments) {
      if (!c.paraId) continue
      const list = map.get(c.paraId) ?? []
      list.push(c)
      map.set(c.paraId, list)
    }
    return map
  }, [numberedComments])

  const highlightsByPara = useMemo(() => {
    const map = new Map<string, Highlight[]>()
    for (const h of highlights) {
      const para = findParaForQuote(h.quote)
      if (!para) continue
      const list = map.get(para.id) ?? []
      list.push(h)
      map.set(para.id, list)
    }
    return map
  }, [highlights])

  useEffect(() => {
    askEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [askThread])

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current)
    }
  }, [])

  useEffect(() => {
    setNotesOpen(isLg)
    setTocOpen(false)
  }, [isLg])

  const sendAskFollowUp = () => {
    const question = askInput.trim()
    if (!question || askThread.length === 0) return
    onAskFollowUp(question, askFollowUp(question))
    setAskInput('')
  }

  useEffect(() => {
    if (paused || timesUpOpen) return
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1)
      setRemaining((r) => {
        if (r <= 1) {
          setTimesUpOpen(true)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [paused, timesUpOpen])

  useLayoutEffect(() => {
    const captureSelection = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !readingRef.current) return
      if (!readingRef.current.contains(sel.anchorNode)) return
      const text = sel.toString().trim()
      if (!text) return
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const pad = 88
      setSelection({
        text,
        x: Math.min(Math.max(rect.left + rect.width / 2, pad), window.innerWidth - pad),
        y: Math.min(Math.max(rect.top - 8, 72), window.innerHeight - 72),
      })
    }
    const onMouseUp = () => captureSelection()
    const onTouchEnd = () => window.setTimeout(captureSelection, 50)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const clearSelectionUI = () => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const goToQuote = (quote: string, commentId?: string) => {
    const para = findParaForQuote(quote)
    if (!para) return
    const anchor = commentId
      ? readingRef.current?.querySelector(`[data-comment-anchor="${commentId}"]`)
      : null
    const el = anchor ?? readingRef.current?.querySelector(`[data-para="${para.id}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFocusParaId(para.id)
    setActiveCommentId(commentId ?? null)
    if (commentId) {
      setRightTab('annotations')
      setNotesOpen(true)
    }
    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current)
    focusTimerRef.current = window.setTimeout(() => {
      setFocusParaId(null)
      setActiveCommentId(null)
    }, 1800)
  }

  const openEditComment = (c: NumberedComment) => {
    setEditingId(c.id)
    setDraftQuote(c.quote)
    setDraftBody(c.body)
    setCommentOpen(true)
  }

  const tocVisible = tocOpen
  const notesVisible = isLg || notesOpen

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 pt-[max(0px,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))]">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={tocOpen ? 'Close contents' : 'Open contents'}
            onClick={() => setTocOpen((v) => !v)}
          >
            {tocOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none">{book.title}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {formatClock(elapsed)} elapsed · {formatClock(remaining)} left
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isLg && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={notesOpen ? 'Close notes' : 'Open notes'}
              onClick={() => setNotesOpen((v) => !v)}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
          <BootlegButton
            icon={LogOut}
            size="sm"
            className="min-h-11"
            onClick={() => {
              if (elapsed < targetSeconds) {
                setEndConfirmOpen(true)
                return
              }
              endedRef.current = true
              onEndSession()
            }}
          >
            End session
          </BootlegButton>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {!isLg && tocOpen && (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-foreground/25"
            aria-label="Close contents"
            onClick={() => setTocOpen(false)}
          />
        )}
        {tocVisible && (
          <aside
            className={cn(
              'flex flex-col border-border bg-background',
              isLg
                ? 'w-56 shrink-0 border-r'
                : 'absolute inset-y-0 left-0 z-30 w-[min(18rem,86vw)] border-r shadow-xl',
            )}
          >
            <div className="flex items-center justify-between px-3 pt-3 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contents
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close contents"
                onClick={() => setTocOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-full min-h-0 flex-1">
              <div className="p-3">
                <p className="mb-2 hidden px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
                  Contents
                </p>
                <nav className="flex flex-col gap-0.5">
                  {bookToc.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`min-h-11 rounded-md px-2 py-2 text-left text-xs leading-snug cursor-pointer hover:bg-secondary ${
                        item.id === 'ch4'
                          ? 'border-l-2 border-foreground bg-secondary font-medium text-foreground'
                          : 'border-l-2 border-transparent text-muted-foreground'
                      }`}
                      onClick={() => {
                        if (item.id === 'ch4') {
                          readingRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                        if (!isLg) setTocOpen(false)
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </ScrollArea>
          </aside>
        )}

        <main className="relative min-w-0 flex-1 bg-background">
          <ScrollArea className="h-full">
            <div ref={readingRef} className="mx-auto max-w-2xl px-5 py-8 md:px-8 md:py-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Last stop
              </p>
              <h1 className="font-display mb-8 text-3xl leading-tight text-foreground">
                CHAPTER 4 — BEWARE “YES”—MASTER “NO”
              </h1>
              {chapter4Paragraphs.map((p) => (
                <div key={p.id} className="mb-5">
                  {p.section && p.id !== 'p1' && (
                    <h2 className="font-display mb-3 mt-8 text-lg font-semibold tracking-wide text-foreground">
                      {p.section}
                    </h2>
                  )}
                  <ParaWithAnnotations
                    text={p.text}
                    paraId={p.id}
                    focused={focusParaId === p.id}
                    highlightsHere={highlightsByPara.get(p.id) ?? []}
                    commentsHere={commentsByPara.get(p.id) ?? []}
                    activeCommentId={activeCommentId}
                    onBadgeClick={(c) => {
                      setActiveCommentId(c.id)
                      setRightTab('annotations')
                      setNotesOpen(true)
                      const card = document.querySelector(`[data-comment-card="${c.id}"]`)
                      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          {selection && (
            <div
              className="fixed z-40 flex -translate-x-1/2 -translate-y-full gap-1 rounded-full border border-border bg-card p-1 shadow-md"
              style={{ left: selection.x, top: selection.y }}
            >
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 px-3"
                onClick={() => {
                  onAddHighlight(selection.text)
                  clearSelectionUI()
                }}
              >
                <Highlighter className="h-3.5 w-3.5" />
                Highlight
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 px-3"
                onClick={() => {
                  setDraftQuote(selection.text)
                  setDraftBody('')
                  setCommentOpen(true)
                  clearSelectionUI()
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Comment
              </Button>
              <Button
                size="sm"
                variant="ink"
                className="min-h-11 px-3"
                onClick={() => {
                  setDraftQuote(selection.text)
                  setDraftBody('')
                  setAskOpen(true)
                  clearSelectionUI()
                }}
              >
                <MessageCircleQuestion className="h-3.5 w-3.5" />
                Ask
              </Button>
            </div>
          )}
        </main>

        {!isLg && notesOpen && (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-foreground/25"
            aria-label="Close notes"
            onClick={() => setNotesOpen(false)}
          />
        )}
        {notesVisible && (
        <aside
          className={cn(
            'flex flex-col border-border bg-card',
            isLg
              ? 'w-80 shrink-0 border-l'
              : 'absolute inset-y-0 right-0 z-30 w-[min(22rem,92vw)] border-l shadow-xl',
          )}
        >
          {!isLg && (
            <div className="flex items-center justify-between border-b border-border px-3 py-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close notes"
                onClick={() => setNotesOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex min-h-0 flex-1 flex-col p-3">
            <TabsList>
              <TabsTrigger value="annotations">Notes</TabsTrigger>
              <TabsTrigger value="highlights">HL</TabsTrigger>
              <TabsTrigger value="ask">Ask</TabsTrigger>
              <TabsTrigger value="qna">QnA</TabsTrigger>
            </TabsList>

            <TabsContent value="annotations" className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 pr-2">
                  {[...numberedComments]
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((c) => (
                      <Card
                        key={c.id}
                        data-comment-card={c.id}
                        role="button"
                        tabIndex={0}
                        className={`cursor-pointer shadow-none transition-shadow hover:shadow-sm ${
                          activeCommentId === c.id
                            ? 'ring-1 ring-[#279989]'
                            : 'hover:ring-1 hover:ring-[#279989]/40'
                        }`}
                        onClick={() => goToQuote(c.quote, c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            goToQuote(c.quote, c.id)
                          }
                        }}
                      >
                        <CardContent className="space-y-2 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="comment-chip">#{c.number} COMMENT</span>
                            <span className="text-[11px] text-muted-foreground">{c.blockLabel}</span>
                          </div>
                          <p className="comment-quote-box">{truncateQuote(c.quote)}</p>
                          <p className="text-sm text-foreground">{c.body}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-muted-foreground">
                              {formatStamp(c.createdAt)}
                            </span>
                            <div className="flex gap-3 text-[11px] text-muted-foreground">
                              <button
                                type="button"
                                className="cursor-pointer hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditComment(c)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="cursor-pointer hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteComment(c.id)
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {comments.length === 0 && (
                    <p className="px-1 text-sm text-muted-foreground">
                      Select text and add a comment.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="highlights" className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 pr-2">
                  {[...highlights]
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((h) => (
                      <Card
                        key={h.id}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer overflow-hidden shadow-none transition-shadow hover:shadow-sm hover:ring-1 hover:ring-[#279989]/40"
                        onClick={() => goToQuote(h.quote)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            goToQuote(h.quote)
                          }
                        }}
                      >
                        <CardContent className="highlight-card p-3">
                          <p className="text-sm leading-relaxed">{h.quote}</p>
                        </CardContent>
                      </Card>
                    ))}
                  {highlights.length === 0 && (
                    <p className="px-1 text-sm text-muted-foreground">No highlights yet.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ask" className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-3 pr-2 pb-2">
                  {askThread.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Select a passage and tap Ask to start a conversation. Then keep chatting here.
                    </p>
                  )}
                  {askThread.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'ml-6 bg-foreground text-background'
                          : 'mr-4 bg-secondary text-foreground'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  <div ref={askEndRef} />
                </div>
              </ScrollArea>
              <div className="mt-2 flex shrink-0 items-end gap-2 border-t border-border pt-3">
                <Textarea
                  rows={1}
                  placeholder={
                    askThread.length === 0
                      ? 'Start with Ask on a selection…'
                      : 'Continue the conversation…'
                  }
                  value={askInput}
                  disabled={askThread.length === 0}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendAskFollowUp()
                    }
                  }}
                  className="min-h-10 max-h-28 flex-1 resize-none py-2.5 leading-5"
                />
                <Button
                  size="icon"
                  variant="ink"
                  className="h-11 w-11 shrink-0"
                  disabled={askThread.length === 0 || !askInput.trim()}
                  onClick={sendAskFollowUp}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="qna" className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 pr-2">
                  {[...qnas]
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((q) => (
                      <Card
                        key={q.id}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer shadow-none transition-shadow hover:shadow-sm hover:ring-1 hover:ring-[#279989]/40"
                        onClick={() => goToQuote(q.quote)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            goToQuote(q.quote)
                          }
                        }}
                      >
                        <CardContent className="space-y-2 p-3">
                          <p className="comment-quote-box">{q.quote}</p>
                          <p className="text-sm font-medium">Q: {q.question}</p>
                          <Separator />
                          <p className="whitespace-pre-wrap text-sm">{q.answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  {qnas.length === 0 && (
                    <p className="px-1 text-sm text-muted-foreground">No QnA yet.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
        )}
      </div>

      <Dialog
        open={commentOpen}
        onOpenChange={(open) => {
          setCommentOpen(open)
          if (!open) setEditingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit comment' : 'Add comment'}</DialogTitle>
            <DialogDescription>Free text only. No images in this prototype.</DialogDescription>
          </DialogHeader>
          <p className="comment-quote-box">{draftQuote}</p>
          <Textarea
            placeholder="Your note…"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            className="min-h-24"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCommentOpen(false)
                setEditingId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!draftBody.trim()}
              onClick={() => {
                if (editingId) onUpdateComment(editingId, draftBody.trim())
                else onAddComment(draftQuote, draftBody.trim())
                setCommentOpen(false)
                setEditingId(null)
                setRightTab('annotations')
                setNotesOpen(true)
              }}
            >
              {editingId ? 'Save changes' : 'Save comment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask</DialogTitle>
            <DialogDescription>
              Ask about the selected passage. The right panel becomes the conversation.
            </DialogDescription>
          </DialogHeader>
          <blockquote className="rounded-lg border border-border bg-muted/50 p-3 text-sm italic">
            {draftQuote}
          </blockquote>
          <Textarea
            placeholder="Your question…"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            className="min-h-24"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAskOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!draftBody.trim()}
              onClick={() => {
                const question = draftBody.trim()
                const answer = askReply(question, draftQuote)
                onAsk(draftQuote, question, answer)
                setAskOpen(false)
                setRightTab('ask')
                setNotesOpen(true)
              }}
            >
              Ask
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={endConfirmOpen} onOpenChange={setEndConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End session early?</DialogTitle>
            <DialogDescription>
              You still have {formatClock(Math.max(0, targetSeconds - elapsed))} left on your{' '}
              {timerMinutes}-minute target. End now anyway?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEndConfirmOpen(false)}>
              Keep reading
            </Button>
            <Button
              onClick={() => {
                endedRef.current = true
                setEndConfirmOpen(false)
                onEndSession()
              }}
            >
              End session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={timesUpOpen}
        onOpenChange={(open) => {
          if (!open && !endedRef.current) setTimesUpOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time&apos;s up</DialogTitle>
            <DialogDescription>Do you want to stop here or continue?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRemaining(timerMinutes * 60)
                setTimesUpOpen(false)
                setPaused(false)
              }}
            >
              Continue
            </Button>
            <Button
              onClick={() => {
                endedRef.current = true
                setTimesUpOpen(false)
                onEndSession()
              }}
            >
              Stop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
