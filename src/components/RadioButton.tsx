"use client";

interface RadioButtonProps {
    selected: boolean;
    onChange: () => void;
    label: string;
    className?: string;
}

export default function RadioButton({
    selected,
    onChange,
    label,
    className = "",
}: RadioButtonProps) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`flex items-center gap-xs ${className}`}
        >
            <div className="size-[12px] border border-black rounded-full overflow-hidden shrink-0 relative">
                {selected && (
                    <div className="absolute left-[2px] top-[2px] size-[6px] bg-black rounded-full" />
                )}
            </div>
            <span className="text-black whitespace-nowrap">
                {label}
            </span>
        </button>
    );
}
