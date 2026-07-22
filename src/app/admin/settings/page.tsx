"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
    Header,
    Footer,
    Divider,
    Button,
    TextField,
    TextLink,
} from "@/components";
import ChangePasswordOverlay from "@/components/ChangePasswordOverlay";
import { generateVideoThumbnail } from "@/lib/video-thumbnail";
import type { ProjectMedia } from "@/types/project";

export default function AdminSettings() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [loginBackgroundUrl, setLoginBackgroundUrl] = useState<string | null>(
        null
    );
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
        null
    );
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [editingFields, setEditingFields] = useState<
        Record<string, boolean>
    >({});
    const [thumbProgress, setThumbProgress] = useState<string | null>(null);

    const bgInputRef = useRef<HTMLInputElement>(null);

    const loadData = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            setEmail(user.email || "");
            setFirstName(user.user_metadata?.first_name || "");
        }

        const { data: settings } = await supabase
            .from("site_settings")
            .select("*")
            .single();
        if (settings) {
            setSettingsId(settings.id);
            setLoginBackgroundUrl(settings.login_background_url);
        }
    }, [supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function toggleEdit(fieldKey: string) {
        setEditingFields((prev) => ({
            ...prev,
            [fieldKey]: !prev[fieldKey],
        }));
    }

    function isEditing(fieldKey: string) {
        return editingFields[fieldKey] ?? false;
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

    function handleBackgroundSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setBackgroundFile(file);
        setBackgroundPreview(URL.createObjectURL(file));
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    }

    async function handleGenerateThumbnails() {
        setThumbProgress("Finding videos without thumbnails...");

        const { data: videos } = await supabase
            .from("project_media")
            .select("*")
            .eq("type", "video")
            .is("thumbnail_url", null);

        if (!videos || videos.length === 0) {
            setThumbProgress("All videos already have thumbnails.");
            return;
        }

        for (let i = 0; i < videos.length; i++) {
            const media = videos[i] as ProjectMedia;
            setThumbProgress(
                `Generating thumbnail ${i + 1} of ${videos.length}...`
            );

            try {
                const thumbBlob = await generateVideoThumbnail(media.url);
                const safeName = (media.filename || "video")
                    .replace(/[^a-zA-Z0-9._-]/g, "_")
                    .replace(/\.[^.]+$/, "");
                const thumbPath = `${media.project_id}/${Date.now()}-${safeName}-thumb.jpg`;

                const { error: uploadErr } = await supabase.storage
                    .from("project-media")
                    .upload(thumbPath, thumbBlob, {
                        contentType: "image/jpeg",
                    });

                if (!uploadErr) {
                    const { data: thumbUrl } = supabase.storage
                        .from("project-media")
                        .getPublicUrl(thumbPath);

                    await supabase
                        .from("project_media")
                        .update({ thumbnail_url: thumbUrl.publicUrl })
                        .eq("id", media.id);
                }
            } catch {}
        }

        setThumbProgress(`Done — ${videos.length} thumbnails generated.`);
    }

    async function handleChangePassword(
        newPassword: string
    ): Promise<string | null> {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (error) return error.message;
        setShowChangePassword(false);
        return null;
    }

    async function handleSave() {
        setSaving(true);

        await supabase.auth.updateUser({
            email: email || undefined,
            data: { first_name: firstName },
        });

        const settingsUpdate: Record<string, string> = {
            updated_at: new Date().toISOString(),
        };

        if (backgroundFile && settingsId) {
            const filePath = `settings/login-background`;

            await supabase.storage
                .from("project-media")
                .remove([filePath]);

            await supabase.storage
                .from("project-media")
                .upload(filePath, backgroundFile, {
                    contentType: backgroundFile.type,
                });

            const { data: urlData } = supabase.storage
                .from("project-media")
                .getPublicUrl(filePath);

            settingsUpdate.login_background_url = `${urlData.publicUrl}?t=${Date.now()}`;
            setLoginBackgroundUrl(settingsUpdate.login_background_url);
            setBackgroundFile(null);
            setBackgroundPreview(null);
        }

        if (settingsId) {
            await supabase
                .from("site_settings")
                .update(settingsUpdate)
                .eq("id", settingsId);
        }

        setSaving(false);
    }

    const currentBg = backgroundPreview || loginBackgroundUrl;

    return (
        <div className="flex flex-col min-h-screen">
            <Header type="admin" onLogout={handleLogout} />

            <main className="flex-1">
                <div className="h-[128px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <p className="text-black uppercase w-full">
                        Settings
                    </p>
                    <Divider />
                </div>

                <div className="px-xl py-[24px]">
                    <div className="w-1/2 flex flex-col gap-[24px]">
                        <FieldModule
                            label="First name"
                            value={firstName}
                            editing={isEditing("firstName")}
                            onToggle={() => toggleEdit("firstName")}
                        >
                            <TextField
                                value={firstName}
                                onChange={handleFieldChange(
                                    "firstName",
                                    setFirstName
                                )}
                                placeholder="Text"
                                className={fieldClass("firstName", firstName)}
                            />
                        </FieldModule>

                        <FieldModule
                            label="Email address"
                            value={email}
                            editing={isEditing("email")}
                            onToggle={() => toggleEdit("email")}
                        >
                            <TextField
                                value={email}
                                onChange={handleFieldChange("email", setEmail)}
                                placeholder="Text"
                                className={fieldClass("email", email)}
                            />
                        </FieldModule>

                        <div className="flex flex-col gap-[24px] w-full">
                            <div className="flex flex-col gap-sm w-full">
                                <p className="text-black">
                                    Password
                                </p>
                                <TextField
                                    value="••••••••"
                                    onChange={() => {}}
                                    type="password"
                                    className="pointer-events-none"
                                />
                            </div>
                            <Button
                                onClick={() => setShowChangePassword(true)}
                                className="w-[160px]"
                            >
                                Change password
                            </Button>
                        </div>

                        <div className="flex flex-col gap-md w-full">
                            <p className="text-black">
                                Login screen background
                            </p>
                            {currentBg && (
                                <img
                                    src={currentBg}
                                    alt="Login background"
                                    className="w-[162px] h-auto"
                                />
                            )}
                            <Button
                                onClick={() => bgInputRef.current?.click()}
                                className="w-[160px]"
                            >
                                {currentBg ? "Replace file" : "Upload file"}
                            </Button>
                            <input
                                ref={bgInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleBackgroundSelect}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-xl">
                    <Divider />
                </div>

                <div className="px-xl py-[24px]">
                    <div className="w-1/2 flex flex-col gap-[12px]">
                        <p className="text-black">
                            Video thumbnails
                        </p>
                        <p className="text-dark-gray">
                            Generate thumbnail images for videos that
                            don&apos;t have one yet. Used on the index page
                            to avoid loading full video files.
                        </p>
                        <Button
                            onClick={handleGenerateThumbnails}
                            disabled={
                                thumbProgress !== null &&
                                !thumbProgress.startsWith("Done") &&
                                !thumbProgress.startsWith("All")
                            }
                            className="w-[200px]"
                        >
                            Generate thumbnails
                        </Button>
                        {thumbProgress && (
                            <p className="text-dark-gray">{thumbProgress}</p>
                        )}
                    </div>
                </div>

                <div className="px-xl">
                    <Divider />
                </div>

                <div className="p-xl">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                    >
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </main>

            <Footer />

            {showChangePassword && (
                <ChangePasswordOverlay
                    onSave={handleChangePassword}
                    onCancel={() => setShowChangePassword(false)}
                />
            )}
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
