import type { PhotosApiResponse } from '../../functions/api/photos'

export type DriveImage = PhotosApiResponse['images'][number]

export async function fetchDriveImages(folderId: string): Promise<DriveImage[]> {
  const res = await fetch(`/api/photos?folder=${encodeURIComponent(folderId)}`)
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error: string
    }
    throw new Error(error)
  }
  const { images } = (await res.json()) as PhotosApiResponse
  return images
}

/**
 * The chapter logo lives in a regular photo folder, identified by a filename
 * containing "logo" (e.g. purduechipsi-logo.png). Treating it as a convention
 * means the logo can be swapped in Drive without touching code.
 */
export function isLogo(img: DriveImage): boolean {
  return /logo/i.test(img.name)
}

/**
 * The rush chair's headshot lives in the rush photo folder, identified by a
 * filename containing "33" (e.g. 33-picture.png). Like the logo convention, this
 * lets the photo be swapped in Drive without touching code — and any future "33"
 * image is understood to be the same person.
 */
export function isRushChair(img: DriveImage): boolean {
  return /33/.test(img.name)
}

/** Real chapter photos — everything in the folder except the logo and headshot. */
export function excludeLogo(images: DriveImage[]): DriveImage[] {
  return images.filter((img) => !isLogo(img) && !isRushChair(img))
}

/** Finds the chapter logo in a folder, or null if none is present. */
export async function fetchLogo(folderId: string): Promise<DriveImage | null> {
  const images = await fetchDriveImages(folderId)
  return images.find(isLogo) ?? null
}

/** Finds the rush chair headshot in a folder, or null if none is present. */
export async function fetchRushChair(folderId: string): Promise<DriveImage | null> {
  const images = await fetchDriveImages(folderId)
  return images.find(isRushChair) ?? null
}

export interface RushStatement {
  /** The message body, verbatim, minus the trailing signature line. */
  body: string
  /** The signature line without its leading "- " (e.g. "NAME"), or null. */
  signature: string | null
}

/**
 * Fetches the rush chair's statement (a Google Doc in the rush folder) and
 * splits it into body + signature. The Doc ends with a signature line written
 * as "- NAME"; that last such line becomes the signature and the rest is the
 * body. (Google Docs exports a bulleted line as "* NAME" rather than "- NAME",
 * so both markers are accepted.) Text is otherwise used exactly as written.
 */
export async function fetchRushStatement(folderId: string): Promise<RushStatement> {
  const res = await fetch(`/api/rush-statement?folder=${encodeURIComponent(folderId)}`)
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: string
    }
    throw new Error(error || 'Failed to load statement')
  }
  const { text } = (await res.json()) as { text: string }
  return parseRushStatement(text)
}

/** Splits verbatim Doc text into body + "- NAME" signature. Exported for tests. */
export function parseRushStatement(text: string): RushStatement {
  // Normalize line endings only; preserve the author's spacing and wording.
  const lines = text.replace(/\r\n?/g, '\n').split('\n')

  // The signature is the last non-empty line, expected as "- NAME".
  let sigIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() !== '') {
      sigIndex = i
      break
    }
  }

  // Accept a hyphen, en/em dash, or a bullet (Docs exports a bulleted line as "*").
  const sigMatch = sigIndex >= 0 ? lines[sigIndex].match(/^\s*[-*•–—]\s*(.+?)\s*$/) : null
  if (!sigMatch) {
    // No "- NAME" line found — treat the whole thing as body, no signature.
    return { body: text.replace(/\r\n?/g, '\n').trim(), signature: null }
  }

  const body = lines.slice(0, sigIndex).join('\n').trim()
  return { body, signature: sigMatch[1] }
}
