import Link from "next/link";

type IconType = "edit" | "delete" | "add" | "check" | "save" | "reorder" | "none";

interface TextLinkProps {
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    active?: boolean;
    icon?: IconType;
    className?: string;
}

const iconPaths: Record<Exclude<IconType, "none">, string> = {
    edit: "/icons/icon-edit.svg",
    delete: "/icons/icon-delete.svg",
    add: "/icons/icon-add.svg",
    check: "/icons/icon-check.svg",
    save: "/icons/icon-save.svg",
    reorder: "/icons/icon-reorder.svg",
};

const iconSizes: Record<Exclude<IconType, "none">, string> = {
    edit: "size-[14px]",
    delete: "size-[14px]",
    add: "size-[14px]",
    check: "size-[12px]",
    save: "size-[12px]",
    reorder: "size-[12px]",
};

export default function TextLink({
    href,
    onClick,
    children,
    active = true,
    icon = "none",
    className = "",
}: TextLinkProps) {
    const textColor = active ? "text-black" : "text-medium-gray";

    const content = (
        <>
            {icon !== "none" && (
                <img
                    src={iconPaths[icon]}
                    alt=""
                    className={`${iconSizes[icon]} shrink-0 ${active ? "" : "opacity-50"}`}
                />
            )}
            <span
                className={`nav-link-text uppercase underline whitespace-nowrap ${textColor}`}
            >
                {children}
            </span>
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={`group flex items-center gap-xs ${className}`}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex items-center gap-xs ${className}`}
        >
            {content}
        </button>
    );
}
