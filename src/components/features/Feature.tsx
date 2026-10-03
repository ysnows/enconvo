import { useI18n } from '@/i18n/I18nProvider'
import Image from 'next/image'
import { useState, useRef, ReactNode } from 'react'

interface FeatureProps {
  title: string
  description: string | ReactNode
  icon: any
  gradient: string
  media: string
  mediaType?: 'video' | 'youtube' | 'image'
  index?: number
}

export function Feature({
  title,
  description,
  icon: Icon,
  gradient,
  media,
  mediaType = 'image',
  index = 0,
}: FeatureProps) {
  const { t, locale } = useI18n()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isYouTubeLoaded, setIsYouTubeLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlayClick = () => {
    setIsPlaying(true)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleYouTubeClick = () => {
    setIsYouTubeLoaded(true)
  }

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    return match ? match[1] : null
  }

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url)
    if (!videoId) return null
    return `https://img.youtube.com/vi/${videoId}/sddefault.jpg`
  }

  const isReversed = index % 2 === 1

  return (
    <div
      className={`mt-24 flex flex-col text-content sm:mt-32 ${
        isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
      } items-center gap-12 lg:gap-20`}
    >
      <div className="flex-1 lg:max-w-xl">
        <div className="flex items-center gap-4">
          <div
            className={`inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-3xl font-bold leading-tight text-content sm:text-4xl lg:text-5xl">
            {t(title)}
          </h3>
        </div>

        <div className="mt-4 text-lg leading-relaxed text-content-body">
          {typeof description === 'string' ? (
            <p>{t(description)}</p>
          ) : (
            t(description)
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl flex-1">
        {mediaType === 'video' ? (
          <div className="group relative">
            <div className="relative overflow-hidden rounded-lg border border-hairline bg-surface-elevated">
              <video
                ref={videoRef}
                className="h-auto w-full rounded-lg"
                controls={isPlaying}
                muted
                playsInline
              >
                <source src={media} type="video/mp4" />
              </video>

              {!isPlaying && (
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-canvas/20"
                  onClick={handlePlayClick}
                >
                  <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition-colors hover:bg-white">
                    <svg
                      className="ml-1 h-6 w-6 fill-current text-canvas"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : mediaType === 'youtube' ? (
          <div className="relative aspect-video w-full">
            {!isYouTubeLoaded ? (
              <>
                <img
                  src={getYouTubeThumbnail(media)}
                  alt={t(title)}
                  className="absolute left-0 top-0 h-full w-full rounded-lg border border-hairline object-cover"
                />
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-canvas/20"
                  onClick={handleYouTubeClick}
                >
                  <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition-colors hover:bg-white">
                    <svg
                      className="ml-1 h-6 w-6 fill-current text-canvas"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <iframe
                className="absolute left-0 top-0 h-full w-full rounded-lg border border-hairline"
                src={`${media.replace(
                  'watch?v=',
                  'embed/'
                )}?autoplay=1&controls=1&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <Image
            className="rounded-lg border border-hairline"
            src={media}
            alt={t(title)}
            width={800}
            height={600}
          />
        )}
      </div>
    </div>
  )
}
