"use client";

import { useRef, useEffect, useState } from "react";

const frameCache = new Map<
    string,
    { dataUrl: string; width: number; height: number }
>();

export default function VideoStill({ src }: { src: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cached, setCached] = useState(() => frameCache.get(src));

    useEffect(() => {
        if (cached) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const img = new Image();
            img.onload = () => {
                canvas.width = cached.width;
                canvas.height = cached.height;
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.drawImage(img, 0, 0);
            };
            img.src = cached.dataUrl;
            return;
        }

        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = src;

        video.addEventListener("loadedmetadata", () => {
            video.currentTime = Math.min(4, video.duration);
        });

        video.addEventListener("seeked", () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(video, 0, 0);

            const entry = {
                dataUrl: canvas.toDataURL("image/jpeg", 0.7),
                width: video.videoWidth,
                height: video.videoHeight,
            };
            frameCache.set(src, entry);
            setCached(entry);

            video.src = "";
            video.load();
        });

        video.load();
    }, [src, cached]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{
                aspectRatio: cached
                    ? `${cached.width} / ${cached.height}`
                    : undefined,
            }}
        />
    );
}
