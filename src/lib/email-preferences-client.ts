export const REGISTRATION_EMAIL_PREFERENCE_KEY = 'enconvo:registration-product-updates'
const EMAIL_PREFERENCES_API_URL = 'https://api.enconvo.com/api/email-preferences'
const REGISTRATION_PREFERENCE_TTL_MS = 15 * 60 * 1000

export function saveRegistrationEmailPreference(productUpdatesSubscribed: boolean) {
  window.localStorage.setItem(REGISTRATION_EMAIL_PREFERENCE_KEY, JSON.stringify({
    productUpdatesSubscribed,
    createdAt: Date.now(),
  }))
}

export function consumeRegistrationEmailPreference(): boolean | null {
  const storedPreference = window.localStorage.getItem(REGISTRATION_EMAIL_PREFERENCE_KEY)
  if (storedPreference === null) return null
  window.localStorage.removeItem(REGISTRATION_EMAIL_PREFERENCE_KEY)

  try {
    const parsed = JSON.parse(storedPreference) as {
      productUpdatesSubscribed?: unknown
      createdAt?: unknown
    }
    if (
      typeof parsed.productUpdatesSubscribed !== 'boolean'
      || typeof parsed.createdAt !== 'number'
      || Date.now() - parsed.createdAt > REGISTRATION_PREFERENCE_TTL_MS
    ) {
      return null
    }
    return parsed.productUpdatesSubscribed
  } catch {
    return storedPreference === 'true' ? true : storedPreference === 'false' ? false : null
  }
}

async function readEmailPreferenceResponse(response: Response, message: string) {
  if (!response.ok) {
    throw new Error(message)
  }

  return response.json()
}

export async function getCurrentEmailPreference(accessToken: string) {
  const response = await fetch(EMAIL_PREFERENCES_API_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return readEmailPreferenceResponse(response, 'Unable to load email preferences')
}

export async function syncCurrentEmailPreference(accessToken: string) {
  const response = await fetch(EMAIL_PREFERENCES_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return readEmailPreferenceResponse(response, 'Unable to sync email preferences')
}

export async function updateCurrentEmailPreference(
  accessToken: string,
  productUpdatesSubscribed: boolean,
) {
  const response = await fetch(EMAIL_PREFERENCES_API_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productUpdatesSubscribed }),
  })

  return readEmailPreferenceResponse(response, 'Unable to update email preferences')
}
