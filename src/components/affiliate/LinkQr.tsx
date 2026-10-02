import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { downloadBlob } from '@/lib/affiliate-program'
import { toolButton } from './ui'

// A QR code of the link built on /affiliate, for slides, videos, print and events, as affiliate
// tools offer one. It encodes the link exactly as built, sub ID included, and is drawn in the
// browser; the encoder loads only once the code is opened.

/** The four light modules around the code that scanners need. */
const QUIET_ZONE = 4

export interface LinkQrCode {
    link: string
    /** Modules per side, quiet zone included */
    size: number
    dark: boolean[][]
    /** The dark modules as one SVG path, one unit per module */
    path: string
}

export async function linkQrCode(link: string): Promise<LinkQrCode> {
    const { encode } = await import('uqr')
    // Medium error correction still reads when printed small or partly covered.
    const qr = encode(link, { ecc: 'M', border: QUIET_ZONE })
    return { link, size: qr.size, dark: qr.data, path: qrPath(qr.data) }
}

/** Each run of dark modules in a row as one rectangle: `M4 4h7v1h-7z`. */
export function qrPath(dark: boolean[][]): string {
    let path = ''
    dark.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            if (!row[x]) continue
            const start = x
            while (row[x + 1]) x++
            const run = x - start + 1
            path += `M${start} ${y}h${run}v1h-${run}z`
        }
    })
    return path
}

function svgFile(qr: LinkQrCode): Blob {
    const pixels = qr.size * 16
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}" width="${pixels}" height="${pixels}" shape-rendering="crispEdges">` +
        `<rect width="${qr.size}" height="${qr.size}" fill="#fff"/><path d="${qr.path}" fill="#000"/></svg>`
    return new Blob([svg], { type: 'image/svg+xml' })
}

/** About 1,000 pixels a side, a whole number of pixels per module so the edges stay sharp. */
function pngFile(qr: LinkQrCode): Promise<Blob | null> {
    const scale = Math.ceil(1000 / qr.size)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = qr.size * scale
    const context = canvas.getContext('2d')
    if (!context) return Promise.resolve(null)
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#000'
    qr.dark.forEach((row, y) => row.forEach((on, x) => on && context.fillRect(x * scale, y * scale, scale, scale)))
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export function LinkQr({ id, link, sub, fileName }: { id: string; link: string; sub: string | null; fileName: string }) {
    const [qr, setQr] = useState<LinkQrCode | null>(null)
    const [failed, setFailed] = useState(false)
    useEffect(() => {
        let current = true
        linkQrCode(link).then(
            (made) => current && (setQr(made), setFailed(false)),
            () => current && setFailed(true)
        )
        return () => {
            current = false
        }
    }, [link])
    const savePng = async () => {
        const png = qr && (await pngFile(qr))
        if (png) downloadBlob(`${fileName}.png`, png)
    }
    return (
        <div id={id} className="mt-4 flex flex-col gap-4 rounded-xl border border-hairline bg-[#0B0C0D] p-4 sm:flex-row sm:items-center">
            {/* Dark on white in either theme: scanners need the contrast. */}
            <div className="flex h-40 w-40 flex-none items-center justify-center rounded-lg bg-white">
                {qr ? (
                    <svg
                        role="img"
                        aria-label={`QR code for ${qr.link}`}
                        viewBox={`0 0 ${qr.size} ${qr.size}`}
                        shapeRendering="crispEdges"
                        className="h-full w-full"
                    >
                        <path d={qr.path} fill="#000" />
                    </svg>
                ) : (
                    <span className="text-xs text-[#5B6166]">{failed ? 'Not available' : 'Making the code…'}</span>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-content">
                    {failed ? "The QR code couldn't be made. Reload the page and try again." : 'Scanning it opens the link above.'}
                </p>
                <p className="mt-1 text-xs leading-5 text-content-muted">
                    {sub ? (
                        <>
                            Scans count under the sub ID <span className="font-mono text-content-body">{sub}</span>, so you can see what the code
                            brings in on its own.
                        </>
                    ) : (
                        <>
                            For slides, videos, print and events. Give it a sub ID such as <span className="font-mono text-content-body">qr</span> or
                            the event&apos;s name to see what its scans bring in.
                        </>
                    )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={!qr || qr.link !== link} onClick={savePng} className={toolButton}>
                        <Download className="h-4 w-4" aria-hidden="true" />
                        PNG
                    </button>
                    <button
                        type="button"
                        disabled={!qr || qr.link !== link}
                        onClick={() => qr && downloadBlob(`${fileName}.svg`, svgFile(qr))}
                        className={toolButton}
                    >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        SVG
                    </button>
                </div>
            </div>
        </div>
    )
}
