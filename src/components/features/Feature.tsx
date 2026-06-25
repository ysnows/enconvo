import Image from "next/image";
import { useState, useRef, ReactNode } from "react";

interface FeatureProps {
    title: string
    description: string | ReactNode
    icon: any
    gradient: string
    media: string
    mediaType?: 'video' | 'youtube' | 'image'
    index?: number
}

export function Feature({ title, description, icon: Icon, gradient, media, mediaType = 'image', index = 0 }: FeatureProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isYouTubeLoaded, setIsYouTubeLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlayClick = () => {
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    const handleYouTubeClick = () => {
        setIsYouTubeLoaded(true);
    };

    const getYouTubeVideoId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        return match ? match[1] : null;
    };

    const getYouTubeThumbnail = (url: string) => {
        const videoId = getYouTubeVideoId(url);
        if (!videoId) return null;
        return `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
    };

    const isReversed = index % 2 === 1;

    return (
        <div className={`flex text-content mt-24 sm:mt-32 flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
            <div className="flex-1 lg:max-w-xl">
                <div className="flex items-center gap-4">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-content">
                        {title}
                    </h3>
                </div>

                <div className="mt-4 text-lg leading-relaxed text-content-body">
                    {typeof description === 'string' ? (
                        <p>{description}</p>
                    ) : (
                        description
                    )}
                </div>
            </div>

            <div className="flex-1 w-full max-w-2xl">
                {mediaType === 'video' ? (
                    <div className="relative group">
                        <div className="relative rounded-lg overflow-hidden bg-surface-elevated border border-hairline">
                            <video
                                ref={videoRef}
                                className="w-full h-auto rounded-lg"
                                controls={isPlaying}
                                muted
                                playsInline
                            >
                                <source src={media} type="video/mp4" />
                            </video>

                            {!isPlaying && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-canvas/20"
                                    onClick={handlePlayClick}
                                >
                                    <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                        <svg
                                            className="w-6 h-6 text-canvas fill-current ml-1"
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
                        {!isYouTubeLoaded ? (
                            <>
                                <img
                                    src={getYouTubeThumbnail(media)}
                                    alt={title}
                                    className="absolute top-0 left-0 w-full h-full object-cover rounded-lg border border-hairline"
                                />
                                <div
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-canvas/20 rounded-lg"
                                    onClick={handleYouTubeClick}
                                >
                                    <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                        <svg
                                            className="w-6 h-6 text-canvas fill-current ml-1"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <iframe
                                className="absolute top-0 left-0 w-full h-full rounded-lg border border-hairline"
                                src={`${media.replace('watch?v=', 'embed/')}?autoplay=1&controls=1&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )}
                    </div>
                ) : (
                    <Image
                        className="rounded-lg border border-hairline"
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
