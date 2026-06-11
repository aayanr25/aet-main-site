import { Link } from 'react-router-dom'

const socials = [
  { label: 'Instagram', href: '#' },
  { label: 'Twitter / X', href: '#' },
  { label: 'LinkedIn', href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-purple text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-gold font-bold text-2xl">ΧΨ</p>
            <p className="mt-1 font-semibold">Chi Psi Fraternity</p>
            <p className="text-white/70 text-sm mt-1">Alpha Epsilon Tau</p>
            <p className="text-white/70 text-sm">Purdue University · Founded 2023</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="font-semibold text-gold mb-3">Quick Links</p>
            <ul className="space-y-1 text-sm text-white/80">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About' },
                { to: '/rush', label: 'Rush' },
                { to: '/gallery', label: 'Gallery' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-gold transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="font-semibold text-gold mb-3">Follow Us</p>
            <ul className="space-y-1 text-sm text-white/80">
              {socials.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center text-xs text-white/50">
          {new Date().getFullYear()} Chi Psi — Alpha Epsilon Tau, Purdue University. All rights reserved.
        </div>

        {/* Subtle, intentionally low-key entry point to the gated Brothers portal */}
        <div className="mt-4 text-center">
          <Link
            to="/brothers"
            className="text-xs text-white/30 no-underline hover:text-white/60 hover:underline transition-colors"
          >
            Brothers
          </Link>
        </div>
      </div>
    </footer>
  )
}
