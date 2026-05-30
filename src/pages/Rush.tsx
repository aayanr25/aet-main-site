import RushCalendar from '../components/RushCalendar'
import PhotoGrid from '../components/PhotoGrid'
import { RUSH } from '../config/rush'
import { DRIVE_FOLDER_IDS } from '../config/photos'

export default function Rush() {
  return (
    <>
      {/* Hero */}
      <section className="bg-purple text-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gold font-semibold tracking-widest text-sm uppercase mb-4">Rush Chi Psi</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Find Your Brotherhood</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Rush season is your chance to discover whether Chi Psi Alpha Epsilon Tau is the right home for you at Purdue.
          </p>
        </div>
      </section>

      {/* Rush Calendar */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Rush Calendar</h2>
            <p className="section-subheading mx-auto">Upcoming events — come meet the brothers.</p>
          </div>
          <RushCalendar />
        </div>
      </section>

      {/* Interest Form */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-heading">Express Your Interest</h2>
            <p className="section-subheading mx-auto">
              Fill out the form and a brother will be in touch.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
            <iframe
              src={RUSH.googleFormEmbedUrl}
              title="Rush Interest Form"
              className="w-full"
              height={760}
              loading="lazy"
            >
              Loading form…
            </iframe>
          </div>
        </div>
      </section>

      {/* Rush photos */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-10">Rush Highlights</h2>
          <PhotoGrid folderId={DRIVE_FOLDER_IDS.rush} columns={3} />
        </div>
      </section>
    </>
  )
}
