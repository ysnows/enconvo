export const CLOUD_PRICING_API_ORIGIN =
  process.env.NEXT_PUBLIC_CLOUD_PRICING_API_ORIGIN || 'https://api.enconvo.com'

export type PricingCategoryId =
  | 'language-models'
  | 'image'
  | 'video'
  | 'speech-audio'
  | 'search-web'
  | 'data-documents'

export type PricingStatus = 'active' | 'preview' | 'deprecated'

export type TokenUsageKey =
  | 'inputTokens'
  | 'outputTokens'
  | 'cacheWriteTokens'
  | 'cacheWrite1hTokens'
  | 'cacheReadTokens'
  | 'cacheOutputTokens'

export interface TokenFormula {
  kind: 'token'
  components: Partial<Record<TokenUsageKey, { usdPerMillion: number }>>
  tiers?: Array<{
    aboveTokens: number
    inputIncludesCacheRead?: boolean
    components: Partial<Record<TokenUsageKey, { usdPerMillion: number }>>
  }>
}

export interface FlatFormula {
  kind: 'flat'
  unit: string
  usageKey?: string
  usdPerUnit: number
}

export interface DurationFormula {
  kind: 'duration'
  unit: 'second' | 'minute' | 'hour'
  usdPerUnit: number
  billingQuantum?: number
}

export interface HybridFormula {
  kind: 'hybrid'
  formulas: Array<TokenFormula | FlatFormula | DurationFormula>
}

export interface ProviderReportedFormula {
  kind: 'provider-reported'
}

export type BillingFormula =
  | TokenFormula
  | FlatFormula
  | DurationFormula
  | HybridFormula
  | ProviderReportedFormula

export interface PricingOffering {
  id: string
  title: string
  provider: string
  category: PricingCategoryId
  status: PricingStatus
  formula: BillingFormula
  billingUnit: string
  description?: string
  source: { label: string; url: string; verifiedAt: string }
  promotion?: {
    type: 'limited-time-free' | 'introductory'
    label: string
    startsAt?: string
    endsAt?: string
  }
  estimable: boolean
}

export interface PricingCatalog {
  schemaVersion: string
  catalogVersion: string
  updatedAt: string
  currency: 'USD'
  pointPolicy: {
    usdPerPoint: number
    pointsPerUsd: number
    rounding: 'nearest-integer-after-summing'
    minimumPaidChargePoints: number
  }
  cloudPolicy: {
    cloudPlanAllowancePoints: number
    allowanceReset: 'monthly'
    unusedAllowanceRollsOver: false
    spendOrder: ['subscription', 'topup']
    subscriptionPointsExpireAtReset: true
    topupPointsExpire: false
    redeemableForCash: false
    transferable: false
  }
  categories: Array<{
    id: PricingCategoryId
    label: string
    description: string
  }>
  providers: string[]
  offerings: PricingOffering[]
}

export interface PricingEstimate {
  schemaVersion: string
  catalogVersion: string
  nonBinding: true
  points: number
  usd: number
  evaluation: {
    rawUsd: number
    rawPoints: number
    points: number
    components: Array<{
      id: string
      quantity: number
      usd: number
      rawPoints: number
    }>
  }
}

const MAX_CATALOG_AGE_MS = 35 * 24 * 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function hasValidFormula(value: unknown): value is BillingFormula {
  if (!isRecord(value) || typeof value.kind !== 'string') return false
  if (value.kind === 'provider-reported') return true
  if (value.kind === 'hybrid') return Array.isArray(value.formulas) && value.formulas.length > 0 && value.formulas.every(hasValidFormula)
  if (value.kind === 'token') {
    return isRecord(value.components) && Object.values(value.components).every((rate) =>
      isRecord(rate) && isNonNegativeNumber(rate.usdPerMillion)
    ) && (value.tiers === undefined || (Array.isArray(value.tiers) && value.tiers.every((tier) =>
      isRecord(tier) && isNonNegativeNumber(tier.aboveTokens) && isRecord(tier.components) &&
      Object.values(tier.components).every((rate) => isRecord(rate) && isNonNegativeNumber(rate.usdPerMillion))
    )))
  }
  if (value.kind === 'flat' || value.kind === 'duration') {
    return typeof value.unit === 'string' && value.unit.length > 0 && isNonNegativeNumber(value.usdPerUnit)
  }
  return false
}

function validatePricingCatalog(value: unknown): PricingCatalog {
  if (!isRecord(value) || value.schemaVersion !== '1.0') {
    throw new Error('The pricing catalog schema is unsupported.')
  }
  const updatedAt = Date.parse(String(value.updatedAt || ''))
  if (!Number.isFinite(updatedAt) || updatedAt > Date.now() + 60_000 || Date.now() - updatedAt > MAX_CATALOG_AGE_MS) {
    throw new Error('The live pricing catalog is out of date.')
  }
  if (typeof value.catalogVersion !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value.catalogVersion) ||
      value.currency !== 'USD' || !isRecord(value.pointPolicy) || !isRecord(value.cloudPolicy) ||
      !Array.isArray(value.categories) || !Array.isArray(value.providers) || !Array.isArray(value.offerings)) {
    throw new Error('The pricing catalog is incomplete.')
  }
  const categories = value.categories as unknown[]
  const providers = value.providers as unknown[]
  const offerings = value.offerings as unknown[]
  if (value.pointPolicy.pointsPerUsd !== 50_000 || value.pointPolicy.usdPerPoint !== 0.00002 ||
      value.pointPolicy.rounding !== 'nearest-integer-after-summing' || value.pointPolicy.minimumPaidChargePoints !== 1 ||
      value.cloudPolicy.cloudPlanAllowancePoints !== 500_000 ||
      value.cloudPolicy.allowanceReset !== 'monthly' || value.cloudPolicy.unusedAllowanceRollsOver !== false ||
      JSON.stringify(value.cloudPolicy.spendOrder) !== JSON.stringify(['subscription', 'topup']) ||
      value.cloudPolicy.subscriptionPointsExpireAtReset !== true || value.cloudPolicy.topupPointsExpire !== false ||
      value.cloudPolicy.redeemableForCash !== false || value.cloudPolicy.transferable !== false ||
      !providers.every((provider) => typeof provider === 'string' && provider.length > 0) ||
      !categories.every((category) => isRecord(category) && typeof category.id === 'string' &&
        typeof category.label === 'string' && typeof category.description === 'string') ||
      !offerings.every((offering) => isRecord(offering) && typeof offering.id === 'string' &&
        typeof offering.title === 'string' && typeof offering.provider === 'string' &&
        providers.includes(offering.provider) &&
        (offering.status === 'active' || offering.status === 'preview' || offering.status === 'deprecated') &&
        typeof offering.category === 'string' &&
        categories.some((category) => isRecord(category) && category.id === offering.category) &&
        typeof offering.billingUnit === 'string' && typeof offering.estimable === 'boolean' &&
        isRecord(offering.source) && typeof offering.source.label === 'string' &&
        typeof offering.source.url === 'string' && typeof offering.source.verifiedAt === 'string' &&
        hasValidFormula(offering.formula))) {
    throw new Error('The pricing catalog failed validation.')
  }
  return value as unknown as PricingCatalog
}

export async function fetchPricingCatalog(signal?: AbortSignal): Promise<PricingCatalog> {
  const response = await fetch(
    `${CLOUD_PRICING_API_ORIGIN}/api/v1/cloud-pricing/catalog`,
    { signal, cache: 'no-store', headers: { accept: 'application/json' } }
  )
  if (!response.ok) throw new Error('The live pricing catalog is temporarily unavailable.')
  return validatePricingCatalog(await response.json())
}

export async function fetchPricingEstimate(
  offeringId: string,
  usage: Record<string, unknown>,
  expectedCatalogVersion?: string
): Promise<PricingEstimate> {
  const response = await fetch(
    `${CLOUD_PRICING_API_ORIGIN}/api/v1/cloud-pricing/estimate`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ offeringId, usage }),
    }
  )
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Unable to calculate this estimate.')
  if (result.schemaVersion !== '1.0' || result.nonBinding !== true ||
      typeof result.catalogVersion !== 'string' || !Number.isInteger(result.points) || result.points < 0 ||
      !isNonNegativeNumber(result.usd) || !isRecord(result.evaluation) ||
      (expectedCatalogVersion && result.catalogVersion !== expectedCatalogVersion)) {
    throw new Error('The estimate does not match the current pricing catalog.')
  }
  return result
}
