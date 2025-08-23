import Image from 'next/image'

export function Feature({ feature }) {
  const { title, titleGradient, description, icon, media } = feature

  return (
    <div className="flex text-white font-mono sm:mt-60 mt-6 flex-col sm:flex-row lg:flex-row">
      <div
        className="pr-20 mt-16 flex flex-col"
        style={{
          flexGrow: 0.6,
          flexBasis: 0,
          flexShrink: 1,
        }}
      >
        <div
          className={`bg-gradient-to-l ${icon.gradient} w-14 h-14 flex items-center justify-center rounded-xl`}
        >
          {icon.component === 'svg' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
            </svg>
          ) : (
            <icon.component />
          )}
        </div>

        <p className="font-bold text-4xl mt-6">
          <span className={`bg-gradient-to-tr ${titleGradient} text-transparent bg-clip-text`}>
            {title.split(' ')[0]}
          </span>{' '}
          {title.split(' ').slice(1).join(' ')}
        </p>
        <p className="mt-6">{description}</p>
      </div>

      <div className="flex-1 mt-6 sm:mt-0">
        {media.type === 'image' ? (
          <Image className="basis-0 rounded-xl" src={media.src} alt={title} />
        ) : (
          <video
            className="mt-16 basis-0 rounded-xl bg-white/5 w-full shadow-2xl ring-1 ring-white/10 sm:mt-24"
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
