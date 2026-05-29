import PhotoGrid from '../components/PhotoGrid'
import { DRIVE_FOLDER_IDS } from '../config/photos'

export default function Gallery() {
  return (
    <>
      {/* Hero */}
      <section className="bg-purple text-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gold font-semibold tracking-widest text-sm uppercase mb-4">Photos</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Gallery</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Moments from brotherhood events, philanthropy, retreats, and everyday life as an AET brother.
          </p>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PhotoGrid folderId={DRIVE_FOLDER_IDS.gallery} columns={4} />
        </div>
      </section>
    </>
  )
}
