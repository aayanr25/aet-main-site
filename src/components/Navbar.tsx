import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { fetchLogo } from '../lib/drive'
import { DRIVE_FOLDER_IDS } from '../config/photos'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/rush', label: 'Rush' },
  { to: '/gallery', label: 'Gallery' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchLogo(DRIVE_FOLDER_IDS.home)
      .then((logo) => active && setLogoUrl(logo?.fullUrl ?? null))
      .catch(() => active && setLogoUrl(null))
    return () => {
      active = false
    }
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-sm tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-purple rounded ${
      isActive ? 'text-gold' : 'text-white/70 hover:text-white'
    }`

  return (
    <nav className="bg-purple/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto pl-1 sm:pl-2 pr-4 sm:pr-6 lg:pr-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo — the only thing in the top-left */}
          <NavLink
            to="/"
            className="shrink-0 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
            aria-label="Chi Psi — Alpha Epsilon Tau, home"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Chi Psi Alpha Epsilon Tau"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            ) : (
              // Fallback until the logo loads (or if none is found in Drive)
              <span className="font-serif text-gold font-bold text-2xl tracking-wide">ΧΨ</span>
            )}
          </NavLink>

          {/* Desktop links — minimalist, generous spacing */}
          <div className="hidden md:flex items-center gap-10">
            {links.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {label}
                    <span
                      className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2 rounded-md hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <div
              className={`w-6 h-px bg-white transition-transform duration-300 ${
                open ? 'translate-y-[5px] rotate-45' : ''
              }`}
            />
            <div
              className={`w-6 h-px bg-white my-1 transition-opacity duration-200 ${
                open ? 'opacity-0' : ''
              }`}
            />
            <div
              className={`w-6 h-px bg-white transition-transform duration-300 ${
                open ? '-translate-y-[5px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-1 animate-fade-in">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-2 py-3 text-sm tracking-wide transition-colors duration-150 ${
                  isActive ? 'text-gold' : 'text-white/70 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
