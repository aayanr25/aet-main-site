/// <reference types="@cloudflare/workers-types" />

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
} as const

const DEFAULT_WIDTH = 1200
const MAX_WIDTH = 2400

/**
 * Streams a Google Drive image to the browser, same-origin.
 *
 * We fetch from Google's public image CDN (lh3.googleusercontent.com) rather
 * than the Drive API's `alt=media` endpoint. The Drive API content path is
 * rate-limited by Google's anti-bot protection when a page requests many images
 * at once (e.g. the gallery), returning 403 "automated queries" pages. The CDN
 * path needs no API key, serves any publicly-shared file, and isn't throttled
 * that way. The `=wN` suffix sizes the image (thumbnails vs. full view).
 */
export const onRequest: PagesFunction = async (context) => {
  const { searchParams } = new URL(context.request.url)
  const fileId = searchParams.get('id')
  if (!fileId) {
    return new Response('Missing id parameter', { status: 400 })
  }

  const requested = Number(searchParams.get('w'))
  const width =
    Number.isFinite(requested) && requested > 0
      ? Math.min(Math.floor(requested), MAX_WIDTH)
      : DEFAULT_WIDTH

  const cdnUrl = `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w${width}`

  let res: Response
  try {
    res = await fetch(cdnUrl)
  } catch {
    return new Response('Failed to reach image CDN', { status: 502 })
  }

  if (!res.ok) {
    return new Response(`Upstream returned ${res.status}`, { status: res.status })
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      ...CACHE_HEADERS,
    },
  })
}
