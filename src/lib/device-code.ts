// /device approves a device-code sign-in (CONTEXT.md "Device code"): `enconvo login` on a
// Linux server prints a code, and the signed-in account approves it here. The Worker routes
// take the Supabase access token as `Authorization: Bearer`.

import { workerRequest } from '@/lib/worker-api'

export interface DeviceRequest {
    user_code: string
    /** What the device says about itself; it can't be checked. */
    device: { name: string; platform: string; version: string }
    /** Where the request came from, coarse: `city, region, country`. */
    location: string
    created_at: number
    expires_at: number
    status: 'pending' | 'approved' | 'denied'
}

const USER_CODE = /^[BCDFGHJKLMNPQRSTVWXZ]{4}-[BCDFGHJKLMNPQRSTVWXZ]{4}$/

/** What a person types, as a user code: case and separators don't matter. Null when it can't be one. */
export function normalizeUserCode(input: string): string | null {
    const letters = input.toUpperCase().replace(/[^A-Z]/g, '')
    if (letters.length !== 8) return null
    const code = `${letters.slice(0, 4)}-${letters.slice(4)}`
    return USER_CODE.test(code) ? code : null
}

function signedPost<T>(path: string, accessToken: string, body: unknown) {
    return workerRequest<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
    })
}

export function inspectDeviceRequest(accessToken: string, userCode: string) {
    return signedPost<DeviceRequest>('/api/device/inspect', accessToken, { user_code: userCode })
}

export function answerDeviceRequest(accessToken: string, userCode: string, approve: boolean) {
    return signedPost<{ status: 'approved' | 'denied' }>('/api/device/approve', accessToken, { user_code: userCode, approve })
}
