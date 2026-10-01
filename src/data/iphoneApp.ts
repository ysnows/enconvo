// Where to get the Enconvo iPhone app. It is in public beta on TestFlight, the
// same link the Mac app shows under Settings → Connections
// (modules/companion/src/mac/iphone_app.ts). Change both together.

export const IPHONE_APP_TESTFLIGHT_URL = 'https://testflight.apple.com/join/MJQuEN28'

/** Homepage anchor of the iPhone app card; the hero's iPhone button scrolls to it. */
export const IPHONE_APP_SECTION_ID = 'iphone-app'

/**
 * QR code for IPHONE_APP_TESTFLIGHT_URL, so a visitor on a Mac can scan it with
 * the iPhone camera. Generated with the companion module's pairingQr(): the
 * viewBox is `0 0 size size` and `path` draws the dark modules. Regenerate it
 * when the link changes.
 */
export const IPHONE_APP_QR = {
  size: 33,
  path: 'M2 2h7v1h-7zM10 2h5v1h-5zM16 2h7v1h-7zM24 2h7v1h-7zM2 3h1v1h-1zM8 3h1v1h-1zM10 3h1v1h-1zM13 3h2v1h-2zM16 3h1v1h-1zM19 3h2v1h-2zM22 3h1v1h-1zM24 3h1v1h-1zM30 3h1v1h-1zM2 4h1v1h-1zM4 4h3v1h-3zM8 4h1v1h-1zM11 4h2v1h-2zM15 4h4v1h-4zM21 4h1v1h-1zM24 4h1v1h-1zM26 4h3v1h-3zM30 4h1v1h-1zM2 5h1v1h-1zM4 5h3v1h-3zM8 5h1v1h-1zM10 5h3v1h-3zM15 5h2v1h-2zM19 5h1v1h-1zM22 5h1v1h-1zM24 5h1v1h-1zM26 5h3v1h-3zM30 5h1v1h-1zM2 6h1v1h-1zM4 6h3v1h-3zM8 6h1v1h-1zM11 6h2v1h-2zM18 6h2v1h-2zM21 6h1v1h-1zM24 6h1v1h-1zM26 6h3v1h-3zM30 6h1v1h-1zM2 7h1v1h-1zM8 7h1v1h-1zM12 7h1v1h-1zM15 7h2v1h-2zM20 7h2v1h-2zM24 7h1v1h-1zM30 7h1v1h-1zM2 8h7v1h-7zM10 8h1v1h-1zM12 8h1v1h-1zM14 8h1v1h-1zM16 8h1v1h-1zM18 8h1v1h-1zM20 8h1v1h-1zM22 8h1v1h-1zM24 8h7v1h-7zM10 9h1v1h-1zM18 9h3v1h-3zM22 9h1v1h-1zM2 10h1v1h-1zM4 10h2v1h-2zM7 10h3v1h-3zM13 10h1v1h-1zM15 10h5v1h-5zM21 10h2v1h-2zM24 10h1v1h-1zM27 10h1v1h-1zM29 10h2v1h-2zM2 11h3v1h-3zM6 11h1v1h-1zM11 11h2v1h-2zM14 11h1v1h-1zM17 11h10v1h-10zM30 11h1v1h-1zM7 12h2v1h-2zM11 12h1v1h-1zM14 12h1v1h-1zM18 12h1v1h-1zM20 12h1v1h-1zM23 12h1v1h-1zM25 12h1v1h-1zM28 12h2v1h-2zM6 13h2v1h-2zM14 13h4v1h-4zM21 13h1v1h-1zM25 13h1v1h-1zM30 13h1v1h-1zM2 14h2v1h-2zM5 14h1v1h-1zM8 14h1v1h-1zM14 14h1v1h-1zM16 14h1v1h-1zM19 14h1v1h-1zM25 14h1v1h-1zM27 14h2v1h-2zM3 15h1v1h-1zM5 15h2v1h-2zM12 15h2v1h-2zM15 15h3v1h-3zM19 15h1v1h-1zM21 15h1v1h-1zM24 15h1v1h-1zM28 15h3v1h-3zM4 16h1v1h-1zM6 16h3v1h-3zM10 16h3v1h-3zM16 16h1v1h-1zM18 16h2v1h-2zM21 16h1v1h-1zM23 16h1v1h-1zM25 16h2v1h-2zM28 16h3v1h-3zM2 17h1v1h-1zM4 17h3v1h-3zM11 17h2v1h-2zM18 17h1v1h-1zM21 17h3v1h-3zM26 17h1v1h-1zM29 17h1v1h-1zM6 18h1v1h-1zM8 18h1v1h-1zM10 18h1v1h-1zM15 18h3v1h-3zM20 18h4v1h-4zM26 18h2v1h-2zM29 18h1v1h-1zM3 19h1v1h-1zM5 19h2v1h-2zM9 19h2v1h-2zM12 19h6v1h-6zM19 19h1v1h-1zM25 19h1v1h-1zM27 19h3v1h-3zM2 20h1v1h-1zM4 20h5v1h-5zM13 20h3v1h-3zM17 20h3v1h-3zM23 20h4v1h-4zM28 20h1v1h-1zM4 21h2v1h-2zM9 21h2v1h-2zM14 21h1v1h-1zM16 21h1v1h-1zM19 21h2v1h-2zM23 21h1v1h-1zM28 21h1v1h-1zM3 22h1v1h-1zM7 22h6v1h-6zM14 22h1v1h-1zM17 22h12v1h-12zM10 23h1v1h-1zM15 23h2v1h-2zM18 23h5v1h-5zM26 23h5v1h-5zM2 24h7v1h-7zM10 24h3v1h-3zM16 24h1v1h-1zM18 24h5v1h-5zM24 24h1v1h-1zM26 24h2v1h-2zM29 24h1v1h-1zM2 25h1v1h-1zM8 25h1v1h-1zM10 25h1v1h-1zM15 25h1v1h-1zM17 25h1v1h-1zM20 25h1v1h-1zM22 25h1v1h-1zM26 25h2v1h-2zM2 26h1v1h-1zM4 26h3v1h-3zM8 26h1v1h-1zM11 26h1v1h-1zM13 26h1v1h-1zM19 26h2v1h-2zM22 26h5v1h-5zM28 26h3v1h-3zM2 27h1v1h-1zM4 27h3v1h-3zM8 27h1v1h-1zM10 27h1v1h-1zM15 27h4v1h-4zM22 27h2v1h-2zM25 27h3v1h-3zM30 27h1v1h-1zM2 28h1v1h-1zM4 28h3v1h-3zM8 28h1v1h-1zM10 28h2v1h-2zM18 28h5v1h-5zM25 28h1v1h-1zM28 28h1v1h-1zM30 28h1v1h-1zM2 29h1v1h-1zM8 29h1v1h-1zM11 29h1v1h-1zM15 29h1v1h-1zM22 29h1v1h-1zM26 29h2v1h-2zM29 29h1v1h-1zM2 30h7v1h-7zM10 30h4v1h-4zM15 30h3v1h-3zM20 30h5v1h-5zM27 30h1v1h-1zM29 30h1v1h-1z',
}
