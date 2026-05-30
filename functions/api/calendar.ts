/// <reference types="@cloudflare/workers-types" />

interface Env {
  GOOGLE_DRIVE_API_KEY: string
}

// ~60s edge cache: updates appear within about a minute while shielding the
// Sheets API from per-visitor load. A single small JSON request per load (not
// bulk binary like image downloads), so it isn't subject to the throttling the
// photo content endpoint hit.
const CACHE = 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { searchParams } = new URL(context.request.url)
  const id = searchParams.get('id')
  const tab = searchParams.get('tab') || 'Sheet1'
  if (!id) {
    return jsonError('Missing required query parameter: id', 400)
  }

  const apiKey = context.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) {
    return jsonError('Google API key is not configured', 500)
  }

  // The range is just the tab name, which returns all non-empty cells of that tab.
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}` +
    `/values/${encodeURIComponent(tab)}?key=${encodeURIComponent(apiKey)}`

  let res: Response
  try {
    res = await fetch(url)
  } catch {
    return jsonError('Failed to reach Google Sheets API', 502)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`Sheets API ${res.status}:`, body)
    return jsonError(`Google Sheets API error: ${res.status}`, 502)
  }

  const data = (await res.json()) as { values?: string[][] }
  return new Response(JSON.stringify({ values: data.values ?? [] }), {
    headers: { ...JSON_HEADERS, 'Cache-Control': CACHE },
  })
}
