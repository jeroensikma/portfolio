"use client";

import { useState, useRef } from "react";
import { Button, TextArea, TextField, TextLink, RadioButton } from "@/components";
import type { MediaSize, HomepageSize, MediaAlignment, ProjectType } from "@/types/project";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const PROJECT_SIZES: { value: MediaSize; label: string }[] = [
    { value: "2-column", label: "2-column" },
    { value: "3-column", label: "3-column" },
    { value: "4-column", label: "4-column" },
    { value: "6-column", label: "6-column" },
    { value: "8-column", label: "8-column" },
];

const HOMEPAGE_SIZES: { value: HomepageSize; label: string }[] = [
    { value: "do-not-show", label: "Do not show" },
    { value: "2-column", label: "2-column" },
    { value: "3-column", label: "3-column" },
    { value: "4-column", label: "4-column" },
    { value: "6-column", label: "6-column" },
    { value: "8-column", label: "8-column" },
];

const ALIGNMENTS: { value: MediaAlignment; label: string }[] = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
];

async function resizeImage(file: File, maxWidth: number): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            if (img.width <= maxWidth) {
                resolve(file);
                return;
            }
            const scale = maxWidth / img.width;
            const canvas = document.createElement("canvas");
            canvas.width = maxWidth;
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(
                            new File([blob], file.name, { type: file.type })
                        );
                    } else {
                        resolve(file);
                    }
                },
                file.type,
                0.9
            );
        };
        img.src = url;
    });
}

export interface MediaData {
    file: File | null;
    previewUrl: string | null;
    typeTag: string | null;
    description: string;
    sizeProject: MediaSize;
    sizeHomepage: HomepageSize;
    alignment: MediaAlignment;
}

interface AddContentOverlayProps {
    availableTypes: ProjectType[];
    onAddType: (name: string) => Promise<void>;
    onSave: (data: MediaData) => string | void | Promise<string | void>;
    onCancel: () => void;
    editData?: MediaData;
}

export default function AddContentOverlay({
    availableTypes,
    onAddType,
    onSave,
    onCancel,
    editData,
}: AddContentOverlayProps) {
    const [file, setFile] = useState<File | null>(editData?.file ?? null);
    const [preview, setPreview] = useState<string | null>(
        editData?.previewUrl ?? null
    );
    const [typeTag, setTypeTag] = useState<string | null>(
        editData?.typeTag ?? null
    );
    const [description, setDescription] = useState(
        editData?.description ?? ""
    );
    const [sizeProject, setSizeProject] = useState<MediaSize>(
        editData?.sizeProject ?? "2-column"
    );
    const [sizeHomepage, setSizeHomepage] = useState<HomepageSize>(
        editData?.sizeHomepage ?? "do-not-show"
    );
    const [alignment, setAlignment] = useState<MediaAlignment>(
        editData?.alignment ?? "left"
    );
    const [addingType, setAddingType] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [editingDescription, setEditingDescription] = useState(false);
    const [overlayError, setOverlayError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setOverlayError(null);

        const isVideo = selected.type.startsWith("video/");
        if (!isVideo && !ALLOWED_IMAGE_TYPES.includes(selected.type)) {
            setOverlayError("Only JPEG, PNG, and WebP images are allowed");
            return;
        }
        if (isVideo && !ALLOWED_VIDEO_TYPES.includes(selected.type)) {
            setOverlayError("Only MP4, WebM, and MOV videos are allowed");
            return;
        }
        if (!isVideo && selected.size > MAX_IMAGE_SIZE) {
            setOverlayError("Image exceeds 10MB limit");
            return;
        }
        if (isVideo && selected.size > MAX_VIDEO_SIZE) {
            setOverlayError("Video exceeds 100MB limit");
            return;
        }

        let processed = selected;
        if (selected.type.startsWith("image/")) {
            processed = await resizeImage(selected, MAX_IMAGE_WIDTH);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(processed));
        } else {
            if (preview) URL.revokeObjectURL(preview);
            setPreview(null);
        }
        setFile(processed);
    }

    async function handleSave() {
        if (!file && !preview || isSaving) return;
        setOverlayError(null);
        setIsSaving(true);
        try {
            const error = await onSave({
                file,
                previewUrl: preview,
                typeTag,
                description,
                sizeProject,
                sizeHomepage,
                alignment,
            });
            if (error) setOverlayError(error);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAddType() {
        if (!newTypeName.trim()) return;
        await onAddType(newTypeName.trim());
        setNewTypeName("");
        setAddingType(false);
    }

    const hasContent = !!file || !!preview;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-[rgba(217,217,217,0.4)] backdrop-blur-[3.65px]"
                onClick={onCancel}
            />

            <div className="relative bg-white w-[680px] max-h-[80vh] overflow-y-auto px-lg py-xl flex flex-col gap-[24px]">
                <TextLink icon="add" onClick={onCancel}>
                    Add content
                </TextLink>

                {hasContent ? (
                    <div className="flex flex-col gap-sm">
                        {preview && (
                            <img
                                src={preview}
                                alt={file?.name ?? ""}
                                className="w-[162px] h-auto"
                            />
                        )}
                        {overlayError && (
                            <p className="text-red">{overlayError}</p>
                        )}
                        {file && (
                            <p className="text-black">
                                {file.name}
                            </p>
                        )}
                        <Button
                            variant="upload"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                        >
                            Replace file
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-sm">
                        {overlayError && (
                            <p className="text-red">{overlayError}</p>
                        )}
                        <Button
                            variant="upload"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-[140px]"
                        >
                            Upload file
                        </Button>
                    </div>
                )}


                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex flex-col gap-sm w-full">
                    <p className="text-black">Type</p>
                    <div className="flex flex-wrap content-center items-center gap-lg">
                        {availableTypes.map((type) => (
                            <RadioButton
                                key={type.id}
                                selected={typeTag === type.name}
                                onChange={() =>
                                    setTypeTag(
                                        typeTag === type.name ? null : type.name
                                    )
                                }
                                label={type.name}
                            />
                        ))}
                    </div>
                    {addingType ? (
                        <div className="flex items-center gap-sm">
                            <TextField
                                value={newTypeName}
                                onChange={setNewTypeName}
                                placeholder="Type name"
                                className="flex-1 min-w-0"
                            />
                            <TextLink icon="check" onClick={handleAddType}>
                                Save
                            </TextLink>
                            <TextLink
                                icon="delete"
                                onClick={() => {
                                    setAddingType(false);
                                    setNewTypeName("");
                                }}
                            >
                                Cancel
                            </TextLink>
                        </div>
                    ) : (
                        <TextLink
                            icon="add"
                            onClick={() => setAddingType(true)}
                        >
                            Add type
                        </TextLink>
                    )}
                </div>

                <div className="flex flex-col gap-sm w-full">
                    <p className="text-black">Description</p>
                    <TextArea
                        value={description}
                        onChange={(val) => {
                            setDescription(val);
                            if (val && !editingDescription) {
                                setEditingDescription(true);
                            }
                        }}
                        placeholder="Add text"
                        className={
                            editingDescription || !description
                                ? ""
                                : "pointer-events-none"
                        }
                    />
                    {(editingDescription || !!description) && (
                        <div className="flex items-start w-full">
                            <div className="flex-1" />
                            <TextLink
                                onClick={() =>
                                    setEditingDescription(!editingDescription)
                                }
                                icon={editingDescription ? "save" : "edit"}
                            >
                                {editingDescription ? "Save" : "Edit"}
                            </TextLink>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-sm w-full">
                    <p className="text-black">Size project page</p>
                    <div className="flex flex-wrap content-center items-center gap-lg">
                        {PROJECT_SIZES.map((s) => (
                            <RadioButton
                                key={s.value}
                                selected={sizeProject === s.value}
                                onChange={() => setSizeProject(s.value)}
                                label={s.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-sm w-full">
                    <p className="text-black">
                        Alignment project page
                    </p>
                    <div className="flex flex-wrap content-center items-center gap-lg">
                        {ALIGNMENTS.map((a) => (
                            <RadioButton
                                key={a.value}
                                selected={alignment === a.value}
                                onChange={() => setAlignment(a.value)}
                                label={a.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-sm w-full">
                    <p className="text-black">Show on homepage</p>
                    <div className="flex flex-wrap content-center items-center gap-lg">
                        {HOMEPAGE_SIZES.map((s) => (
                            <RadioButton
                                key={s.value}
                                selected={sizeHomepage === s.value}
                                onChange={() => setSizeHomepage(s.value)}
                                label={s.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-xs w-full">
                    <Button
                        onClick={handleSave}
                        disabled={!hasContent || isSaving}
                        className="w-full"
                    >
                        {isSaving ? "Saving..." : editData ? "Update" : "Save"}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
