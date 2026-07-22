"use client";

import Image from "next/image";
import { Checkbox, TextLink, ReorderArrows } from "@/components";
import VideoStill from "@/components/VideoStill";

interface MediaItemProps {
    previewUrl: string | null;
    filename: string;
    mediaType?: "image" | "video";
    typeTag: string | null;
    description: string;
    showOnHomepage: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onMoveBack?: () => void;
    onMoveForward?: () => void;
}

export default function MediaItem({
    previewUrl,
    filename,
    mediaType,
    typeTag,
    description,
    showOnHomepage,
    onEdit,
    onDelete,
    onMoveBack,
    onMoveForward,
}: MediaItemProps) {
    return (
        <div className="flex flex-col gap-xl items-start w-[162px]">
            <div className="flex flex-col gap-sm items-start w-full">
                {previewUrl ? (
                    mediaType === "video" ? (
                        <VideoStill src={previewUrl} />
                    ) : previewUrl.startsWith("http") ? (
                        <Image
                            src={previewUrl}
                            alt={filename}
                            width={324}
                            height={200}
                            sizes="162px"
                            className="w-full h-auto"
                        />
                    ) : (
                        <img
                            src={previewUrl}
                            alt={filename}
                            className="w-full h-auto"
                        />
                    )
                ) : (
                    <div className="w-full aspect-video bg-medium-gray" />
                )}
                <p className="text-black w-full break-words">
                    {filename}
                </p>
                {typeTag && (
                    <div className="pointer-events-none">
                        <Checkbox
                            checked
                            onChange={() => {}}
                            label={typeTag}
                        />
                    </div>
                )}
            </div>

            {description && (
                <div className="bg-light-gray px-md py-sm w-full">
                    <p className="text-dark-gray leading-[1.2]">
                        {description}
                    </p>
                </div>
            )}

            {showOnHomepage && (
                <div className="pointer-events-none">
                    <Checkbox
                        checked
                        onChange={() => {}}
                        label="Show on homepage"
                    />
                </div>
            )}

            <div className="flex items-start gap-sm w-full">
                <ReorderArrows
                    onMoveBack={onMoveBack}
                    onMoveForward={onMoveForward}
                />
                <div className="flex-1" />
                <div className="flex items-center gap-sm">
                    <TextLink icon="edit" onClick={onEdit}>
                        Edit
                    </TextLink>
                    <TextLink icon="delete" onClick={onDelete}>
                        Delete
                    </TextLink>
                </div>
            </div>
        </div>
    );
}
