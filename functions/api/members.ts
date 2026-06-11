/// <reference types="@cloudflare/workers-types" />

import { BROTHERS_CONFIG } from '../../src/config/brothers'

interface Env {
  GOOGLE_DRIVE_API_KEY: string
}

// Minimal shape — only what's needed to validate a typed name client-side.
export interface Member {
  first: string
  last: string
  nickname: string
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const
// 5-minute edge cache: the roster changes rarely.
const CACHE = 's-maxage=300'

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) {
    return jsonError('Failed to load roster', 500)
  }

  // The range is just the tab name, which returns all non-empty cells of that tab.
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(BROTHERS_CONFIG.rosterSheetId)}` +
    `/values/${encodeURIComponent(BROTHERS_CONFIG.rosterSheetTab)}?key=${encodeURIComponent(apiKey)}`

  let res: Response
  try {
    res = await fetch(url)
  } catch {
    return jsonError('Failed to load roster', 500)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`Sheets API ${res.status}:`, body)
    return jsonError('Failed to load roster', 500)
  }

  const data = (await res.json()) as { values?: string[][] }
  const rows = data.values ?? []

  // Row 0 is the header (First | Last | Nickname); skip it.
  const members: Member[] = rows.slice(1).reduce<Member[]>((acc, row) => {
    const first = row[0]?.trim() ?? ''
    const last = row[1]?.trim() ?? ''
    const nickname = row[2]?.trim() ?? ''
    if (first || last) {
      acc.push({ first, last, nickname })
    }
    return acc
  }, [])

  return new Response(JSON.stringify(members), {
    headers: { ...JSON_HEADERS, 'Cache-Control': CACHE },
  })
}
