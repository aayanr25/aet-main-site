import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router preserves scroll position across route changes. This resets the
// scroll to the top of the page whenever the path changes, so navbar links
// always land the user at the top of the destination page.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
