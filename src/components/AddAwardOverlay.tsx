"use client";

import { useState, useRef } from "react";
import { Button, TextArea, TextField, TextLink } from "@/components";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface AwardData {
    file: File | null;
    previewUrl: string | null;
    awardTitle: string;
    award: string;
    url: string;
    description: string;
}

interface AddAwardOverlayProps {
    onSave: (data: AwardData) => void;
    onCancel: () => void;
    editData?: AwardData;
    sectionTitle?: string;
    titleLabel?: string;
    subtitleLabel?: string;
}

export default function AddAwardOverlay({
    onSave,
    onCancel,
    editData,
    sectionTitle = "award",
    titleLabel = "Award Title",
    subtitleLabel = "Award",
}: AddAwardOverlayProps) {
    const [file, setFile] = useState<File | null>(editData?.file ?? null);
    const [preview, setPreview] = useState<string | null>(
        editData?.previewUrl ?? null
    );
    const [awardTitle, setAwardTitle] = useState(editData?.awardTitle ?? "");
    const [award, setAward] = useState(editData?.award ?? "");
    const [url, setUrl] = useState(editData?.url ?? "");
    const [description, setDescription] = useState(
        editData?.description ?? ""
    );
    const [editingFields, setEditingFields] = useState<
        Record<string, boolean>
    >({});
    const [fileSizeError, setFileSizeError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function isEditing(fieldKey: string) {
        return editingFields[fieldKey] ?? false;
    }

    function toggleEdit(fieldKey: string) {
        setEditingFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
    }

    function handleFieldChange(
        fieldKey: string,
        setter: (val: string) => void
    ) {
        return (val: string) => {
            setter(val);
            if (val && !isEditing(fieldKey)) {
                setEditingFields((prev) => ({ ...prev, [fieldKey]: true }));
            }
        };
    }

    function fieldClass(fieldKey: string, value: string) {
        return isEditing(fieldKey) || !value ? "" : "pointer-events-none";
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFileSizeError(null);

        if (selected.size > MAX_FILE_SIZE) {
            setFileSizeError("File exceeds 10MB limit");
            return;
        }

        if (selected.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(selected));
        } else {
            setPreview(null);
        }
        setFile(selected);
    }

    function handleSave() {
        onSave({
            file,
            previewUrl: preview,
            awardTitle,
            award,
            url,
            description,
        });
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
                    Add {sectionTitle}
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
                    <Button
                        variant="upload"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[140px]"
                    >
                        Upload file
                    </Button>
                )}

                {fileSizeError && (
                    <p className="text-red">{fileSizeError}</p>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <FieldModule
                    label={titleLabel}
                    value={awardTitle}
                    editing={isEditing("awardTitle")}
                    onToggle={() => toggleEdit("awardTitle")}
                >
                    <TextField
                        value={awardTitle}
                        onChange={handleFieldChange(
                            "awardTitle",
                            setAwardTitle
                        )}
                        placeholder="Text"
                        className={fieldClass("awardTitle", awardTitle)}
                    />
                </FieldModule>

                <FieldModule
                    label={subtitleLabel}
                    value={award}
                    editing={isEditing("award")}
                    onToggle={() => toggleEdit("award")}
                >
                    <TextField
                        value={award}
                        onChange={handleFieldChange("award", setAward)}
                        placeholder="Text"
                        className={fieldClass("award", award)}
                    />
                </FieldModule>

                <FieldModule
                    label="URL"
                    value={url}
                    editing={isEditing("url")}
                    onToggle={() => toggleEdit("url")}
                >
                    <TextField
                        value={url}
                        onChange={handleFieldChange("url", setUrl)}
                        placeholder="Text"
                        className={fieldClass("url", url)}
                    />
                </FieldModule>

                <FieldModule
                    label="Description"
                    value={description}
                    editing={isEditing("description")}
                    onToggle={() => toggleEdit("description")}
                >
                    <TextArea
                        value={description}
                        onChange={handleFieldChange(
                            "description",
                            setDescription
                        )}
                        placeholder="Add text"
                        className={fieldClass("description", description)}
                    />
                </FieldModule>

                <div className="flex flex-col gap-xs w-full">
                    <Button onClick={handleSave} className="w-full">
                        Save
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

function FieldModule({
    label,
    value,
    editing,
    onToggle,
    children,
}: {
    label?: string;
    value: string;
    editing: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    const showButton = editing || !!value;
    return (
        <div className="flex flex-col gap-sm w-full">
            {label && <p className="text-black">{label}</p>}
            {children}
            {showButton && (
                <div className="flex items-start w-full">
                    <div className="flex-1" />
                    <TextLink
                        onClick={onToggle}
                        icon={editing ? "save" : "edit"}
                    >
                        {editing ? "Save" : "Edit"}
                    </TextLink>
                </div>
            )}
        </div>
    );
}
