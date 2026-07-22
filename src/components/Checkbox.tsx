"use client";

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    className?: string;
}

export default function Checkbox({
    checked,
    onChange,
    label,
    className = "",
}: CheckboxProps) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`flex items-center gap-xs ${className}`}
        >
            <div className="size-[12px] border border-black rounded-[1px] overflow-hidden shrink-0 relative">
                {checked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img
                            src="/icons/icon-check.svg"
                            alt=""
                            className="size-[12px]"
                        />
                    </div>
                )}
            </div>
            <span className="text-black whitespace-nowrap">
                {label}
            </span>
        </button>
    );
}
