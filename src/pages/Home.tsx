import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PhotoGrid from '../components/PhotoGrid'
import FeaturedMosaic from '../components/FeaturedMosaic'
import { fetchDriveImages, excludeLogo, type DriveImage } from '../lib/drive'
import { DRIVE_FOLDER_IDS } from '../config/photos'

const stats = [
  { value: '2023', label: 'Chartered' },
  { value: '1841', label: 'Nationally Founded' },
  { value: 'ΑΕΤ', label: 'Our Alpha' },
  { value: 'Purdue', label: 'Our Home' },
]

// One photo is featured prominently in the hero.
const FEATURED_COUNT = 1
// Total photos shown at once across the page (hero + bottom grid). Any photos
// beyond this are hidden rather than displayed all at once.
const MAX_VISIBLE = 4

// Fisher–Yates shuffle (returns a new array; does not mutate the input).
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function Home() {
  const [photos, setPhotos] = useState<DriveImage[]>([])
  const [ready, setReady] = useState(false)

  // Single fetch of the home folder (logo already excluded). The hero and the
  // bottom grid both draw from this one list so a photo never shows in both.
  useEffect(() => {
    let active = true
    fetchDriveImages(DRIVE_FOLDER_IDS.home)
      .then((imgs) => active && setPhotos(excludeLogo(imgs)))
      .catch(() => active && setPhotos([]))
      .finally(() => active && setReady(true))
    return () => {
      active = false
    }
  }, [])

  // Shuffle the whole album once per fetch so both the hero and the bottom grid
  // cycle through different photos over repeated visits. Stable while the page
  // is open (not re-shuffled on every render).
  const shuffled = useMemo(() => shuffle(photos), [photos])

  // One prominent featured photo up top…
  const featured = shuffled.slice(0, FEATURED_COUNT)
  // …the rest go to the bottom grid, capped at MAX_VISIBLE total (overflow hidden).
  const rest = shuffled.slice(FEATURED_COUNT, MAX_VISIBLE)

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden bg-purple text-white">
        {/* Ambient gold glow */}
        <div
          className="pointer-events-none absolute -top-1/3 -right-1/4 w-[80vw] h-[80vw] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #cfa151 0%, transparent 60%)' }}
        />
        {/* Oversized crest watermark */}
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute -left-10 bottom-0 font-serif font-black leading-none text-white/[0.04] text-[40vw] lg:text-[28vw]"
        >
          ΧΨ
        </span>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[88vh] py-24 lg:py-28">
            {/* Left — copy */}
            <div className="animate-fade-up">
              <p className="eyebrow mb-6">Alpha Epsilon Tau · Purdue University</p>
              <h1 className="font-serif font-black leading-[0.95] tracking-tight text-5xl sm:text-6xl lg:text-7xl">
                Chi Psi
                <span className="block italic font-medium text-gold mt-2">Fraternity</span>
              </h1>
              <div className="mt-8 h-px w-24 bg-gradient-to-r from-gold to-transparent" />
              <p className="mt-8 max-w-md text-base sm:text-lg text-white/75 leading-relaxed font-sans">
                A brotherhood built on friendship — chartered in 2023 to forge
                lasting bonds, pursue excellence, and leave Purdue better than we
                found it.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/rush" className="btn-primary">
                  Rush Chi Psi
                </Link>
                <Link to="/about" className="btn-outline">
                  Our Story
                </Link>
              </div>
            </div>

            {/* Right — photo mosaic */}
            <div className="animate-fade-in lg:animate-float-slow">
              <FeaturedMosaic images={featured} loading={!ready} />
            </div>
          </div>
        </div>

        {/* Stat ribbon */}
        <div className="relative border-t border-white/10 bg-purple-dark/40 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <dl className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
              {stats.map(({ value, label }) => (
                <div key={label} className="py-6 px-4 text-center">
                  <dt className="font-serif text-3xl sm:text-4xl text-gold">{value}</dt>
                  <dd className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-white/50">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ───────────── Founding passage ───────────── */}
      <section className="bg-[#faf8f3] py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span aria-hidden="true" className="font-serif text-gold text-4xl">
            ❧
          </span>
          <p className="mt-8 font-serif text-2xl sm:text-3xl lg:text-4xl leading-snug text-purple">
            “A young alpha of one of the nation's oldest orders  —
            <span className="italic text-gold"> our story is just beginning.</span>”
          </p>
          <p className="mt-8 text-gray-600 leading-relaxed max-w-xl mx-auto">
            Founded nationally in 1841, Chi Psi was the first fraternity organized
            around the ideal of brotherhood itself. Alpha Epsilon Tau carries that
            tradition to Purdue, writing a new chapter of our own.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-gold/40" />
            <span className="font-serif text-gold tracking-widest">ΧΨ</span>
            <span className="h-px w-12 bg-gold/40" />
          </div>
        </div>
      </section>

      {/* ───────────── Chapter life photos ───────────── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <p className="eyebrow mb-4">Life at the Lodge</p>
              <h2 className="section-heading">Moments, Not Just Members</h2>
            </div>
            <Link to="/gallery" className="btn-dark-outline shrink-0">
              View Full Gallery
            </Link>
          </div>
          <PhotoGrid images={rest} loading={!ready} columns={3} />
        </div>
      </section>

      {/* ───────────── Closing CTA ───────────── */}
      <section className="relative overflow-hidden bg-purple-dark text-white">
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute right-4 -bottom-8 font-serif font-black leading-none text-white/[0.05] text-[18rem]"
        >
          ΧΨ
        </span>
        <div className="relative max-w-2xl mx-auto px-4 py-24 sm:py-28 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold">
            Find Your Brotherhood
          </h2>
          <p className="mt-5 text-white/70 text-lg leading-relaxed">
            We're looking for driven, genuine men ready to build something that
            outlasts them.
          </p>
          <div className="mt-10">
            <Link to="/rush" className="btn-primary text-base">
              Learn About Rush
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
