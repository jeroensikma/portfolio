"use client";

interface ReorderArrowsProps {
    onMoveBack?: () => void;
    onMoveForward?: () => void;
}

export default function ReorderArrows({
    onMoveBack,
    onMoveForward,
}: ReorderArrowsProps) {
    return (
        <div className="flex items-center gap-[2px]">
            {onMoveBack && (
                <button type="button" onClick={onMoveBack}>
                    <img
                        src="/icons/icon-arrow-back.svg"
                        alt="Move back"
                        className="size-[14px]"
                    />
                </button>
            )}
            {onMoveForward && (
                <button type="button" onClick={onMoveForward}>
                    <img
                        src="/icons/icon-arrow-forward.svg"
                        alt="Move forward"
                        className="size-[14px]"
                    />
                </button>
            )}
        </div>
    );
}
