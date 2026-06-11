import { useEffect, useState } from 'react'
import { fetchNewsletterArchive, type NewsletterIssue } from '../lib/newsletter'

// Simple document icon — Drive doesn't expose PDF thumbnails cheaply, so every
// archive card shares this gold glyph instead.
function PdfIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-10 h-10 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

// One past issue — a card that opens the PDF in a new tab via the same-origin
// proxy. Never embeds the PDF inline.
function IssueCard({ issue }: { issue: NewsletterIssue }) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center text-center rounded-2xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <PdfIcon />
      <p className="mt-4 font-bold text-purple leading-tight">{issue.label}</p>
      {issue.dateLabel && <p className="mt-1 text-sm text-gray-500">{issue.dateLabel}</p>}
    </a>
  )
}

export default function Newsletters() {
  const [issues, setIssues] = useState<NewsletterIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchNewsletterArchive()
      .then((i) => active && setIssues(i))
      .catch((e: unknown) =>
        active && setError(e instanceof Error ? e.message : 'Failed to load past newsletters.'),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="bg-purple text-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gold font-semibold tracking-widest text-sm uppercase mb-4">Newsletter</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Past Newsletters</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Browse our previous issues. Click any newsletter to open the full PDF.
          </p>
        </div>
      </section>

      {/* Archive */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 text-sm">
              {error}
            </div>
          ) : issues.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-400">
              <p className="font-medium">No past newsletters yet.</p>
              <p className="text-sm mt-1">Archived issues will appear here once they're added to Drive.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
