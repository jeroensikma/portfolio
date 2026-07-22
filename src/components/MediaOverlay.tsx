"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";

export interface OverlayMediaItem {
    mediaId: string;
    url: string;
    type: "image" | "video";
    altText: string;
    projectTitle: string;
    projectYear: string | null;
    number: string;
    label: string;
}

export default function MediaOverlay({
    items,
}: {
    items: OverlayMediaItem[];
}) {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const isOpen = currentIndex >= 0;

    useEffect(() => {
        function handleOpen(e: CustomEvent<{ mediaId: string }>) {
            const idx = items.findIndex((i) => i.mediaId === e.detail.mediaId);
            if (idx >= 0) setCurrentIndex(idx);
        }
        window.addEventListener("open-media-overlay", handleOpen as EventListener);
        return () => window.removeEventListener("open-media-overlay", handleOpen as EventListener);
    }, [items]);

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setCurrentIndex(-1);
            if (e.key === "ArrowRight") setCurrentIndex((i) => (i + 1) % items.length);
            if (e.key === "ArrowLeft") setCurrentIndex((i) => (i - 1 + items.length) % items.length);
        }
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, items.length]);

    const item = isOpen ? items[currentIndex] : null;
    const total = items.length;

    return (
        <AnimatePresence>
        {isOpen && item && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(3.65px)",
                WebkitBackdropFilter: "blur(3.65px)",
                backgroundColor: "rgba(217, 217, 217, 0.4)",
            }}
            onClick={() => setCurrentIndex(-1)}
        >
            <div
                style={{
                    backgroundColor: "var(--color-white)",
                    display: "flex",
                    flexDirection: "column",
                    width: "calc(100vw - 24px)",
                    maxWidth: "1121px",
                    height: "calc(100vh - 32px)",
                    maxHeight: "708px",
                    padding: "12px 12px 16px 12px",
                    boxSizing: "border-box",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <p
                            className="text-black uppercase"
                            style={{
                                fontFamily: "var(--font-title)",
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            {item.projectTitle}
                        </p>
                        <p className="text-black" style={{ margin: 0 }}>
                            {item.projectYear}
                        </p>
                    </div>
                    <button
                        onClick={() => setCurrentIndex(-1)}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Close overlay"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="#181818" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Media */}
                <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                    {item.type === "video" ? (
                        <video
                            key={item.url}
                            src={item.url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                    ) : (
                        <Image
                            src={item.url}
                            alt={item.altText}
                            fill
                            sizes="(max-width: 1121px) 100vw, 1121px"
                            style={{ objectFit: "contain" }}
                            priority
                        />
                    )}
                </div>

                {/* Bottom bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <p className="text-black" style={{ margin: 0 }}>{item.number}</p>
                        <p className="text-black" style={{ margin: 0 }}>{item.label}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                            onClick={() => setCurrentIndex((i) => (i - 1 + total) % total)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Previous"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18l-6-6 6-6" stroke="#181818" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentIndex((i) => (i + 1) % total)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Next"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18l6-6-6-6" stroke="#181818" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
        )}
        </AnimatePresence>
    );
}
