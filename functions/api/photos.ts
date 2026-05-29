/// <reference types="@cloudflare/workers-types" />

interface Env {
  GOOGLE_DRIVE_API_KEY: string
}

interface DriveFile {
  id: string
  name: string
}

interface DriveListResponse {
  files: DriveFile[]
}

export interface PhotosApiResponse {
  images: {
    id: string
    name: string
    thumbnailUrl: string
    fullUrl: string
  }[]
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const folderId = new URL(context.request.url).searchParams.get('folder')
  if (!folderId) {
    return jsonError('Missing required query parameter: folder', 400)
  }

  const apiKey = context.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) {
    return jsonError('Google Drive API key is not configured', 500)
  }

  const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
  )
  const fields = encodeURIComponent('files(id,name)')
  const driveUrl =
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}`

  let driveRes: Response
  try {
    driveRes = await fetch(driveUrl)
  } catch {
    return jsonError('Failed to reach Google Drive API', 502)
  }

  if (!driveRes.ok) {
    const body = await driveRes.text().catch(() => '')
    console.error(`Drive API ${driveRes.status}:`, body)
    return jsonError(`Google Drive API error: ${driveRes.status}`, 502)
  }

  const data = (await driveRes.json()) as DriveListResponse

  const payload: PhotosApiResponse = {
    images: (data.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      // Routed through our own function (same-origin) so Drive credentials never
      // reach the browser. Grid thumbnails load smaller; lightbox loads larger.
      thumbnailUrl: `/api/image?id=${f.id}&w=800`,
      fullUrl: `/api/image?id=${f.id}&w=2000`,
    })),
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      ...JSON_HEADERS,
      // Cache at the CDN edge for 5 minutes; browser revalidates in background after 1 min
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
