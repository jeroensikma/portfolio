"use client";

export default function ClickableMedia({
    mediaId,
    children,
}: {
    mediaId: string;
    children: React.ReactNode;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => {
                window.dispatchEvent(
                    new CustomEvent("open-media-overlay", {
                        detail: { mediaId },
                    })
                );
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    window.dispatchEvent(
                        new CustomEvent("open-media-overlay", {
                            detail: { mediaId },
                        })
                    );
                }
            }}
            style={{ cursor: "pointer" }}
        >
            {children}
        </div>
    );
}
