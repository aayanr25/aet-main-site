import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import SiteLayout from './components/SiteLayout'
import Home from './pages/Home'
import Rush from './pages/Rush'
import Gallery from './pages/Gallery'
import About from './pages/About'
import Newsletters from './pages/Newsletters'
import Brothers from './pages/Brothers'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public pages — wrapped in the shared navbar + footer */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rush" element={<Rush />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/newsletters" element={<Newsletters />} />
        </Route>
        {/* Gated portal — standalone full-screen, no navbar/footer */}
        <Route path="/brothers" element={<Brothers />} />
      </Routes>
    </BrowserRouter>
  )
}
