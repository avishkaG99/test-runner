/**
 * Command registry and the matching/scoring rules behind the palette.
 *
 * Kept free of React so the ranking can be unit-tested directly, and so the
 * palette component stays a thin shell over these pure functions.
 */

export type CommandGroup = 'Navigation' | 'Actions' | 'Help'

export interface Command {
  id: string
  label: string
  group: CommandGroup
  /** Extra words matched against, never rendered. */
  keywords: string[]
  /** Route to navigate to. Omitted for commands that run an action instead. */
  to?: string
  /** Rendered as a hint on the row, e.g. "G then D". */
  shortcut?: string
  /** Present but not runnable — exercises disabled-item handling. */
  disabled?: boolean
}

export const COMMANDS: Command[] = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', group: 'Navigation', keywords: ['home', 'stats', 'overview'], to: '/dashboard', shortcut: 'G then D' },
  { id: 'nav-products', label: 'Go to Products', group: 'Navigation', keywords: ['catalogue', 'catalog', 'items', 'inventory'], to: '/products', shortcut: 'G then P' },
  { id: 'nav-forms', label: 'Go to Forms', group: 'Navigation', keywords: ['inputs', 'validation'], to: '/forms', shortcut: 'G then F' },
  { id: 'nav-wizard', label: 'Go to Form Wizard', group: 'Navigation', keywords: ['steps', 'multi-step'], to: '/forms/wizard' },
  { id: 'nav-playground', label: 'Go to UI Playground', group: 'Navigation', keywords: ['components', 'widgets', 'demo'], to: '/ui-playground' },
  { id: 'nav-reports', label: 'Go to Reports', group: 'Navigation', keywords: ['export', 'generate', 'progress'], to: '/reports' },
  { id: 'nav-settings', label: 'Go to Settings', group: 'Navigation', keywords: ['preferences', 'theme', 'latency'], to: '/settings', shortcut: 'G then S' },

  { id: 'action-toggle-theme', label: 'Toggle theme', group: 'Actions', keywords: ['dark', 'light', 'appearance'] },
  { id: 'action-copy-url', label: 'Copy current URL', group: 'Actions', keywords: ['clipboard', 'share', 'link'] },
  { id: 'action-sign-out', label: 'Sign out', group: 'Actions', keywords: ['logout', 'log out', 'exit'] },
  { id: 'action-export', label: 'Export catalogue (unavailable offline)', group: 'Actions', keywords: ['download', 'csv'], disabled: true },

  { id: 'help-shortcuts', label: 'Show keyboard shortcuts', group: 'Help', keywords: ['keys', 'bindings', 'hotkeys'] },
]

/** Group render order. Groups absent from the results are skipped. */
export const GROUP_ORDER: CommandGroup[] = ['Navigation', 'Actions', 'Help']

/**
 * Ranks a command against a query, or returns null when it does not match.
 *
 * Lower is better, so the caller sorts ascending. The tiers are deliberately
 * coarse and far apart: within a tier the original registry order survives via
 * a stable sort, which keeps results predictable enough to assert on.
 */
export function scoreCommand(command: Command, query: string): number | null {
  const q = query.trim().toLowerCase()
  if (!q) return 0

  const label = command.label.toLowerCase()

  if (label === q) return 0
  if (label.startsWith(q)) return 1

  // Word-boundary hit ranks above a mid-word one: typing "pro" should put
  // "Go to Products" above a command that merely contains "pro" inside a word.
  if (label.split(/\s+/).some((word) => word.startsWith(q))) return 2
  if (label.includes(q)) return 3

  if (command.keywords.some((k) => k.toLowerCase().startsWith(q))) return 4
  if (command.keywords.some((k) => k.toLowerCase().includes(q))) return 5

  return null
}

/** Matching commands, best first. Ties keep registry order. */
export function filterCommands(
  query: string,
  commands: Command[] = COMMANDS,
): Command[] {
  return commands
    .map((command, index) => ({
      command,
      score: scoreCommand(command, query),
      index,
    }))
    .filter(
      (entry): entry is { command: Command; score: number; index: number } =>
        entry.score !== null,
    )
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.command)
}

/** Results split into render groups, preserving GROUP_ORDER and dropping empties. */
export function groupCommands(
  commands: Command[],
): { group: CommandGroup; commands: Command[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    commands: commands.filter((c) => c.group === group),
  })).filter((entry) => entry.commands.length > 0)
}

/**
 * Next index when moving through a list with arrow keys, wrapping at both ends.
 * Returns -1 for an empty list so the caller has nothing to highlight.
 */
export function nextIndex(
  current: number,
  length: number,
  direction: 1 | -1,
): number {
  if (length === 0) return -1
  return (current + direction + length) % length
}
