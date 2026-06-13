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

export interface RushStatementApiResponse {
  /** Full plain-text of the Doc, body + signature line, verbatim. */
  text: string
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS })
}

/**
 * Returns the verbatim text of the rush chair's statement, sourced from the
 * single Google Doc living in the rush Drive folder.
 *
 * Two-step, mirroring the image proxy: use the Drive API (key) only to locate
 * the Doc's file id, then pull its text from Google's public export URL
 * (docs.google.com/.../export?format=txt). That export path needs no API key
 * for an anyone-with-link Doc — the same sharing the rest of the folder uses —
 * and avoids the OAuth that the Drive `files.export` API method requires.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const folderId = new URL(context.request.url).searchParams.get('folder')
  if (!folderId) {
    return jsonError('Missing required query parameter: folder', 400)
  }

  const apiKey = context.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) {
    return jsonError('Google Drive API key is not configured', 500)
  }

  // Find the Google Doc in the folder (first one wins).
  const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.document' and trashed = false`,
  )
  const fields = encodeURIComponent('files(id,name)')
  const listUrl =
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}`

  let listRes: Response
  try {
    listRes = await fetch(listUrl)
  } catch {
    return jsonError('Failed to reach Google Drive API', 502)
  }
  if (!listRes.ok) {
    const body = await listRes.text().catch(() => '')
    console.error(`Drive API ${listRes.status}:`, body)
    return jsonError(`Google Drive API error: ${listRes.status}`, 502)
  }

  const { files } = (await listRes.json()) as DriveListResponse
  const doc = files?.[0]
  if (!doc) {
    return jsonError('No statement document found in the rush folder', 404)
  }

  // Pull the Doc's plain text from the public export endpoint.
  const exportUrl = `https://docs.google.com/document/d/${doc.id}/export?format=txt`
  let docRes: Response
  try {
    docRes = await fetch(exportUrl)
  } catch {
    return jsonError('Failed to reach Google Docs export', 502)
  }
  if (!docRes.ok) {
    return jsonError(`Google Docs export error: ${docRes.status}`, 502)
  }

  // Strip a leading UTF-8 BOM if present; leave all other characters verbatim.
  const text = (await docRes.text()).replace(/^﻿/, '')

  const payload: RushStatementApiResponse = { text }
  return new Response(JSON.stringify(payload), {
    headers: {
      ...JSON_HEADERS,
      // Edge-cache 5 min; background-revalidate so edits show up without a deploy.
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
