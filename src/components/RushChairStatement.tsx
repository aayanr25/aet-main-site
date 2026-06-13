import { useEffect, useState } from 'react'
import { fetchRushChair, fetchRushStatement, type RushStatement } from '../lib/drive'
import { DRIVE_FOLDER_IDS } from '../config/photos'

export default function RushChairStatement() {
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null)
  const [statement, setStatement] = useState<RushStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    fetchRushChair(DRIVE_FOLDER_IDS.rush)
      .then((img) => active && setHeadshotUrl(img?.fullUrl ?? null))
      .catch(() => active && setHeadshotUrl(null))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchRushStatement(DRIVE_FOLDER_IDS.rush)
      .then((s) => active && setStatement(s))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-8 md:gap-12">
      {/* Headshot */}
      <div className="shrink-0">
        {headshotUrl ? (
          <img
            src={headshotUrl}
            alt="Rush Chair"
            loading="lazy"
            className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover ring-4 ring-gold/30 shadow-lg"
          />
        ) : (
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-gray-100 ring-4 ring-gold/20 animate-pulse" />
        )}
      </div>

      {/* Message */}
      <div className="max-w-xl">
        {loading ? (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-11/12" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-10/12" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3 mt-6" />
          </div>
        ) : error || !statement ? (
          <p className="text-gray-500">The rush chair's message will appear here soon.</p>
        ) : (
          <>
            {/* whitespace-pre-line keeps the Doc's own paragraph breaks, verbatim */}
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {statement.body}
            </p>
            {statement.signature && (
              <p className="mt-4 font-semibold text-purple">— {statement.signature}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
