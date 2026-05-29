// Replace each value with the actual Google Drive folder ID for that page.
// Folder IDs can be found in the Drive URL: drive.google.com/drive/folders/<FOLDER_ID>
export const DRIVE_FOLDER_IDS = {
  home: '1vh_6qMf2ClzUdk0VZQ9-lIzwiUB60xGI',
  rush: '1L3kUtkqgmQW7swp01QqrMVHb9Ndtp0vT',
  gallery: '1plhx1WNBP1U8vdEzxeOQmVGpg1Rwp9hA',
  about: '1MjKTgePFa6I1RLOAceIIe_6ffEX1b8vr',
} as const

export type PhotoPage = keyof typeof DRIVE_FOLDER_IDS
