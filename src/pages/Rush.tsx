import PhotoGrid from '../components/PhotoGrid'
import { DRIVE_FOLDER_IDS } from '../config/photos'

const steps = [
  { num: '01', title: 'Attend Rush Events', body: 'Come to our open rush events to meet the brothers and get a feel for our chapter culture.' },
  { num: '02', title: 'Get to Know Us', body: 'Hang out, ask questions, and let us get to know you — rush is a two-way conversation.' },
  { num: '03', title: 'Receive a Bid', body: "If it's a mutual fit, you'll receive a formal bid to join Chi Psi Alpha Epsilon Tau." },
  { num: '04', title: 'Join the Brotherhood', body: 'Accept your bid and begin your journey as a Chi Psi pledge and future brother.' },
]

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

      {/* Process */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading">The Rush Process</h2>
            <p className="section-subheading mx-auto">Here's what to expect when you rush Chi Psi.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ num, title, body }) => (
              <div key={num} className="relative p-8 rounded-2xl border border-gray-200 hover:border-gold hover:shadow-md transition-all duration-200">
                <div className="text-5xl font-black text-gray-100 mb-3 leading-none">{num}</div>
                <h3 className="text-purple font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interest Form */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-heading">Express Your Interest</h2>
            <p className="section-subheading mx-auto">
              Fill out the form below and a brother will be in touch before rush season.
            </p>
          </div>

          {/* Google Form embed — replace the src with your actual form embed URL */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
            <iframe
              src="https://docs.google.com/forms/d/e/PLACEHOLDER_FORM_ID/viewform?embedded=true"
              width="100%"
              height="700"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title="Rush Interest Form"
              className="w-full"
            >
              Loading form…
            </iframe>
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">
            Replace the iframe <code>src</code> in <code>src/pages/Rush.tsx</code> with your Google Form embed URL.
          </p>
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
