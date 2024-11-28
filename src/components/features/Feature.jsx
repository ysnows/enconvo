import Image from "next/image";

export function Feature({ title, description, icon: Icon, gradient, media, mediaType = 'image' }) {
    return (
        <div className="flex text-white font-mono sm:mt-60 mt-6 flex-col sm:flex-row lg:flex-row">
            <div className="pr-20 mt-16 flex flex-col"
                style={{
                    flexGrow: 0.6,
                    flexBasis: 0,
                    flexShrink: 1,
                }}>
                <div className={`bg-gradient-to-l ${gradient} w-14 h-14 flex items-center justify-center rounded-xl`}>
                    <Icon />
                </div>

                <p className="font-bold text-4xl mt-6">
                    <span className={`bg-gradient-to-tr ${gradient} text-transparent bg-clip-text`}>
                        {title.split(' ')[0]}
                    </span>{' '}
                    {title.split(' ').slice(1).join(' ')}
                </p>
                <p className="mt-6">
                    {description}
                </p>
            </div>

            <div className="flex-1 mt-6 sm:mt-0">
                {mediaType === 'video' ? (
                    <video 
                        className="mt-16 basis-0 rounded-xl bg-white/5 w-full shadow-2xl ring-1 ring-white/10 sm:mt-24" 
                        controls 
                        autoPlay 
                        muted
                    >
                        <source src={media} type="video/mp4" />
                    </video>
                ) : (
                    <Image
                        className="basis-0 rounded-xl"
                        src={media}
                        alt={title}
                        width={800}
                        height={600}
                    />
                )}
            </div>
        </div>
    )
}
