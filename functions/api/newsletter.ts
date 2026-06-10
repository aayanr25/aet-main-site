/// <reference types="@cloudflare/workers-types" />

import { NEWSLETTER_FOLDER_IDS } from '../../src/config/newsletter'

interface Env {
  GOOGLE_DRIVE_API_KEY: string
}

interface DriveFile {
  id: string
  name: string
  modifiedTime?: string // RFC3339; used to pick the most recent "current" newsletter
}

interface DriveListResponse {
  files: DriveFile[]
}

export interface NewsletterCurrentResponse {
  pdf: {
    id: string
    name: string
    url: string
  } | null
}

export interface NewsletterArchiveResponse {
  issues: {
    id: string
    name: string
    label: string
    dateLabel: string
    url: string
  }[]
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const
// 60s edge cache: a newly-dropped PDF appears within about a minute. A small JSON
// request per load, so it isn't subject to the throttling the image endpoint hit.
const CACHE = 's-maxage=60'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS })
}

function isPdf(file: DriveFile): boolean {
  return file.name.toLowerCase().endsWith('.pdf')
}

// The active newsletter is flagged purely by its filename containing "Newsletter".
function isNewsletter(file: DriveFile): boolean {
  return file.name.toLowerCase().includes('newsletter')
}

// Same-origin proxy URL so Drive credentials never reach the browser.
function proxyUrl(id: string): string {
  return `/api/newsletter-pdf?id=${id}`
}

// Turns a filename like "2025-09_Fall-Welcome.pdf" into a readable label
// ("Fall Welcome") and a month label ("Sep 2025"). Files without the
// `YYYY-MM_` prefix fall back to the bare filename for the label.
function parseIssue(name: string): { label: string; dateLabel: string } {
  const base = name.replace(/\.pdf$/i, '')
  const match = base.match(/^(\d{4})-(\d{2})_(.*)$/)
  if (!match) {
    return { label: base.replace(/-/g, ' '), dateLabel: '' }
  }
  const [, year, month, rest] = match
  const label = rest
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  const monthName = MONTHS[Number(month) - 1] ?? month
  return { label, dateLabel: `${monthName} ${year}` }
}

// Lists every (non-trashed) file in a Drive folder.
async function listFolder(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
  const fields = encodeURIComponent('files(id,name,modifiedTime)')
  const driveUrl =
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}`

  const res = await fetch(driveUrl)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`Drive API ${res.status}:`, body)
    throw new Error(`Google Drive API error: ${res.status}`)
  }
  const data = (await res.json()) as DriveListResponse
  return data.files ?? []
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const type = new URL(context.request.url).searchParams.get('type')
  if (type !== 'current' && type !== 'archive') {
    return jsonError("Query parameter 'type' must be 'current' or 'archive'", 400)
  }

  const apiKey = context.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) {
    return jsonError('Google Drive API key is not configured', 500)
  }

  const folderId = NEWSLETTER_FOLDER_IDS[type]

  let files: DriveFile[]
  try {
    files = await listFolder(folderId, apiKey)
  } catch {
    return jsonError('Failed to reach Google Drive API', 502)
  }

  const pdfs = files.filter(isPdf)

  if (type === 'current') {
    // Most-recently-modified newsletter PDF wins (normally there's only one;
    // older issues have been moved to the Old Newsletters subfolder).
    const current = pdfs
      .filter(isNewsletter)
      .sort((a, b) => (b.modifiedTime ?? '').localeCompare(a.modifiedTime ?? ''))[0]
    const payload: NewsletterCurrentResponse = {
      pdf: current ? { id: current.id, name: current.name, url: proxyUrl(current.id) } : null,
    }
    return new Response(JSON.stringify(payload), {
      headers: { ...JSON_HEADERS, 'Cache-Control': CACHE },
    })
  }

  // type === 'archive' — every PDF in Old Newsletters, newest first (filenames
  // start with YYYY-MM).
  const sorted = [...pdfs].sort((a, b) => b.name.localeCompare(a.name))
  const payload: NewsletterArchiveResponse = {
    issues: sorted.map((file) => {
      const { label, dateLabel } = parseIssue(file.name)
      return { id: file.id, name: file.name, label, dateLabel, url: proxyUrl(file.id) }
    }),
  }
  return new Response(JSON.stringify(payload), {
    headers: { ...JSON_HEADERS, 'Cache-Control': CACHE },
  })
}
