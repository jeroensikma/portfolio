"use client";

import Image from "next/image";
import type { Project, ProjectMedia } from "@/types/project";
import { StatusIndicator, ReorderArrows } from "@/components";
import VideoStill from "@/components/VideoStill";

interface AdminProjectCardProps {
    project: Project;
    media: ProjectMedia[];
    onEdit: () => void;
    onDelete: () => void;
    onMoveBack?: () => void;
    onMoveForward?: () => void;
}

export default function AdminProjectCard({
    project,
    media,
    onEdit,
    onDelete,
    onMoveBack,
    onMoveForward,
}: AdminProjectCardProps) {
    const images = media.filter((m) => m.type === "image");
    const videos = media.filter((m) => m.type === "video");
    const createdDate = new Date(project.created_at).toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
    );

    return (
        <div className="flex flex-col gap-sm w-[340px]">
            <div className="bg-light-gray p-md flex flex-col gap-xl">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-[2px]">
                        <p className="text-black uppercase">
                            {project.title}
                        </p>
                        <p className="text-black">
                            {project.year || new Date(project.created_at).getFullYear()}
                        </p>
                    </div>
                    <div className="flex flex-col gap-[2px] items-end">
                        <StatusIndicator
                            status={project.status === "published" ? "active" : "draft"}
                        />
                        <p className="text-black">{createdDate}</p>
                    </div>
                </div>

                <p className="text-black">
                    {images.length} Images, {videos.length} videos
                </p>

                {media.length > 0 && (
                    <div className="grid grid-cols-4 gap-sm">
                        {media.map((m) => (
                            <div key={m.id} className="overflow-hidden">
                                {m.type === "image" ? (
                                    <Image
                                        src={m.url}
                                        alt={m.alt_text || ""}
                                        width={160}
                                        height={100}
                                        sizes="80px"
                                        className="w-full h-auto"
                                    />
                                ) : m.thumbnail_url ? (
                                    <Image
                                        src={m.thumbnail_url}
                                        alt={m.alt_text || ""}
                                        width={160}
                                        height={100}
                                        sizes="80px"
                                        className="w-full h-auto"
                                    />
                                ) : (
                                    <VideoStill src={m.url} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-sm">
                <ReorderArrows
                    onMoveBack={onMoveBack}
                    onMoveForward={onMoveForward}
                />
                <div className="flex-1" />
                <button
                    onClick={onEdit}
                    className="flex items-center gap-xs text-black uppercase underline"
                >
                    <img
                        src="/icons/icon-edit.svg"
                        alt=""
                        className="size-[14px]"
                    />
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="flex items-center gap-xs text-black uppercase underline"
                >
                    <img
                        src="/icons/icon-delete.svg"
                        alt=""
                        className="size-[14px]"
                    />
                    Delete
                </button>
            </div>
        </div>
    );
}
