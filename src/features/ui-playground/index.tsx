import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview', body: 'Overview tab content.' },
  { id: 'activity', label: 'Activity', body: 'Activity tab content.' },
  { id: 'settings', label: 'Settings', body: 'Settings tab content.' },
]

const FAQS = [
  { id: 'what', q: 'What is this page for?', a: 'It exercises interaction patterns that Playwright tests commonly need.' },
  { id: 'how', q: 'How is state reset?', a: 'Append ?reset=true to any URL to restore seed data.' },
  { id: 'why', q: 'Why no real backend?', a: 'MSW keeps every response deterministic and offline.' },
]

const INITIAL_TASKS = [
  { id: 't-1', label: 'Draft test plan' },
  { id: 't-2', label: 'Write locators' },
  { id: 't-3', label: 'Assert error states' },
  { id: 't-4', label: 'Wire up CI' },
]

export function UiPlayground() {
  return (
    <div className="flex flex-col gap-6" data-testid="ui-playground-page">
      <header>
        <h1 className="text-2xl font-semibold">UI playground</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Interaction patterns: tabs, accordion, tooltip, dialogs, drag and
          drop, iframes, popups, and infinite scroll.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <TabsDemo />
        <AccordionDemo />
        <TooltipAndToastDemo />
        <DialogDemo />
        <DragAndDropDemo />
        <IframeAndPopupDemo />
      </div>

      <InfiniteScrollDemo />
    </div>
  )
}

function TabsDemo() {
  const [active, setActive] = useState(TABS[0].id)

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = TABS.findIndex((t) => t.id === active)
    if (event.key === 'ArrowRight') {
      setActive(TABS[(index + 1) % TABS.length].id)
    } else if (event.key === 'ArrowLeft') {
      setActive(TABS[(index - 1 + TABS.length) % TABS.length].id)
    }
  }

  return (
    <Card className="flex flex-col gap-3" data-testid="tabs-demo">
      <h2 className="font-medium">Tabs</h2>
      <div
        role="tablist"
        aria-label="Example tabs"
        onKeyDown={onKeyDown}
        className="flex gap-1 border-b border-[var(--color-border)]"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm',
              active === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`tabpanel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          data-testid={`tabpanel-${tab.id}`}
          className="text-sm"
        >
          {tab.body}
        </div>
      ))}
    </Card>
  )
}

function AccordionDemo() {
  const [open, setOpen] = useState<string | null>(FAQS[0].id)

  return (
    <Card className="flex flex-col gap-2" data-testid="accordion-demo">
      <h2 className="font-medium">Accordion</h2>
      {FAQS.map((faq) => {
        const expanded = open === faq.id
        return (
          <div
            key={faq.id}
            className="border-b border-[var(--color-border)] last:border-0"
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`accordion-panel-${faq.id}`}
              data-testid={`accordion-trigger-${faq.id}`}
              onClick={() => setOpen(expanded ? null : faq.id)}
              className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-medium"
            >
              {faq.q}
              <ChevronDown
                className={cn('size-4 transition-transform', expanded && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
            {expanded && (
              <p
                id={`accordion-panel-${faq.id}`}
                data-testid={`accordion-panel-${faq.id}`}
                className="pb-3 text-sm text-[var(--color-muted)]"
              >
                {faq.a}
              </p>
            )}
          </div>
        )
      })}
    </Card>
  )
}

function TooltipAndToastDemo() {
  const [showTip, setShowTip] = useState(false)

  return (
    <Card className="flex flex-col gap-3" data-testid="tooltip-demo">
      <h2 className="font-medium">Tooltip and toasts</h2>

      <div className="relative w-fit">
        <button
          type="button"
          aria-describedby={showTip ? 'demo-tooltip' : undefined}
          data-testid="tooltip-trigger"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          Hover or focus me
        </button>
        {showTip && (
          <div
            role="tooltip"
            id="demo-tooltip"
            data-testid="tooltip-content"
            className="absolute top-full left-0 z-10 mt-1 rounded bg-[var(--color-fg)] px-2 py-1 text-xs text-[var(--color-bg)]"
          >
            Tooltips appear on hover and on keyboard focus.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          data-testid="toast-success-button"
          onClick={() => toast.success('Operation completed successfully')}
        >
          Success toast
        </Button>
        <Button
          size="sm"
          variant="danger"
          data-testid="toast-error-button"
          onClick={() => toast.error('Something went wrong')}
        >
          Error toast
        </Button>
        <Button
          size="sm"
          variant="secondary"
          data-testid="toast-info-button"
          onClick={() => toast.info('Here is some information')}
        >
          Info toast
        </Button>
      </div>
    </Card>
  )
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState<string | null>(null)

  return (
    <Card className="flex flex-col gap-3" data-testid="dialog-demo">
      <h2 className="font-medium">Dialog</h2>
      <p className="text-sm text-[var(--color-muted)]">
        Traps focus, closes on Escape or backdrop click.
      </p>
      <Button
        size="sm"
        data-testid="dialog-open-button"
        onClick={() => setOpen(true)}
      >
        Open dialog
      </Button>
      {confirmed && (
        <p className="text-sm" data-testid="dialog-result">
          Last action: {confirmed}
        </p>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        description="Nothing is actually modified here."
        testId="demo-dialog"
        footer={
          <>
            <Button
              variant="secondary"
              data-testid="demo-dialog-cancel"
              onClick={() => {
                setConfirmed('cancelled')
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              data-testid="demo-dialog-confirm"
              onClick={() => {
                setConfirmed('confirmed')
                setOpen(false)
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm">Press Escape or click the backdrop to close.</p>
      </Dialog>
    </Card>
  )
}

function DragAndDropDemo() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const dragged = useRef<string | null>(null)

  const onDrop = (targetId: string) => {
    const sourceId = dragged.current
    if (!sourceId || sourceId === targetId) return

    setTasks((prev) => {
      const next = [...prev]
      const from = next.findIndex((t) => t.id === sourceId)
      const to = next.findIndex((t) => t.id === targetId)
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    dragged.current = null
  }

  return (
    <Card className="flex flex-col gap-3" data-testid="dnd-demo">
      <h2 className="font-medium">Drag and drop</h2>
      <ul className="flex flex-col gap-2" data-testid="dnd-list">
        {tasks.map((task, index) => (
          <li
            key={task.id}
            draggable
            data-testid={`dnd-item-${task.id}`}
            data-position={index}
            onDragStart={() => {
              dragged.current = task.id
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(task.id)}
            className="flex cursor-grab items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          >
            <GripVertical
              className="size-4 text-[var(--color-muted)]"
              aria-hidden="true"
            />
            {task.label}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--color-muted)]">
        Order:{' '}
        <span data-testid="dnd-order">
          {tasks.map((t) => t.id).join(',')}
        </span>
      </p>
    </Card>
  )
}

const WIDGET_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 12px; color: #0f172a; background: #fff; }
  h3 { margin: 0 0 8px; font-size: 15px; }
  button { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 6px; padding: 6px 10px; font: inherit; font-size: 13px; cursor: pointer; }
  p { color: #555; font-size: 13px; }
</style></head>
<body>
  <h3 data-testid="iframe-heading">Inside the iframe</h3>
  <button type="button" data-testid="iframe-button">Click me</button>
  <p id="out" data-testid="iframe-output"></p>
  <script>
    document.querySelector('[data-testid="iframe-button"]').addEventListener('click', function () {
      document.getElementById('out').textContent = 'clicked inside iframe'
    })
  </script>
</body></html>`

function IframeAndPopupDemo() {
  // A blob URL keeps the frame off the network entirely. Loading it over HTTP
  // routes it through the MSW service worker, and Firefox then throws
  // InvalidStateError storms when the frame is torn down mid-flight on
  // navigation - which left the next route blank.
  //
  // The URL is deliberately not revoked on unmount: Firefox tears the frame
  // down asynchronously, so revoking immediately races the teardown and breaks
  // the following navigation. A few KB per visit is the cheaper trade.
  const [widgetUrl] = useState(() =>
    URL.createObjectURL(new Blob([WIDGET_HTML], { type: 'text/html' })),
  )

  return (
    <Card className="flex flex-col gap-3" data-testid="iframe-demo">
      <h2 className="font-medium">Iframe and popup</h2>

      {widgetUrl && (
        <iframe
          title="Embedded widget"
          src={widgetUrl}
          data-testid="demo-iframe"
          className="h-40 w-full rounded-md border border-[var(--color-border)] bg-white"
        />
      )}

      <a
        href="/popup.html"
        target="_blank"
        rel="noreferrer"
        data-testid="popup-link"
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        Open a new tab
      </a>
    </Card>
  )
}

function InfiniteScrollDemo() {
  const [count, setCount] = useState(20)
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setCount((c) => Math.min(c + 20, 100))
      setLoading(false)
    }, 400)
  }, [])

  useEffect(() => {
    const node = sentinel.current
    if (!node || count >= 100) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) loadMore()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [count, loading, loadMore])

  return (
    <Card className="flex flex-col gap-3" data-testid="infinite-scroll-demo">
      <h2 className="font-medium">Infinite scroll</h2>
      <p className="text-sm text-[var(--color-muted)]">
        Loaded <span data-testid="infinite-count">{count}</span> of 100 rows.
      </p>
      <div className="max-h-64 overflow-y-auto rounded-md border border-[var(--color-border)]">
        <ul data-testid="infinite-list">
          {Array.from({ length: count }).map((_, index) => (
            <li
              key={index}
              data-testid={`infinite-item-${index}`}
              className="border-b border-[var(--color-border)] px-3 py-2 text-sm last:border-0"
            >
              Row {index + 1}
            </li>
          ))}
        </ul>
        <div ref={sentinel} className="h-4" data-testid="infinite-sentinel" />
        {loading && (
          <p
            className="p-3 text-center text-sm text-[var(--color-muted)]"
            data-testid="infinite-loading"
          >
            Loading more…
          </p>
        )}
      </div>
      {count < 100 && (
        <Button
          size="sm"
          variant="secondary"
          loading={loading}
          data-testid="infinite-load-more"
          onClick={loadMore}
        >
          Load more
        </Button>
      )}
    </Card>
  )
}
