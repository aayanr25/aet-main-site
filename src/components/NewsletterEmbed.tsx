import { useEffect, useState } from 'react'
import { fetchCurrentNewsletter, type NewsletterPdf } from '../lib/newsletter'

export default function NewsletterEmbed() {
  const [pdf, setPdf] = useState<NewsletterPdf | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchCurrentNewsletter()
      .then((p) => active && setPdf(p))
      .catch(() => active && setPdf(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <div className="h-[500px] md:h-[700px] rounded-2xl bg-gray-100 animate-pulse" />
  }

  if (!pdf) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-400">
        <p className="font-medium">No newsletter available yet. Check back soon.</p>
      </div>
    )
  }

  return (
    <iframe
      src={pdf.url}
      title="Chi Psi Newsletter"
      className="w-full h-[500px] md:h-[700px] rounded-2xl border border-gray-200 shadow-sm"
    />
  )
}
