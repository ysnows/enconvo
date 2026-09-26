import type { UseCase } from '../data/useCases'

export const ALL_USE_CASES = 'All'

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Search across the actual walkthrough content; every word must match. */
export function filterUseCases(
  items: UseCase[],
  category: string,
  query: string
) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    if (category !== ALL_USE_CASES && item.category !== category) return false
    const text = normalize(`${item.title} ${item.description} ${item.category}`)
    return terms.every((term) => text.includes(term))
  })
}

export function useCaseCategories(items: UseCase[]) {
  return [
    ALL_USE_CASES,
    ...Array.from(new Set(items.map((item) => item.category))),
  ]
}
