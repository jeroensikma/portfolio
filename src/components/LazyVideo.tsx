"use client";

import { useRef, useEffect } from "react";

export default function LazyVideo({
    src,
    className,
    autoPlay = true,
}: {
    src: string;
    className?: string;
    autoPlay?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const loadedRef = useRef(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !loadedRef.current) {
                    loadedRef.current = true;
                    video.src = autoPlay ? src : src + "#t=4";
                } else if (entry.isIntersecting && autoPlay && loadedRef.current) {
                    video.play().catch(() => {});
                } else if (!entry.isIntersecting && autoPlay && loadedRef.current) {
                    video.pause();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(video);
        return () => observer.disconnect();
    }, [src, autoPlay]);

    return (
        <video
            ref={videoRef}
            className={className}
            autoPlay={autoPlay}
            loop={autoPlay}
            muted
            playsInline
            preload={autoPlay ? "none" : "metadata"}
        />
    );
}
