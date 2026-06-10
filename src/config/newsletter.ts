// Drive folder IDs for the newsletter, kept separate from the per-page photo
// folders in ./photos.ts because these hold PDFs, not images.
//
// PLACEHOLDERS — replace each value with the actual Google Drive folder ID after
// creating the folders under "[DONT MOVE] Website Photos → Newsletter".
// Folder IDs can be found in the Drive URL: drive.google.com/drive/folders/<FOLDER_ID>
export const NEWSLETTER_FOLDER_IDS = {
  current: 'REPLACE_WITH_CURRENT_FOLDER_ID', // Newsletter/Current Drive folder ID
  archive: 'REPLACE_WITH_ARCHIVE_FOLDER_ID', // Newsletter/Archive Drive folder ID
} as const
