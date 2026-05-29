import { useEffect, useState } from 'react'
import { fetchDriveImages, excludeLogo, type DriveImage } from '../lib/drive'

interface Props {
  /** Self-fetch mode: load all (non-logo) photos from this Drive folder. */
  folderId?: string
  /** Controlled mode: render exactly these photos (parent handles fetching). */
  images?: DriveImage[]
  /** Loading flag for controlled mode. */
  loading?: boolean
  columns?: 2 | 3 | 4
}

export default function PhotoGrid({
  folderId,
  images: controlledImages,
  loading: controlledLoading,
  columns = 3,
}: Props) {
  const controlled = controlledImages !== undefined
  const [fetched, setFetched] = useState<DriveImage[]>([])
  const [selfLoading, setSelfLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<DriveImage | null>(null)

  useEffect(() => {
    // Skip fetching when the parent supplies images directly.
    if (controlled || !folderId) return
    setSelfLoading(true)
    setError(null)
    fetchDriveImages(folderId)
      .then((imgs) => setFetched(excludeLogo(imgs)))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Failed to load photos.'),
      )
      .finally(() => setSelfLoading(false))
  }, [folderId, controlled])

  const images = controlled ? controlledImages : fetched
  const loading = controlled ? !!controlledLoading : selfLoading

  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }[columns]

  if (loading) {
    return (
      <div className={`grid ${colClass} gap-4`}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-600 text-sm">
        {error}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center text-gray-400">
        <p className="text-4xl mb-2">📷</p>
        <p className="font-medium">No photos yet</p>
        <p className="text-sm mt-1">Add images to the linked Google Drive folder to display them here.</p>
      </div>
    )
  }

  return (
    <>
      <div className={`grid ${colClass} gap-4`}>
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setLightbox(img)}
            className="group overflow-hidden rounded-lg aspect-square focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <img
              src={img.thumbnailUrl}
              alt={img.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gold transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={lightbox.fullUrl}
            alt={lightbox.name}
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
