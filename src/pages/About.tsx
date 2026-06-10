import { useEffect, useState } from 'react'
import { fetchDriveImages, type DriveImage } from '../lib/drive'
import { getExecBoard, type ExecMember } from '../lib/execBoard'
import { DRIVE_FOLDER_IDS } from '../config/photos'
import NewsletterEmbed from '../components/NewsletterEmbed'
import NewsletterArchive from '../components/NewsletterArchive'
import NewsletterSignup from '../components/NewsletterSignup'

/*
 * Every image on this page comes from the "about" Google Drive folder.
 *
 * Executive board names + roles are NEVER hard coded here — they are derived
 * from the Drive filenames by src/lib/execBoard.ts (see that file for the full
 * naming convention). Future execs update the board by editing ONLY the Drive
 * folder: add, remove, or replace a photo named `<Role>-<First>_<Last>.<ext>`
 * and this page updates automatically. See README.md for the full guide.
 */

// Finds a single image by filename prefix (extensions vary: .JPG / .jpg / .png).
function pick(images: DriveImage[], filePrefix: string): DriveImage | undefined {
  return images.find((img) => img.name.toLowerCase().startsWith(filePrefix.toLowerCase()))
}

// Single exec board card — portrait orientation: photo on top, name + role
// stacked beneath. Name + role are passed in already-formatted.
function ExecCard({ member }: { member: ExecMember }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      {/* Photo — fills the top, portrait aspect ratio */}
      <div className="aspect-[3/4] overflow-hidden bg-purple/5">
        {member.image.thumbnailUrl ? (
          <img
            src={member.image.thumbnailUrl}
            alt={`${member.name}, ${member.role}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-serif text-gold/30 text-4xl">
            ΧΨ
          </div>
        )}
      </div>
      {/* Name + role */}
      <div className="flex-1 flex flex-col justify-center text-center px-3 py-4">
        <p className="font-bold text-purple text-sm leading-tight">{member.name}</p>
        <p className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-gold">
          {member.role}
        </p>
      </div>
    </div>
  )
}

export default function About() {
  const [images, setImages] = useState<DriveImage[]>([])

  useEffect(() => {
    let active = true
    fetchDriveImages(DRIVE_FOLDER_IDS.about)
      .then((imgs) => active && setImages(imgs))
      .catch(() => active && setImages([]))
    return () => {
      active = false
    }
  }, [])

  // FOUNDER PORTRAIT — pulls from Google Drive file: philip_spencer.jpg
  // (Repositioned here from the former bottom "The Brotherhood" section.)
  const founder = pick(images, 'philip_spencer')

  // EXEC BOARD — names + roles derived from filenames, never hard coded.
  const execBoard = getExecBoard(images)

  return (
    <>
      {/* Hero */}
      <section className="bg-purple text-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gold font-semibold tracking-widest text-sm uppercase mb-4">Who We Are</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About Chi Psi</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Alpha Epsilon Tau is one of the newest chapters in the Chi Psi national fraternity — built from the ground up by Purdue students who believed in something different.
          </p>
        </div>
      </section>

      {/* Story — founder portrait repositioned here, beside the founding story */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {founder && (
              <figure>
                <img
                  src={founder.thumbnailUrl}
                  alt="Philip Spencer, founder of Chi Psi"
                  className="rounded-2xl w-full aspect-[4/5] object-cover shadow-lg ring-1 ring-gray-200"
                />
                <figcaption className="mt-3 text-center text-sm text-gray-500 italic">
                  Philip Spencer · Founder of Chi Psi, 1841
                </figcaption>
              </figure>
            )}
            <div className={founder ? '' : 'md:col-span-2'}>
              <h2 className="section-heading mb-6">Our Story</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Chi Psi was founded nationally in 1841 at Union College and has grown to include chapters at leading universities across the United States. Alpha Epsilon Tau was chartered in 2023 at Purdue University.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We were built by a group of Purdue students who wanted to create a fraternity defined by genuine brotherhood, academic achievement, and a commitment to making a positive impact — on campus and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-[#faf8f3]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="section-heading mb-6">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
            To create and maintain an enduring society that encourages the sharing of traditions and values, respect for oneself and others, and responsibility to the university and community. A selective association of diverse individuals, Chi Psi is dedicated to the
cultivation of a unique environment that instills a lifelong commitment to the Brotherhood. 
          </p>
          <div className="bg-white border-l-4 border-purple rounded-r-xl p-6 text-left">
            <p className="text-purple font-serif italic text-xl leading-relaxed">
              "The bond of Chi Psi is brotherhood — deep, enduring, and built on shared values."
            </p>
          </div>
        </div>
      </section>

      {/* Executive Board — rendered dynamically from parsed Drive filenames */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading">Executive Board</h2>
            <p className="section-subheading mx-auto">Meet the brothers leading our Alpha.</p>
          </div>
          {execBoard.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-5">
              {execBoard.map((member) => (
                <ExecCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm">
              Executive board photos will appear here once added to the Drive folder.
            </p>
          )}
        </div>
      </section>

      {/* Newsletter — current issue embed + archive of past issues */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="eyebrow eyebrow--both mb-4">Newsletter</p>
            <h2 className="section-heading">AET Newsletter</h2>
            <p className="section-subheading mx-auto">
              Stay up to date with our latest news and updates.
            </p>
          </div>
          <NewsletterEmbed />
          <NewsletterArchive />
        </div>
      </section>

      {/* Newsletter signup — join the mailing list */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-purple">Stay in the Loop</h3>
          <p className="section-subheading mx-auto mb-8">
            Enter your email to join our mailing list and receive future newsletters directly.
          </p>
          <NewsletterSignup />
        </div>
      </section>
    </>
  )
}
