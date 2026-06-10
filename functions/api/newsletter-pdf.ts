/// <reference types="@cloudflare/workers-types" />

interface Env {
  GOOGLE_DRIVE_API_KEY: string
}

const CACHE_HEADERS = {
  // PDFs change rarely; an hour at the edge keeps the embed snappy while still
  // picking up a swapped "current" issue reasonably quickly.
  'Cache-Control': 's-maxage=3600',
} as const

/**
 * Streams a Google Drive PDF to the browser, same-origin, so Drive credentials
 * never reach the client. Unlike the image proxy we go through the Drive API's
 * `alt=media` endpoint (one PDF per page load — not the bulk image fetching that
 * triggers Google's anti-bot throttling) and force inline rendering so the
 * browser displays the newsletter rather than downloading it.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const fileId = new URL(context.request.url).searchParams.get('id')
  if (!fileId) {
    return new Response('Missing id parameter', { status: 400 })
  }

  const apiKey = context.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) {
    return new Response('Google Drive API key is not configured', { status: 500 })
  }

  const driveUrl =
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
    `?alt=media&key=${apiKey}`

  let res: Response
  try {
    res = await fetch(driveUrl)
  } catch {
    return new Response('Failed to reach Google Drive API', { status: 502 })
  }

  if (!res.ok) {
    return new Response(`Upstream returned ${res.status}`, { status: res.status })
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      ...CACHE_HEADERS,
    },
  })
}
