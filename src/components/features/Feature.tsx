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
        <div className="flex text-white sm:mt-32 mt-16 flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
            {/* 左侧内容 */}
            <div className="flex-1 lg:max-w-lg">
                {/* 图标优化 */}
                <div className="relative inline-block">
                    <div className={`bg-gradient-to-br ${gradient} w-16 h-16 flex items-center justify-center rounded-2xl shadow-xl`}>
                        <Icon />
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl opacity-20 blur-xl`}></div>
                </div>

                {/* 标题优化 */}
                <h3 className="font-bold text-3xl sm:text-4xl lg:text-5xl mt-8 leading-tight">
                    <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                        {title.split(' ')[0]}
                    </span>
                    {title.split(' ').length > 1 && (
                        <span className="text-white ml-2">
                            {title.split(' ').slice(1).join(' ')}
                        </span>
                    )}
                </h3>
                
                {/* 描述文字优化 */}
                <div className="mt-6 text-lg leading-relaxed text-gray-300 [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-blue-400/50 hover:[&_a]:decoration-blue-400"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            </div>

            {/* 右侧媒体内容 */}
            <div className="flex-1 max-w-2xl">
                {mediaType === 'video' ? (
                    <div className="relative group">
                        {/* 视频容器 */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl ring-1 ring-white/10">
                            <video
                                ref={videoRef}
                                className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                                controls={isPlaying}
                                muted
                                playsInline
                            >
                                <source src={media} type="video/mp4" />
                            </video>
                            
                            {/* 反光效果 */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        </div>
                        
                        {/* 底部阴影 */}
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-3/4 h-6 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent blur-xl"></div>

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
