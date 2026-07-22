"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
    Header,
    Footer,
    Divider,
    Button,
    TextField,
    TextArea,
    TextLink,
    Checkbox,
} from "@/components";
import AdminProjectCard from "@/components/AdminProjectCard";
import type { Project, ProjectMedia } from "@/types/project";
import type { SiteSettings, SocialLink } from "@/types/settings";

let dashboardCache: {
    projects: Project[];
    projectMedia: Record<string, ProjectMedia[]>;
    settings: SiteSettings;
} | null = null;

export default function AdminHome() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const [projects, setProjects] = useState<Project[]>(
        () => dashboardCache?.projects ?? []
    );
    const [projectMedia, setProjectMedia] = useState<
        Record<string, ProjectMedia[]>
    >(() => dashboardCache?.projectMedia ?? {});
    const [settings, setSettings] = useState<SiteSettings | null>(
        () => dashboardCache?.settings ?? null
    );
    const [introduction, setIntroduction] = useState(
        () => dashboardCache?.settings?.introduction ?? ""
    );
    const [email, setEmail] = useState(
        () => dashboardCache?.settings?.email ?? ""
    );
    const [socials, setSocials] = useState<SocialLink[]>(
        () => dashboardCache?.settings?.socials ?? []
    );
    const [portraitUrl, setPortraitUrl] = useState<string | null>(
        () => dashboardCache?.settings?.portrait_url ?? null
    );
    const [portraitFile, setPortraitFile] = useState<File | null>(null);
    const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [reorderingProjects, setReorderingProjects] = useState(false);

    const portraitInputRef = useRef<HTMLInputElement>(null);

    // Edit state for individual fields
    const [editingFields, setEditingFields] = useState<Record<string, boolean>>(
        {}
    );

    function applyData(
        p: Project[],
        pm: Record<string, ProjectMedia[]>,
        s: SiteSettings
    ) {
        setProjects(p);
        setProjectMedia(pm);
        setSettings(s);
        setIntroduction(s.introduction);
        setEmail(s.email);
        setSocials(s.socials);
        setPortraitUrl(s.portrait_url);
    }

    const loadData = useCallback(async () => {
        const [projectsRes, settingsRes] = await Promise.all([
            supabase
                .from("projects")
                .select("*")
                .order("sort_order", { ascending: true }),
            supabase.from("site_settings").select("*").single(),
        ]);

        if (!projectsRes.data || !settingsRes.data) return;

        const projectIds = projectsRes.data.map((p: Project) => p.id);
        const { data: allMedia } = projectIds.length
            ? await supabase
                  .from("project_media")
                  .select("*")
                  .in("project_id", projectIds)
                  .order("sort_order", { ascending: true })
            : { data: [] as ProjectMedia[] };

        const mediaMap: Record<string, ProjectMedia[]> = {};
        for (const m of allMedia || []) {
            (mediaMap[m.project_id] ??= []).push(m);
        }

        dashboardCache = {
            projects: projectsRes.data,
            projectMedia: mediaMap,
            settings: settingsRes.data,
        };
        applyData(projectsRes.data, mediaMap, settingsRes.data);
    }, [supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    }

    function handlePortraitSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPortraitFile(file);
        setPortraitPreview(URL.createObjectURL(file));
    }

    async function handleSave() {
        if (!settings) return;
        setSaving(true);

        const update: Record<string, unknown> = {
            introduction,
            email,
            socials,
            updated_at: new Date().toISOString(),
        };

        if (portraitFile) {
            const filePath = `settings/portrait`;

            const canvas = document.createElement("canvas");
            const img = new window.Image();
            const loaded = new Promise<void>((resolve) => {
                img.onload = () => resolve();
            });
            img.src = URL.createObjectURL(portraitFile);
            await loaded;

            const maxDim = 1200;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);

            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
            );

            await supabase.storage
                .from("project-media")
                .remove([filePath]);

            await supabase.storage
                .from("project-media")
                .upload(filePath, blob, {
                    contentType: "image/jpeg",
                });

            const { data: urlData } = supabase.storage
                .from("project-media")
                .getPublicUrl(filePath);

            update.portrait_url = `${urlData.publicUrl}?t=${Date.now()}`;
            setPortraitUrl(update.portrait_url as string);
            setPortraitFile(null);
            setPortraitPreview(null);
        }

        await supabase
            .from("site_settings")
            .update(update)
            .eq("id", settings.id);

        dashboardCache = null;
        setSaving(false);
    }

    async function handleDeleteProject(projectId: string) {
        if (!confirm("Are you sure you want to delete this project?")) return;

        await supabase.from("projects").delete().eq("id", projectId);
        dashboardCache = null;
        loadData();
    }

    function handleMoveProject(index: number, direction: -1 | 1) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= projects.length) return;

        const updated = [...projects];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setProjects(updated);
    }

    async function handleSaveProjectOrder() {
        await Promise.all(
            projects.map((project, i) =>
                supabase
                    .from("projects")
                    .update({ sort_order: i })
                    .eq("id", project.id)
            )
        );
        dashboardCache = null;
        setReorderingProjects(false);
    }

    function updateSocial(
        index: number,
        field: keyof SocialLink,
        value: string | boolean
    ) {
        const updated = [...socials];
        updated[index] = { ...updated[index], [field]: value };
        setSocials(updated);
    }

    function toggleEdit(fieldKey: string) {
        setEditingFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
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

    return (
        <div className="flex flex-col min-h-screen">
            <Header type="admin" onLogout={handleLogout} />

            <main className="flex-1">
                {/* Spacer */}
                <div className="h-[128px]" />

                {/* PROJECTS section */}
                <div className="flex flex-col gap-[20px] px-xl">
                    <p className="text-black uppercase w-full">
                        Projects
                    </p>
                    <Divider />
                    <div className="flex items-center gap-md">
                        <TextLink
                            onClick={() => router.push("/admin/projects")}
                            icon="add"
                        >
                            Add project
                        </TextLink>
                        {reorderingProjects ? (
                            <TextLink
                                onClick={handleSaveProjectOrder}
                                icon="save"
                            >
                                Save order
                            </TextLink>
                        ) : (
                            <TextLink
                                onClick={() => setReorderingProjects(true)}
                                icon="reorder"
                            >
                                Reorder
                            </TextLink>
                        )}
                    </div>
                </div>

                {/* Project grid */}
                {projects.length > 0 && (
                    <div className="flex flex-wrap gap-xl p-xl">
                        {projects.map((project, index) => (
                            <AdminProjectCard
                                key={project.id}
                                project={project}
                                media={projectMedia[project.id] || []}
                                onEdit={() =>
                                    router.push(
                                        `/admin/projects?edit=${project.id}`
                                    )
                                }
                                onDelete={() =>
                                    handleDeleteProject(project.id)
                                }
                                onMoveBack={
                                    reorderingProjects && index > 0
                                        ? () => handleMoveProject(index, -1)
                                        : undefined
                                }
                                onMoveForward={
                                    reorderingProjects &&
                                    index < projects.length - 1
                                        ? () => handleMoveProject(index, 1)
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                )}

                {/* Spacer */}
                <div className="h-[80px]" />

                {/* ABOUT section */}
                <div className="flex flex-col gap-[20px] px-xl">
                    <p className="text-black uppercase w-full">
                        About
                    </p>
                    <Divider />
                </div>

                {/* About form — two columns */}
                <div className="flex gap-xl px-xl py-[24px]">
                    {/* Left column: Introduction + Email */}
                    <div className="flex-1 flex flex-col gap-xl">
                        {/* Introduction */}
                        <FieldModule
                            label="Introduction"
                            value={introduction}
                            editing={isEditing("introduction")}
                            onToggle={() => toggleEdit("introduction")}
                        >
                            <TextArea
                                value={introduction}
                                onChange={handleFieldChange(
                                    "introduction",
                                    setIntroduction
                                )}
                                placeholder="Text"
                                className={fieldClass(
                                    "introduction",
                                    introduction
                                )}
                            />
                        </FieldModule>

                        {/* Email */}
                        <FieldModule
                            label="Email"
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

                        {/* Portrait photo */}
                        <div className="flex flex-col gap-md w-full">
                            <p className="text-black">Portrait photo</p>
                            {(portraitPreview || portraitUrl) && (
                                <img
                                    src={portraitPreview || portraitUrl!}
                                    alt="Portrait"
                                    className="w-[162px] h-auto"
                                />
                            )}
                            <Button
                                onClick={() => portraitInputRef.current?.click()}
                                className="w-[160px]"
                            >
                                {portraitPreview || portraitUrl ? "Replace photo" : "Upload photo"}
                            </Button>
                            <input
                                ref={portraitInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePortraitSelect}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Right column: Socials */}
                    <div className="flex-1 flex flex-col gap-xl">
                        {socials.map((social, i) => (
                            <FieldModule
                                key={social.platform}
                                label={i === 0 ? "Social" : undefined}
                                value={social.url}
                                editing={isEditing(`social-${i}`)}
                                onToggle={() => toggleEdit(`social-${i}`)}
                            >
                                <div className="flex items-center gap-sm">
                                    <Checkbox
                                        checked={social.enabled}
                                        onChange={(checked) =>
                                            updateSocial(i, "enabled", checked)
                                        }
                                        label={social.platform}
                                        className="w-[80px]"
                                    />
                                    <TextField
                                        value={social.url}
                                        onChange={(val) => {
                                            updateSocial(i, "url", val);
                                            if (
                                                val &&
                                                !isEditing(`social-${i}`)
                                            ) {
                                                setEditingFields((prev) => ({
                                                    ...prev,
                                                    [`social-${i}`]: true,
                                                }));
                                            }
                                        }}
                                        placeholder="Text"
                                        className={`flex-1 ${fieldClass(
                                            `social-${i}`,
                                            social.url
                                        )}`}
                                    />
                                </div>
                            </FieldModule>
                        ))}
                    </div>
                </div>

                {/* Save button */}
                <div className="px-xl">
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
