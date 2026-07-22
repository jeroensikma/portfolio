"use client";

type ButtonVariant = "primary" | "secondary" | "inactive" | "delete" | "upload";

interface ButtonProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
    className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-black text-white hover:bg-dark-gray",
    secondary: "bg-medium-gray text-black hover:bg-dark-gray hover:text-white",
    inactive: "bg-medium-gray text-light-gray cursor-not-allowed",
    delete: "bg-red text-white hover:bg-dark-gray",
    upload: "bg-dark-gray text-white hover:bg-medium-gray",
};

export default function Button({
    children,
    variant = "primary",
    onClick,
    type = "button",
    disabled = false,
    className = "",
}: ButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || variant === "inactive"}
            className={`min-w-[140px] px-sm py-sm uppercase whitespace-nowrap ${variantStyles[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
