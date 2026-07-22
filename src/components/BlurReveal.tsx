"use client";

import { motion } from "motion/react";

interface BlurRevealProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    blur?: number;
    y?: number;
    className?: string;
    style?: React.CSSProperties;
}

export default function BlurReveal({
    children,
    delay = 0,
    duration = 0.8,
    blur = 10,
    y = 0,
    className,
    style,
}: BlurRevealProps) {
    return (
        <motion.div
            initial={{ opacity: 0, filter: `blur(${blur}px)`, y }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
}
