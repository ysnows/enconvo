// Renders the hero aurora's blurred "bloom" ribbons to src/images/hero-aurora-bloom.webp.
// Run after changing the ribbons in src/components/HeroBackdrop.tsx: node scripts/render-hero-bloom.cjs
//
// Safari ran these SVG blurs (feGaussianBlur, stdDeviation 26 and 5) in its GPU process
// whenever the drifting layer was retiled: about 85% CPU at rest and 2–5 s freezes while
// scrolling and on returning to the top. A bitmap of the same ribbons looks the same
// (max 9/255 off at 1920px) and only has to be decoded once.
const sharp = require('sharp')
const path = require('node:path')

// Keep in sync with HeroBackdrop.tsx.
const ribbon = 'M -180 680 C 170 470 360 680 650 400 S 1020 100 1550 -140'
const returnRibbon = 'M -180 40 C 140 -60 360 0 410 210 S 430 480 690 530 S 1220 420 1690 590'
const lowerRibbon = 'M -180 490 C 20 570 100 750 500 762 S 1170 650 1760 850'

// The capture box, in the layer's 1600x800 user space. [data-aurora-art] img places it
// at the same offsets: left -10%, top -12.5%, width 120%, height 125%.
const [X, Y, W, H] = [-160, -100, 1920, 1000]
const OUT_WIDTH = 768

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${X} ${Y} ${W} ${H}" width="${W}" height="${H}" fill="none">
<defs>
<linearGradient id="spectrum" x1="180" y1="600" x2="1350" y2="0" gradientUnits="userSpaceOnUse">
<stop stop-color="#59d499" stop-opacity="0"/><stop offset="0.22" stop-color="#59d4cf"/><stop offset="0.48" stop-color="#57c1ff"/><stop offset="0.72" stop-color="#7197ff"/><stop offset="0.9" stop-color="#ad9bff"/><stop offset="1" stop-color="#ad9bff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="return" x1="80" y1="100" x2="1480" y2="570" gradientUnits="userSpaceOnUse">
<stop stop-color="#57c1ff" stop-opacity="0"/><stop offset="0.15" stop-color="#57c1ff"/><stop offset="0.4" stop-color="#62dec5"/><stop offset="0.7" stop-color="#57c1ff" stop-opacity="0.25"/><stop offset="1" stop-color="#57c1ff" stop-opacity="0"/>
</linearGradient>
<filter id="bloom" x="-10%" y="-20%" width="120%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="26"/></filter>
<filter id="soft" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<g filter="url(#bloom)" opacity="0.6">
<path d="${ribbon}" stroke="url(#spectrum)" stroke-width="64"/>
<path d="${returnRibbon}" stroke="url(#return)" stroke-width="36" opacity="0.65"/>
<path d="${lowerRibbon}" stroke="url(#spectrum)" stroke-width="48" opacity="0.65"/>
</g>
<path d="${ribbon}" stroke="url(#spectrum)" stroke-width="12" opacity="0.45" filter="url(#soft)"/>
<path d="${returnRibbon}" stroke="url(#return)" stroke-width="5" opacity="0.45" filter="url(#soft)"/>
</svg>`

const out = path.join(__dirname, '../src/images/hero-aurora-bloom.webp')
sharp(Buffer.from(svg))
  .png()
  .toBuffer()
  .then((full) =>
    sharp(full)
      .resize(OUT_WIDTH, Math.round((OUT_WIDTH * H) / W), { kernel: 'lanczos3' })
      .webp({ quality: 60, alphaQuality: 100, effort: 6, smartSubsample: true })
      .toFile(out)
  )
  .then((info) => console.log(`${out}: ${info.width}x${info.height}, ${info.size} bytes`))
