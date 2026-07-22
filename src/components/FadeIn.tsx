"use client";

import { motion } from "motion/react";

interface FadeInProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    y?: number;
    className?: string;
    style?: React.CSSProperties;
}

export default function FadeIn({
    children,
    delay = 0,
    duration = 0.6,
    y = 20,
    className,
    style,
}: FadeInProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
}

interface StaggerProps {
    children: React.ReactNode;
    staggerDelay?: number;
    duration?: number;
    y?: number;
    className?: string;
    style?: React.CSSProperties;
}

export function Stagger({
    children,
    staggerDelay = 0.1,
    duration = 0.6,
    y = 20,
    className,
    style,
}: StaggerProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
            style={style}
        >
            {Array.isArray(children)
                ? children.map((child, i) => (
                      <motion.div
                          key={i}
                          variants={{
                              hidden: { opacity: 0, y },
                              visible: {
                                  opacity: 1,
                                  y: 0,
                                  transition: { duration, ease: [0.25, 0.1, 0.25, 1] },
                              },
                          }}
                      >
                          {child}
                      </motion.div>
                  ))
                : children}
        </motion.div>
    );
}
