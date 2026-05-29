import type { DriveImage } from '../lib/drive'

interface Props {
  /** The photos to feature (already selected/filtered by the parent). Up to 3 are shown. */
  images: DriveImage[]
  /** Show a loading shimmer while the parent is still fetching. */
  loading?: boolean
}

const HEIGHT = 'h-[420px] sm:h-[520px] lg:h-[600px]'

/**
 * Editorial photo mosaic for the hero. Purely presentational — the parent
 * decides which photos to feature (Home randomizes them and keeps them out of
 * the page's other photo sections). Adapts to however many photos it's given.
 */
export default function FeaturedMosaic({ images, loading = false }: Props) {
  const shown = images.slice(0, 3)

  const tile = (img: DriveImage, eager = false, extra = '') => (
    <div
      key={img.id}
      className={`relative overflow-hidden rounded-2xl ring-1 ring-white/15 ${extra}`}
    >
      <img
        src={img.thumbnailUrl}
        alt={img.name}
        loading={eager ? 'eager' : 'lazy'}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold/15" />
    </div>
  )

  // Loading shimmer
  if (loading) {
    return (
      <div className={`rounded-2xl bg-white/5 animate-pulse ring-1 ring-white/10 ${HEIGHT}`} />
    )
  }

  // No photos — single elegant crest panel
  if (shown.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl ring-1 ring-white/15 bg-gradient-to-br from-purple-light/40 to-purple-dark ${HEIGHT}`}
      >
        <span className="font-serif text-gold/30 text-7xl select-none">ΧΨ</span>
      </div>
    )
  }

  // 1 photo — full bleed
  if (shown.length === 1) {
    return <div className={HEIGHT}>{tile(shown[0], true, 'w-full h-full')}</div>
  }

  // 2 photos — split columns
  if (shown.length === 2) {
    return (
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${HEIGHT}`}>
        {tile(shown[0], true)}
        {tile(shown[1])}
      </div>
    )
  }

  // 3 photos — editorial: one tall + two stacked
  return (
    <div className={`grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 ${HEIGHT}`}>
      {tile(shown[0], true, 'row-span-2')}
      {tile(shown[1])}
      {tile(shown[2])}
    </div>
  )
}
