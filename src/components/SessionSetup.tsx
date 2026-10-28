import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { CornellNotesFrame } from '@/components/CornellNotesFrame'
import type { Book } from '@/data/types'
import { publicUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Props = {
  book: Book
  onBack: () => void
  onStart: (timerMinutes: number) => void
}

const PRESETS = [
  { label: '5 min', value: 5 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
]

export function SessionSetup({ book, onBack, onStart }: Props) {
  const [minutes, setMinutes] = useState(30)
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const hasRealCornell = book.id === 'never-split' && !book.fresh

  const resolvedMinutes = customMode
    ? Math.max(1, Math.min(180, Number.parseInt(customValue, 10) || 0))
    : minutes
  const canStart = customMode ? Number.parseInt(customValue, 10) >= 1 : true

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto px-5 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6 md:py-8">
      <Button variant="ghost" size="sm" className="mb-6 w-fit" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Books
      </Button>

      {hasRealCornell && (
        <div className="mb-8 overflow-hidden rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cornell notebook · sleeve
            </p>
            <a
              href={publicUrl('cornell-notes.html#sleeve')}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Open full notes
            </a>
          </div>
          <CornellNotesFrame
            anchor="sleeve"
            title="Cornell sleeve"
            className="h-[220px] w-full border-0 bg-desk md:h-[280px]"
          />
        </div>
      )}

      {!book.fresh && book.sleeve && !hasRealCornell && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg not-italic">{book.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Goal: {book.sleeve.goal}</p>
            <p>
              {book.sleeve.sessions} sessions · {book.sleeve.readHours} · last stop{' '}
              {book.sleeve.lastLocation}
            </p>
          </CardContent>
        </Card>
      )}

      {book.fresh && (
        <Card className="mb-8 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg not-italic">{book.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fresh book — no Cornell notebook yet. Start a session to begin.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Set a timer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((t) => (
              <Button
                key={t.value}
                variant={!customMode && minutes === t.value ? 'default' : 'outline'}
                onClick={() => {
                  setCustomMode(false)
                  setMinutes(t.value)
                }}
              >
                {t.label}
              </Button>
            ))}
            <Button
              variant={customMode ? 'default' : 'outline'}
              onClick={() => setCustomMode(true)}
            >
              Custom
            </Button>
          </div>

          {customMode && (
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={180}
                inputMode="numeric"
                placeholder="Minutes"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="max-w-[140px] rounded-lg"
                autoFocus
              />
              <span className="text-sm text-muted-foreground">minutes (1–180)</span>
            </div>
          )}

          <Button
            size="lg"
            disabled={!canStart}
            onClick={() => onStart(resolvedMinutes)}
          >
            Start reading · {canStart ? `${resolvedMinutes} min` : '…'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
