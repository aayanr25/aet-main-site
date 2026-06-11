import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

// Shared chrome for the public pages. The Brothers portal renders outside this
// layout so it can be a standalone full-screen experience.
export default function SiteLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
