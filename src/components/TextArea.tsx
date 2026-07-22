"use client";

import { useRef, useEffect } from "react";

interface TextAreaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function TextArea({
    value,
    onChange,
    placeholder = "",
    className = "",
}: TextAreaProps) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = "auto";
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-light-gray px-md py-sm leading-[1.2] text-black placeholder:text-medium-gray outline-none resize-none min-h-[60px] ${className}`}
        />
    );
}
