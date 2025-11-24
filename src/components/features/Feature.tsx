import Image from "next/image";
import { useState, useRef } from "react";

export function Feature({ title, description, icon: Icon, gradient, media, mediaType = 'image', index = 0 }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const handlePlayClick = () => {
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    // Alternate layout: even indices = image on left, odd indices = image on right
    const isReversed = index % 2 === 1;

    return (
        <div className={`flex text-white mt-24 sm:mt-32 flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
            {/* Content side */}
            <div className="flex-1 lg:max-w-xl">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${gradient}`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-bold text-3xl sm:text-4xl lg:text-5xl mt-6 leading-tight text-white">
                    {title}
                </h3>

                {/* Description */}
                <div className="mt-4 text-lg leading-relaxed text-gray-400 [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-blue-400/50 hover:[&_a]:decoration-blue-400"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            </div>

            {/* Media side */}
            <div className="flex-1 w-full max-w-2xl">
                {mediaType === 'video' ? (
                    <div className="relative group">
                        <div className="relative rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
                            <video
                                ref={videoRef}
                                className="w-full h-auto"
                                controls={isPlaying}
                                muted
                                playsInline
                            >
                                <source src={media} type="video/mp4" />
                            </video>

                            {!isPlaying && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
                                    onClick={handlePlayClick}
                                >
                                    <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                        <svg
                                            className="w-6 h-6 text-gray-900 fill-current ml-1"
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
                    <div className="relative w-full aspect-video">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-xl shadow-2xl"
                            src={`${media.replace('watch?v=', 'embed/')}?controls=1&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <Image
                        className="rounded-xl shadow-2xl"
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
