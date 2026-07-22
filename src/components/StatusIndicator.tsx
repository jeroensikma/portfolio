interface StatusIndicatorProps {
    status: "active" | "draft";
    className?: string;
}

export default function StatusIndicator({
    status,
    className = "",
}: StatusIndicatorProps) {
    return (
        <div className={`flex items-center gap-xs ${className}`}>
            <div
                className={`size-[4px] rounded-full ${status === "active" ? "bg-green" : "bg-red"}`}
            />
            <span
                className={`uppercase ${status === "active" ? "text-black" : "text-medium-gray"}`}
            >
                {status}
            </span>
        </div>
    );
}
