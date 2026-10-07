// Where to get the Enconvo Android app. It is a beta installed from an APK
// rather than Google Play. The Mac app's Connections card links to the same
// page (modules/companion/src/mac/android_app.ts). Change both together.

/** The download page. The QR code opens it on the phone. */
export const ANDROID_APP_PAGE_URL = 'https://enconvo.com/android'

/** Always the latest release; each build is uploaded over it. */
export const ANDROID_APP_APK_URL =
  'https://file.enconvo.com/android/Enconvo-Companion.apk'

export const ANDROID_APP_VERSION = '1.3.0'

/** The app's minSdk is 28. */
export const ANDROID_APP_MIN_ANDROID_VERSION = '9'

/** Homepage anchor of the Android panel in the mobile app card. */
export const ANDROID_APP_SECTION_ID = 'android-app'

/**
 * QR code for ANDROID_APP_PAGE_URL, so a visitor on a computer can open the
 * page on the phone. Generated with the companion module's pairingQr(): the
 * viewBox is `0 0 size size` and `path` draws the dark modules. Regenerate it
 * when the link changes.
 */
export const ANDROID_APP_QR = {
  size: 33,
  path: 'M2 2h7v1h-7zM10 2h1v1h-1zM13 2h3v1h-3zM17 2h2v1h-2zM20 2h1v1h-1zM24 2h7v1h-7zM2 3h1v1h-1zM8 3h1v1h-1zM14 3h1v1h-1zM17 3h1v1h-1zM19 3h2v1h-2zM24 3h1v1h-1zM30 3h1v1h-1zM2 4h1v1h-1zM4 4h3v1h-3zM8 4h1v1h-1zM11 4h5v1h-5zM18 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM26 4h3v1h-3zM30 4h1v1h-1zM2 5h1v1h-1zM4 5h3v1h-3zM8 5h1v1h-1zM12 5h1v1h-1zM14 5h1v1h-1zM16 5h2v1h-2zM19 5h1v1h-1zM24 5h1v1h-1zM26 5h3v1h-3zM30 5h1v1h-1zM2 6h1v1h-1zM4 6h3v1h-3zM8 6h1v1h-1zM10 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h5v1h-5zM24 6h1v1h-1zM26 6h3v1h-3zM30 6h1v1h-1zM2 7h1v1h-1zM8 7h1v1h-1zM10 7h1v1h-1zM12 7h1v1h-1zM14 7h1v1h-1zM18 7h2v1h-2zM24 7h1v1h-1zM30 7h1v1h-1zM2 8h7v1h-7zM10 8h1v1h-1zM12 8h1v1h-1zM14 8h1v1h-1zM16 8h1v1h-1zM18 8h1v1h-1zM20 8h1v1h-1zM22 8h1v1h-1zM24 8h7v1h-7zM12 9h1v1h-1zM14 9h1v1h-1zM19 9h4v1h-4zM3 10h7v1h-7zM11 10h1v1h-1zM13 10h1v1h-1zM17 10h2v1h-2zM21 10h1v1h-1zM25 10h2v1h-2zM30 10h1v1h-1zM2 11h1v1h-1zM4 11h1v1h-1zM7 11h1v1h-1zM11 11h4v1h-4zM17 11h1v1h-1zM19 11h10v1h-10zM30 11h1v1h-1zM3 12h1v1h-1zM7 12h3v1h-3zM12 12h1v1h-1zM14 12h1v1h-1zM17 12h1v1h-1zM19 12h1v1h-1zM22 12h3v1h-3zM27 12h2v1h-2zM2 13h4v1h-4zM10 13h3v1h-3zM23 13h3v1h-3zM27 13h1v1h-1zM29 13h1v1h-1zM5 14h2v1h-2zM8 14h2v1h-2zM11 14h1v1h-1zM14 14h3v1h-3zM18 14h2v1h-2zM21 14h1v1h-1zM23 14h1v1h-1zM25 14h1v1h-1zM28 14h3v1h-3zM2 15h2v1h-2zM6 15h2v1h-2zM9 15h1v1h-1zM11 15h2v1h-2zM14 15h5v1h-5zM20 15h5v1h-5zM26 15h2v1h-2zM29 15h2v1h-2zM3 16h2v1h-2zM8 16h3v1h-3zM12 16h3v1h-3zM17 16h2v1h-2zM20 16h1v1h-1zM22 16h1v1h-1zM25 16h1v1h-1zM2 17h1v1h-1zM7 17h1v1h-1zM11 17h2v1h-2zM15 17h1v1h-1zM18 17h1v1h-1zM22 17h2v1h-2zM26 17h2v1h-2zM30 17h1v1h-1zM2 18h4v1h-4zM8 18h3v1h-3zM13 18h1v1h-1zM20 18h1v1h-1zM27 18h3v1h-3zM2 19h1v1h-1zM4 19h1v1h-1zM7 19h1v1h-1zM10 19h10v1h-10zM21 19h2v1h-2zM24 19h7v1h-7zM2 20h1v1h-1zM4 20h2v1h-2zM8 20h3v1h-3zM13 20h1v1h-1zM15 20h1v1h-1zM19 20h1v1h-1zM22 20h1v1h-1zM24 20h4v1h-4zM2 21h1v1h-1zM5 21h2v1h-2zM9 21h1v1h-1zM13 21h2v1h-2zM16 21h1v1h-1zM18 21h1v1h-1zM20 21h3v1h-3zM24 21h1v1h-1zM26 21h1v1h-1zM30 21h1v1h-1zM2 22h1v1h-1zM5 22h1v1h-1zM8 22h1v1h-1zM10 22h5v1h-5zM16 22h1v1h-1zM19 22h1v1h-1zM21 22h6v1h-6zM28 22h3v1h-3zM10 23h1v1h-1zM15 23h2v1h-2zM19 23h1v1h-1zM22 23h1v1h-1zM26 23h2v1h-2zM29 23h2v1h-2zM2 24h7v1h-7zM10 24h1v1h-1zM15 24h1v1h-1zM17 24h3v1h-3zM21 24h2v1h-2zM24 24h1v1h-1zM26 24h1v1h-1zM2 25h1v1h-1zM8 25h1v1h-1zM10 25h3v1h-3zM14 25h3v1h-3zM18 25h5v1h-5zM26 25h2v1h-2zM29 25h2v1h-2zM2 26h1v1h-1zM4 26h3v1h-3zM8 26h1v1h-1zM10 26h3v1h-3zM18 26h1v1h-1zM22 26h7v1h-7zM30 26h1v1h-1zM2 27h1v1h-1zM4 27h3v1h-3zM8 27h1v1h-1zM10 27h4v1h-4zM15 27h1v1h-1zM17 27h1v1h-1zM20 27h4v1h-4zM25 27h1v1h-1zM27 27h2v1h-2zM2 28h1v1h-1zM4 28h3v1h-3zM8 28h1v1h-1zM10 28h2v1h-2zM16 28h4v1h-4zM21 28h9v1h-9zM2 29h1v1h-1zM8 29h1v1h-1zM10 29h1v1h-1zM13 29h1v1h-1zM16 29h2v1h-2zM20 29h1v1h-1zM22 29h2v1h-2zM26 29h2v1h-2zM29 29h1v1h-1zM2 30h7v1h-7zM11 30h2v1h-2zM17 30h1v1h-1zM19 30h1v1h-1zM21 30h1v1h-1zM23 30h2v1h-2zM26 30h1v1h-1zM28 30h1v1h-1z',
}
