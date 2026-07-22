"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(0.7);
    const [hovering, setHovering] = useState(false);
    const [showSlider, setShowSlider] = useState(false);
    const [hasAudio, setHasAudio] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        function checkAudio() {
            if (!video) return;
            const v = video as HTMLVideoElement & {
                webkitAudioDecodedByteCount?: number;
                mozHasAudio?: boolean;
                audioTracks?: { length: number };
            };
            if (typeof v.webkitAudioDecodedByteCount === "number") {
                setHasAudio(v.webkitAudioDecodedByteCount > 0);
            } else if (typeof v.mozHasAudio === "boolean") {
                setHasAudio(v.mozHasAudio);
            } else if (v.audioTracks) {
                setHasAudio(v.audioTracks.length > 0);
            }
        }

        function onPlaying() {
            setTimeout(checkAudio, 300);
        }

        video.addEventListener("playing", onPlaying);
        if (!video.paused) onPlaying();
        return () => video.removeEventListener("playing", onPlaying);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (!video.src) {
                        video.src = src;
                    } else {
                        video.play().catch(() => {});
                    }
                } else if (video.src) {
                    video.pause();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(video);
        return () => observer.disconnect();
    }, [src]);

    function toggleMute() {
        const video = videoRef.current;
        if (!video) return;

        if (muted) {
            video.muted = false;
            video.volume = volume;
            setMuted(false);
        } else {
            video.muted = true;
            setMuted(true);
        }
    }

    function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            if (val === 0) {
                videoRef.current.muted = true;
                setMuted(true);
            } else if (muted) {
                videoRef.current.muted = false;
                setMuted(false);
            }
        }
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => {
                setHovering(false);
                setShowSlider(false);
            }}
        >
            <video
                ref={videoRef}
                className="w-full h-auto"
                autoPlay
                loop
                muted
                playsInline
                preload="none"
            />

            {hasAudio && (
                <div
                    className="absolute bottom-[12px] left-[12px] flex items-center gap-[6px] transition-opacity duration-200"
                    style={{ opacity: hovering ? 1 : 0 }}
                >
                    <button
                        onClick={toggleMute}
                        onMouseEnter={() => setShowSlider(true)}
                        className="flex items-center justify-center w-[28px] h-[28px] rounded-full backdrop-blur-md"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                    >
                        <VolumeIcon muted={muted} volume={volume} />
                    </button>

                    <div
                        className="flex items-center rounded-full backdrop-blur-md px-[10px] h-[28px] transition-all duration-200 overflow-hidden"
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            width: showSlider ? 100 : 0,
                            padding: showSlider ? undefined : 0,
                            opacity: showSlider ? 1 : 0,
                        }}
                        onMouseLeave={() => setShowSlider(false)}
                    >
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={muted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-full volume-slider"
                        />
                    </div>
                </div>
            )}

        </div>
    );
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
    if (muted || volume === 0) {
        return (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                    d="M8 2L4.5 5H2C1.45 5 1 5.45 1 6V10C1 10.55 1.45 11 2 11H4.5L8 14V2Z"
                    fill="white"
                />
                <path
                    d="M12 5.5L14.5 8M14.5 5.5L12 8"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        );
    }
    if (volume < 0.5) {
        return (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                    d="M8 2L4.5 5H2C1.45 5 1 5.45 1 6V10C1 10.55 1.45 11 2 11H4.5L8 14V2Z"
                    fill="white"
                />
                <path
                    d="M11 6.5C11.5 7 11.8 7.5 11.8 8S11.5 9 11 9.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        );
    }
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
                d="M8 2L4.5 5H2C1.45 5 1 5.45 1 6V10C1 10.55 1.45 11 2 11H4.5L8 14V2Z"
                fill="white"
            />
            <path
                d="M11 6.5C11.5 7 11.8 7.5 11.8 8S11.5 9 11 9.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M13 4.5C14 5.5 14.5 6.7 14.5 8S14 10.5 13 11.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}
