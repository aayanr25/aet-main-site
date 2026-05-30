import { useEffect, useState } from 'react'
import { fetchRushEvents, type RushEvent } from '../lib/calendar'

// Purple date chip showing month + day, derived from the parsed start date.
function DateChip({ date }: { date: Date }) {
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = date.getDate()
  return (
    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-purple text-white shrink-0">
      <span className="text-[0.6rem] font-semibold tracking-widest text-gold">{month}</span>
      <span className="font-serif text-2xl leading-none">{day}</span>
    </div>
  )
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 21s7-5.686 7-11a7 7 0 10-14 0c0 5.314 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export default function RushCalendar() {
  const [events, setEvents] = useState<RushEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchRushEvents()
      .then((e) => active && setEvents(e))
      .catch((e: unknown) =>
        active && setError(e instanceof Error ? e.message : 'Failed to load events.'),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 text-sm">
        {error}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-400">
        <p className="font-medium">No upcoming events</p>
        <p className="text-sm mt-1">Check back soon — new rush events are posted here.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {events.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 hover:border-gold hover:shadow-md transition-all duration-200"
        >
          <DateChip date={e.start} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-bold text-purple text-lg leading-tight">{e.title}</h3>
              <span
                className={`text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  e.type === 'invite' ? 'bg-purple/10 text-purple' : 'bg-gold/15 text-gold-dark'
                }`}
              >
                {e.type === 'invite' ? 'Invite-only' : 'Open'}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              {e.timeLabel && <span>{e.timeLabel}</span>}
              {e.location && (
                <span className="inline-flex items-center gap-1">
                  <PinIcon />
                  {e.location}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
