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

export default function NewsletterArchive() {
  const [issues, setIssues] = useState<NewsletterIssue[]>([])

  useEffect(() => {
    let active = true
    fetchNewsletterArchive()
      .then((i) => active && setIssues(i))
      .catch(() => active && setIssues([]))
    return () => {
      active = false
    }
  }, [])

  // Empty archive renders nothing at all — heading included.
  if (issues.length === 0) return null

  return (
    <div className="mt-16">
      <h3 className="text-2xl md:text-3xl font-bold text-purple text-center mb-8">Past Issues</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {issues.map((issue) => (
          <a
            key={issue.id}
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center text-center rounded-2xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <PdfIcon />
            <p className="mt-4 font-bold text-purple leading-tight">{issue.label}</p>
            {issue.dateLabel && (
              <p className="mt-1 text-sm text-gray-500">{issue.dateLabel}</p>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
