import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Renders the repository's test case sheet as a PR comment the web-app-tester
 * plugin can discover.
 *
 * The plugin's gather-test-context skill scans only the PR body and comments -
 * it never reads repository files or the diff. Posting the sheet as a comment
 * is therefore the only way to make it the TEST_PLAN rather than letting the
 * plugin auto-generate a happy-path-only substitute.
 *
 * Output satisfies the skill's three detection criteria: a numbered list, at
 * least two recognised action verbs, and a `Test Plan` heading.
 */

interface TestCase {
  ID: string
  Feature: string
  Title: string
  Type: string
  Steps: string
  'Expected Result': string
  Notes: string
  Status: string
  'Added In': string
}

/** Minimal RFC 4180 parser: handles quoted fields containing commas and newlines. */
function parseCsv(text: string): TestCase[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c !== ''))

  // Tolerate leading comment/marker lines before the real header row.
  const headerIndex = nonEmpty.findIndex((r) => r[0] === 'ID' && r.includes('Status'))
  if (headerIndex === -1) {
    throw new Error(
      'No header row found: expected a row beginning with "ID" and containing "Status".',
    )
  }

  const header = nonEmpty[headerIndex]
  return nonEmpty.slice(headerIndex + 1).map((cells) =>
    Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])),
  ) as unknown as TestCase[]
}

function main() {
  const sheetPath = process.argv[2] ?? 'test-cases.csv'
  const only = process.argv[3]?.split(',').map((s) => s.trim()).filter(Boolean)

  const cases = parseCsv(readFileSync(path.resolve(sheetPath), 'utf8')).filter(
    (c) => c.Status === 'Active' && (!only || only.includes(c.ID)),
  )

  if (cases.length === 0) {
    console.error(`No active cases matched in ${sheetPath}`)
    process.exit(1)
  }

  const lines: string[] = []
  let n = 0
  for (const c of cases) {
    for (const step of c.Steps.split('\n')) {
      const text = step.replace(/^\d+\.\s*/, '').trim()
      if (!text) continue
      n += 1
      lines.push(`${n}. [${c.ID}] ${text}`)
    }
    if (c['Expected Result']) {
      n += 1
      lines.push(`${n}. [${c.ID}] Verify the outcome: ${c['Expected Result']}`)
    }
  }

  // "Test Plan" heading + numbered list + action verbs = all three criteria.
  console.log('# Test Plan')
  console.log()
  console.log(
    `Generated from \`${sheetPath}\` — ${cases.length} active test cases, ${n} steps.`,
  )
  console.log('Each step is tagged with its test case id in square brackets.')
  console.log()
  console.log(lines.join('\n'))
}

main()
