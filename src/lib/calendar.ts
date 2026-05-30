import { RUSH } from '../config/rush'

export type RushEventType = 'open' | 'invite'

export interface RushEvent {
  id: string
  title: string
  dateLabel: string // raw Date cell, shown exactly as typed in the sheet
  timeLabel: string // raw Time cell, shown exactly as typed in the sheet
  location: string
  type: RushEventType
  start: Date // parsed from date + time; used only for sorting/filtering
}

// Builds a lookup of lowercased header name -> column index.
function headerIndex(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  headers.forEach((h, i) => {
    map[h.trim().toLowerCase()] = i
  })
  return map
}

/**
 * Converts raw sheet rows into RushEvents. Columns are matched by HEADER NAME
 * (row 0), so column order doesn't matter and extra columns are ignored. Rows
 * missing a Date or Title, or with an unparseable date, are skipped.
 */
export function parseEvents(values: string[][]): RushEvent[] {
  if (!values || values.length < 2) return []

  const [header, ...rows] = values
  const idx = headerIndex(header)
  const cellAt = (row: string[], name: string): string => {
    const i = idx[name]
    return i === undefined ? '' : (row[i] ?? '').trim()
  }

  const out: RushEvent[] = []
  rows.forEach((row, r) => {
    const dateLabel = cellAt(row, 'date')
    const title = cellAt(row, 'title')
    if (!dateLabel || !title) return // skip blank/incomplete rows

    const timeLabel = cellAt(row, 'time')
    const start = new Date(`${dateLabel} ${timeLabel}`.trim())
    if (Number.isNaN(start.getTime())) return // skip unparseable dates

    const type: RushEventType = cellAt(row, 'type').toLowerCase().startsWith('invite')
      ? 'invite'
      : 'open'

    out.push({ id: `${r}-${title}`, title, dateLabel, timeLabel, location: cellAt(row, 'location'), type, start })
  })
  return out
}

function startOfDay(d: Date): number {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c.getTime()
}

/** Filters out events before today and returns the rest sorted soonest-first. */
export function upcomingEvents(events: RushEvent[], now: Date = new Date()): RushEvent[] {
  const today = startOfDay(now)
  return events
    .filter((e) => startOfDay(e.start) >= today)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

interface CalendarApiResponse {
  values?: string[][]
  error?: string
}

/**
 * Fetches the rush calendar from our same-origin proxy, parses it, and returns
 * only upcoming events (soonest-first). Network/parse boundary lives here so the
 * functions above stay pure and unit-testable.
 */
export async function fetchRushEvents(): Promise<RushEvent[]> {
  const res = await fetch(
    `/api/calendar?id=${encodeURIComponent(RUSH.sheetId)}&tab=${encodeURIComponent(RUSH.sheetTab)}`,
  )
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({ error: res.statusText }))) as CalendarApiResponse
    throw new Error(error || 'Failed to load the rush calendar.')
  }
  const { values } = (await res.json()) as CalendarApiResponse
  return upcomingEvents(parseEvents(values ?? []))
}
