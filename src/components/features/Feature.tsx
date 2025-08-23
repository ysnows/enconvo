import Image from "next/image";
import { useState, useRef } from "react";

export function Feature({ title, description, icon: Icon, gradient, media, mediaType = 'image' }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const handlePlayClick = () => {
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

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
                <p className="mt-6 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            </div>

            <div className="flex-1 mt-6 sm:mt-0">
                {mediaType === 'video' ? (
                    <div className="relative mt-16 sm:mt-24">
                        <video
                            ref={videoRef}
                            className="rounded-xl bg-white/5 w-full shadow-2xl ring-1 ring-white/10"
                            controls={isPlaying}
                            muted
                        // poster={`https://file.enconvo.com/thumbnails/${media.split('/').pop().replace('.mp4', '.jpg')}`}
                        >
                            <source src={media} type="video/mp4" />
                        </video>

                        {!isPlaying && (
                            <div
                                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                                onClick={handlePlayClick}
                            >
                                {/* Play button with pulsing glow effect */}
                                <button
                                    className="relative w-20 h-20 bg-purple-600/80 rounded-full flex items-center justify-center group hover:bg-purple-500/90 transition-all duration-300 backdrop-blur-sm"
                                >
                                    {/* Outer pulsing glow */}
                                    <div className="absolute w-full h-full rounded-full bg-purple-500/30 animate-pulse-slow"></div>
                                    <div className="absolute w-[120%] h-[120%] rounded-full bg-purple-400/20 animate-pulse-slower"></div>

                                    {/* Inner circle with play icon */}
                                    <div className="w-16 h-16 bg-purple-800/80 rounded-full flex items-center justify-center transform group-hover:scale-90 transition-all duration-300">
                                        <svg
                                            className="w-8 h-8 text-white fill-current transform translate-x-0.5"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                ) : mediaType === 'youtube' ? (
                    <div className="relative mt-16 sm:mt-24 w-full aspect-video">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10" 
                            // Show player controls but hide other UI elements
                            src={`${media.replace('watch?v=', 'embed/')}?controls=1&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
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
