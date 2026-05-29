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

/** Real chapter photos — everything in the folder except the logo. */
export function excludeLogo(images: DriveImage[]): DriveImage[] {
  return images.filter((img) => !isLogo(img))
}

/** Finds the chapter logo in a folder, or null if none is present. */
export async function fetchLogo(folderId: string): Promise<DriveImage | null> {
  const images = await fetchDriveImages(folderId)
  return images.find(isLogo) ?? null
}
