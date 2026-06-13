import { useEffect, useState } from 'react'
import { fetchRushChair } from '../lib/drive'
import { DRIVE_FOLDER_IDS } from '../config/photos'

export default function RushChairStatement() {
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchRushChair(DRIVE_FOLDER_IDS.rush)
      .then((img) => active && setHeadshotUrl(img?.fullUrl ?? null))
      .catch(() => active && setHeadshotUrl(null))
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
        <p className="text-lg text-gray-700 leading-relaxed">
          Hey! I'm so glad you're here. Rush is the best way to get to know us — no
          pressure, just good people and good conversation. Come hang out, ask us
          anything, and see if Chi Psi feels like home. I can't wait to meet you.
        </p>
        <p className="mt-4 font-semibold text-purple">— Your Rush Chair</p>
      </div>
    </div>
  )
}
