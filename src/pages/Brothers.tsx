import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fetchLogo } from '../lib/drive'
import { DRIVE_FOLDER_IDS } from '../config/photos'
import { BROTHERS_CONFIG } from '../config/brothers'
import { fetchMembers, matchesMember, verifyPasscode, type Member } from '../lib/brothers'

type Step = 'name' | 'passcode' | 'portal'

// Shared input styling for the name + passcode fields — translucent on purple.
const INPUT_CLASS =
  'w-full min-h-[52px] px-5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors disabled:opacity-60'

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

// Portal link card — translucent variant of the site's card style, on purple.
function PortalCard({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center text-center rounded-2xl bg-white/5 border border-white/15 shadow-sm p-8 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
    >
      <span className="text-gold">{icon}</span>
      <p className="mt-4 font-bold text-lg">{title}</p>
      <p className="mt-1 text-sm text-white/60">{description}</p>
    </a>
  )
}

export default function Brothers() {
  const [step, setStep] = useState<Step>('name')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Roster (name-entry step)
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [rosterError, setRosterError] = useState(false)

  // Name entry
  const [nameInput, setNameInput] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  // Passcode entry
  const [passcodeInput, setPasscodeInput] = useState('')
  const [passcodeError, setPasscodeError] = useState<string | null>(null)
  const [passcodeLoading, setPasscodeLoading] = useState(false)
  const passcodeRef = useRef<HTMLInputElement>(null)

  // On load: skip straight to the portal if this session is already authed.
  // Otherwise fetch the roster once for client-side name validation.
  useEffect(() => {
    const saved = sessionStorage.getItem(BROTHERS_CONFIG.sessionStorageKey)
    if (saved) {
      setDisplayName(saved)
      setStep('portal')
      return
    }

    let active = true
    fetchMembers()
      .then((m) => active && setMembers(m))
      .catch(() => active && setRosterError(true))
      .finally(() => active && setMembersLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Logo, fetched the same way the navbar does.
  useEffect(() => {
    let active = true
    fetchLogo(DRIVE_FOLDER_IDS.home)
      .then((logo) => active && setLogoUrl(logo?.fullUrl ?? null))
      .catch(() => active && setLogoUrl(null))
    return () => {
      active = false
    }
  }, [])

  function handleNameSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return
    if (matchesMember(trimmed, members)) {
      setDisplayName(trimmed)
      setNameError(null)
      setStep('passcode')
    } else {
      setNameError('Name not found. Try your nickname or full name.')
      nameRef.current?.focus()
    }
  }

  async function handlePasscodeSubmit(e: FormEvent) {
    e.preventDefault()
    setPasscodeLoading(true)
    setPasscodeError(null)
    try {
      const valid = await verifyPasscode(passcodeInput)
      if (valid) {
        sessionStorage.setItem(BROTHERS_CONFIG.sessionStorageKey, displayName)
        setStep('portal')
      } else {
        setPasscodeError('Incorrect passcode. Try again.')
        setPasscodeInput('')
        passcodeRef.current?.focus()
      }
    } catch {
      setPasscodeError('Something went wrong. Please try again.')
    } finally {
      setPasscodeLoading(false)
    }
  }

  // Friendly greeting — only the first word of what they typed.
  const firstName = displayName.split(' ')[0]

  return (
    <div className="min-h-screen bg-purple text-white flex flex-col">
      {/* Logo, top-left — same as the navbar */}
      <header className="px-6 py-5">
        <Link
          to="/"
          aria-label="Chi Psi — Alpha Epsilon Tau, home"
          className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Chi Psi Alpha Epsilon Tau" className="h-16 w-auto object-contain" />
          ) : (
            <span className="font-serif text-gold font-bold text-2xl tracking-wide">ΧΨ</span>
          )}
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-24">
        {step === 'name' && (
          <form onSubmit={handleNameSubmit} className="w-full max-w-md text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Brothers Portal</h1>
            <p className="text-white/70 mb-8">Welcome back. Enter your name to continue.</p>

            {rosterError ? (
              <p className="text-sm text-red-300">
                Couldn't load the roster right now. Please try again later.
              </p>
            ) : (
              <>
                <div className="relative">
                  <input
                    ref={nameRef}
                    autoFocus
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    disabled={membersLoading}
                    placeholder="First name, last name, or nickname"
                    aria-label="Your name"
                    className={INPUT_CLASS}
                  />
                  {membersLoading && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2">
                      <Spinner />
                    </span>
                  )}
                </div>
                {nameError && <p className="mt-3 text-sm text-red-300">{nameError}</p>}
                <button type="submit" disabled={membersLoading} className="btn-primary mt-6 w-full">
                  Continue
                </button>
              </>
            )}
          </form>
        )}

        {step === 'passcode' && (
          <form onSubmit={handlePasscodeSubmit} className="w-full max-w-md text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome, {firstName}.</h1>
            <p className="text-white/70 mb-8">Enter the Alpha passcode to continue.</p>
            <input
              ref={passcodeRef}
              autoFocus
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Alpha passcode"
              aria-label="Alpha passcode"
              className={INPUT_CLASS}
            />
            {passcodeError && <p className="mt-3 text-sm text-red-300">{passcodeError}</p>}
            <button type="submit" disabled={passcodeLoading} className="btn-primary mt-6 w-full">
              {passcodeLoading ? 'Checking…' : 'Enter'}
            </button>
          </form>
        )}

        {step === 'portal' && (
          <div className="w-full max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-10">Welcome, {displayName}.</h1>
            <div className="grid sm:grid-cols-2 gap-6">
              <PortalCard
                icon={<BagIcon />}
                title="Apparel"
                description="Browse and order Alpha apparel."
                href="https://apparel.purduechipsi.com"
              />
              <PortalCard
                icon={<BookIcon />}
                title="Alpha History"
                description="Explore the story of Alpha Epsilon Tau."
                href="https://history.purduechipsi.com"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
