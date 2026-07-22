"use client";

interface TextFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    className?: string;
}

export default function TextField({
    value,
    onChange,
    placeholder = "",
    type = "text",
    className = "",
}: TextFieldProps) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-light-gray px-md py-sm text-black placeholder:text-medium-gray outline-none ${className}`}
        />
    );
}
