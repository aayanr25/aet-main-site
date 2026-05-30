import { describe, it, expect } from 'vitest'
import { parseEvents, upcomingEvents } from './calendar'

const HEADERS = ['Date', 'Time', 'Title', 'Location', 'Type']

describe('parseEvents', () => {
  it('parses a well-formed row', () => {
    const ev = parseEvents([HEADERS, ['Sep 8, 2025', '7:00 PM', 'Cookout', 'The Lodge', 'Open']])
    expect(ev).toHaveLength(1)
    expect(ev[0]).toMatchObject({
      title: 'Cookout',
      dateLabel: 'Sep 8, 2025',
      timeLabel: '7:00 PM',
      location: 'The Lodge',
      type: 'open',
    })
    expect(ev[0].start.getFullYear()).toBe(2025)
  })

  it('maps columns by header name regardless of order', () => {
    const ev = parseEvents([
      ['Title', 'Type', 'Date', 'Time', 'Location'],
      ['Game Night', 'Invite-only', 'Sep 11, 2025', '8:00 PM', 'PMU'],
    ])
    expect(ev[0].title).toBe('Game Night')
    expect(ev[0].type).toBe('invite')
    expect(ev[0].location).toBe('PMU')
  })

  it('skips rows missing date or title, and unparseable dates', () => {
    const ev = parseEvents([
      HEADERS,
      ['', '7:00 PM', 'No Date', 'X', 'Open'],
      ['Sep 8, 2025', '7:00 PM', '', 'X', 'Open'],
      ['not a date', '7:00 PM', 'Bad Date', 'X', 'Open'],
    ])
    expect(ev).toHaveLength(0)
  })

  it('treats blank or unknown type as open', () => {
    const ev = parseEvents([HEADERS, ['Sep 8, 2025', '7:00 PM', 'T', 'L', '']])
    expect(ev[0].type).toBe('open')
  })

  it('returns [] for empty or header-only input', () => {
    expect(parseEvents([])).toEqual([])
    expect(parseEvents([HEADERS])).toEqual([])
  })
})

describe('upcomingEvents', () => {
  const now = new Date('2025-09-10T12:00:00')
  const evs = parseEvents([
    HEADERS,
    ['Sep 8, 2025', '7:00 PM', 'Past', 'L', 'Open'],
    ['Sep 14, 2025', '6:00 PM', 'Later', 'L', 'Open'],
    ['Sep 11, 2025', '8:00 PM', 'Soon', 'L', 'Open'],
  ])

  it('hides past events and sorts soonest-first', () => {
    expect(upcomingEvents(evs, now).map((e) => e.title)).toEqual(['Soon', 'Later'])
  })

  it('keeps events happening later today', () => {
    const todayEv = parseEvents([HEADERS, ['Sep 10, 2025', '9:00 PM', 'Tonight', 'L', 'Open']])
    expect(upcomingEvents(todayEv, now).map((e) => e.title)).toEqual(['Tonight'])
  })
})
