import { useI18n } from '@/i18n/I18nProvider'
import Image from 'next/image'

export function Feature({ feature }) {
  const { t, locale } = useI18n()

  const { title, titleGradient, description, icon, media } = feature

  return (
    <div className="mt-6 flex flex-col font-mono text-white sm:mt-60 sm:flex-row lg:flex-row">
      <div
        className="mt-16 flex flex-col pr-20"
        style={{
          flexGrow: 0.6,
          flexBasis: 0,
          flexShrink: 1,
        }}
      >
        <div
          className={`bg-gradient-to-l ${icon.gradient} flex h-14 w-14 items-center justify-center rounded-xl`}
        >
          {icon.component === 'svg' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={icon.path}
              />
            </svg>
          ) : (
            <icon.component />
          )}
        </div>

        <p className="mt-6 text-4xl font-bold">
          <span
            className={`bg-gradient-to-tr ${titleGradient} bg-clip-text text-transparent`}
          >
            {title.split(' ')[0]}
          </span>{' '}
          {title.split(' ').slice(1).join(' ')}
        </p>
        <p className="mt-6">{t(description)}</p>
      </div>

      <div className="mt-6 flex-1 sm:mt-0">
        {media.type === 'image' ? (
          <Image
            className="basis-0 rounded-xl"
            src={media.src}
            alt={t(title)}
          />
        ) : (
          <video
            className="mt-16 w-full basis-0 rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10 sm:mt-24"
            controls
            autoPlay
            muted
          >
            <source src={media.src} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  )
}
