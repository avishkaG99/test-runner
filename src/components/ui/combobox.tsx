import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  id: string
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  invalid?: boolean
}

/**
 * Custom autocomplete built on the ARIA combobox pattern so getByRole('combobox')
 * and keyboard navigation both work.
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder = 'Search…',
  invalid,
}: ComboboxProps) {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = options.find((o) => o.value === value) ?? null
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const commit = (option: ComboboxOption) => {
    onChange(option.value)
    setQuery('')
    setOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      const option = filtered[activeIndex]
      if (option) commit(option)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          data-testid={`${id}-input`}
          value={open ? query : (selected?.label ?? '')}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 pr-9 text-sm',
            invalid && 'border-[var(--color-danger)]',
          )}
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 size-4 text-[var(--color-muted)]"
          aria-hidden="true"
        />
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          data-testid={`${id}-listbox`}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li
              className="px-3 py-2 text-sm text-[var(--color-muted)]"
              data-testid={`${id}-empty`}
            >
              No matches
            </li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                data-testid={`${id}-option-${option.value}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm',
                  index === activeIndex && 'bg-[var(--color-surface)]',
                  option.value === value && 'font-medium',
                )}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
