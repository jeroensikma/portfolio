export function generateVideoThumbnail(
    videoUrl: string,
    timeInSeconds = 4
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        video.addEventListener("loadeddata", () => {
            const seekTime = Math.min(timeInSeconds, video.duration - 0.1);
            video.currentTime = Math.max(0, seekTime);
        });

        video.addEventListener("seeked", () => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas context unavailable"));
                return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => {
                    video.src = "";
                    video.load();
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to create thumbnail blob"));
                },
                "image/jpeg",
                0.85
            );
        });

        video.addEventListener("error", () => {
            reject(new Error("Failed to load video"));
        });

        video.src = videoUrl;
    });
}
