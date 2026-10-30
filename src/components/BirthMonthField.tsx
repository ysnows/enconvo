import { useI18n } from '@/i18n/I18nProvider'
import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BirthMonth } from '@/lib/age-gate'

// The browser's own arrow box and light menu are off; the chevron is drawn beside the select.
const selectClass =
  'h-10 w-full appearance-none rounded-[10px] border border-[#333333] bg-[#1C1C1C] pl-3 pr-9 text-sm text-white [color-scheme:dark] focus:border-[#555555] focus:outline-none focus:ring-1 focus:ring-[#555555] invalid:text-[#666666]'
const chevronClass =
  'pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#8A8A8A]'

/**
 * The neutral month-and-year-of-birth question of the sign-up age check (lib/age-gate). It
 * doesn't say what age passes.
 */
export function BirthMonthField({
  month,
  year,
  onChange,
}: {
  month: string
  year: string
  onChange: (month: string, year: string) => void
}) {
  const { t, locale } = useI18n()
  const months = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, {
      month: 'long',
      timeZone: 'UTC',
    })
    return Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1),
      label: format.format(new Date(Date.UTC(2000, index, 1))),
    }))
  }, [locale])
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: current - 1900 + 1 }, (_, index) =>
      String(current - index)
    )
  }, [])

  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-[12px] leading-4 text-[#777F8A]">
        {t('Date of birth')}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <select
            aria-label={t('Month')}
            required
            value={month}
            onChange={(event) => onChange(event.target.value, year)}
            className={selectClass}
          >
            <option value="" disabled>
              {t('Month')}
            </option>
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className={chevronClass} />
        </div>
        <div className="relative">
          <select
            aria-label={t('Year')}
            required
            value={year}
            onChange={(event) => onChange(month, event.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              {t('Year')}
            </option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className={chevronClass} />
        </div>
      </div>
    </fieldset>
  )
}

/** The chosen month and year, or null until both are set. */
export function birthMonthFrom(month: string, year: string): BirthMonth | null {
  const m = Number(month)
  const y = Number(year)
  return month && year && Number.isInteger(m) && Number.isInteger(y)
    ? { month: m, year: y }
    : null
}
