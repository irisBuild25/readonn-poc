import { useEffect, useRef } from 'react'
import { publicUrl } from '@/lib/utils'

type Props = {
  /** Hash target inside cornell-notes.html, e.g. sleeve | session-6 */
  anchor?: string
  className?: string
  title?: string
  /** When set, write into the latest session Summary details (same-origin iframe) */
  summaryToInject?: string | null
  onReady?: () => void
}

const CORNELL_SRC = publicUrl('cornell-notes.html')

export function CornellNotesFrame({
  anchor = 'session-6',
  className,
  title = 'Cornell notes',
  summaryToInject,
  onReady,
}: Props) {
  const ref = useRef<HTMLIFrameElement>(null)
  const injectedRef = useRef<string | null>(null)

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return

    const onLoad = () => {
      onReady?.()
      try {
        const doc = iframe.contentDocument
        doc?.documentElement.setAttribute('data-theme', 'light')
        const target = doc?.getElementById(anchor)
        target?.scrollIntoView({ behavior: 'auto', block: 'start' })
      } catch {
        // ignore cross-origin
      }
    }

    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [anchor, onReady])

  useEffect(() => {
    if (!summaryToInject || injectedRef.current === summaryToInject) return
    const doc = ref.current?.contentDocument
    if (!doc) return

    const session = doc.getElementById(anchor) ?? doc.getElementById('session-6')
    const details = session?.querySelector('footer.sum details')
    const summaryP = details?.querySelector('p')
    if (summaryP) {
      const marker = doc.createElement('p')
      marker.style.marginTop = '12px'
      marker.style.borderLeft = '3px solid var(--red)'
      marker.style.paddingLeft = '8px'
      marker.innerHTML = `<b>Today’s session (prototype):</b> ${escapeHtml(summaryToInject)}`
      details?.appendChild(marker)
      injectedRef.current = summaryToInject
      session?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [summaryToInject, anchor])

  return (
    <iframe
      ref={ref}
      title={title}
      src={`${CORNELL_SRC}#${anchor}`}
      className={className}
      style={{ colorScheme: 'light' }}
    />
  )
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
