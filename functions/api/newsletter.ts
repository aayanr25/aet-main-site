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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

// Lookup for parsing filenames — accepts full month names and 3-letter
// abbreviations, case-insensitively.
const MONTH_INDEX: Record<string, number> = {}
MONTH_NAMES.forEach((name, i) => {
  MONTH_INDEX[name.toLowerCase()] = i
  MONTH_INDEX[name.slice(0, 3).toLowerCase()] = i
})

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

// Parses the newsletter naming convention "[Month] [Year] Newsletter.pdf"
// (e.g. "March 2025 Newsletter.pdf") into a display label ("March 2025") and a
// chronological sort key (higher = newer). Filenames that don't match fall back
// to the bare filename and sort to the bottom.
function parseIssue(name: string): { label: string; dateLabel: string; sortKey: number } {
  const base = name.replace(/\.pdf$/i, '').trim()
  const match = base.match(/([A-Za-z]+)\s+(\d{4})/)
  const monthIdx = match ? MONTH_INDEX[match[1].toLowerCase()] : undefined
  if (match && monthIdx !== undefined) {
    const year = Number(match[2])
    return { label: `${MONTH_NAMES[monthIdx]} ${year}`, dateLabel: '', sortKey: year * 12 + monthIdx }
  }
  return { label: base, dateLabel: '', sortKey: -1 }
}

// Lists every (non-trashed) file in a Drive folder.
async function listFolder(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
  const fields = encodeURIComponent('files(id,name,modifiedTime)')
  const driveUrl =
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}`

  let res: Response
  try {
    res = await fetch(driveUrl)
  } catch {
    throw new Error('Failed to reach Google Drive API')
  }
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
  } catch (err) {
    // Surface the real cause (e.g. "Google Drive API error: 404" when the folder
    // ID is wrong or the folder isn't shared publicly) instead of always blaming
    // the network.
    return jsonError(err instanceof Error ? err.message : 'Failed to reach Google Drive API', 502)
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

  // type === 'archive' — every PDF in Old Newsletters, newest first by the
  // "[Month] [Year] Newsletter.pdf" naming convention.
  const sorted = pdfs
    .map((file) => ({ file, ...parseIssue(file.name) }))
    .sort((a, b) => b.sortKey - a.sortKey || b.file.name.localeCompare(a.file.name))
  const payload: NewsletterArchiveResponse = {
    issues: sorted.map(({ file, label, dateLabel }) => ({
      id: file.id,
      name: file.name,
      label,
      dateLabel,
      url: proxyUrl(file.id),
    })),
  }
  return new Response(JSON.stringify(payload), {
    headers: { ...JSON_HEADERS, 'Cache-Control': CACHE },
  })
}
