/** Mirrors the Worker: accepts a bare code or a pasted link, e.g. `enconvo.com/i/ab-cd23`. */
export function normalizeCode(raw: unknown): string {
    if (typeof raw !== 'string') return ''
    let value = raw.trim()
    const slash = value.lastIndexOf('/')
    if (slash >= 0) value = value.slice(slash + 1)
    value = value.split(/[?#]/)[0].toUpperCase().replace(/[\s-]/g, '')
    return /^[A-Z0-9]{4,16}$/.test(value) ? value : ''
}
