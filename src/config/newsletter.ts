import { DRIVE_FOLDER_IDS } from './photos'

// Newsletter PDFs live alongside the about-page photos, not in dedicated folders:
//
//  - CURRENT: a PDF in the about folder whose filename contains "Newsletter"
//    (case-insensitive). Drive's "in parents" query returns only direct children,
//    so files inside the Old Newsletters subfolder are excluded automatically.
//  - ARCHIVE: every PDF inside the "Old Newsletters" subfolder of the about folder.
//
// PLACEHOLDER — replace `archive` with the actual Drive folder ID of the
// "Old Newsletters" subfolder. Folder IDs can be found in the Drive URL:
// drive.google.com/drive/folders/<FOLDER_ID>
export const NEWSLETTER_FOLDER_IDS = {
  current: DRIVE_FOLDER_IDS.about, // search the about folder for the current newsletter PDF
  archive: 'RE1v97IUYhLJWJheqfknmpOoRdjfAfFXyK9', // "Old Newsletters" subfolder Drive folder ID
} as const
