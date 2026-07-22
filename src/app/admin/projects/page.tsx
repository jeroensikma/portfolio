"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    RadioButton,
    ReorderArrows,
} from "@/components";
import AddContentOverlay from "@/components/AddContentOverlay";
import type { MediaData } from "@/components/AddContentOverlay";
import AddAwardOverlay from "@/components/AddAwardOverlay";
import type { AwardData } from "@/components/AddAwardOverlay";
import MediaItem from "@/components/MediaItem";
import type {
    IntroPlacement,
    MediaSize,
    HomepageSize,
    ProjectType,
    ProjectMedia,
    Award,
    NewsRecognition,
    CreditEntry,
} from "@/types/project";
import { generateVideoThumbnail } from "@/lib/video-thumbnail";

const INTRO_PLACEMENTS: { value: IntroPlacement; label: string }[] = [
    { value: "right-top", label: "Right side, top-aligned" },
    { value: "right-bottom", label: "Right side, bottom-aligned" },
    { value: "left-top", label: "Left side, top-aligned" },
    { value: "left-bottom", label: "Left side, bottom-aligned" },
    { value: "bottom-left", label: "Bottom side, left-aligned" },
    { value: "bottom-right", label: "Bottom side, right-aligned" },
];

interface ProjectCache {
    project: Record<string, unknown>;
    media: ProjectMedia[];
    awards: Award[];
    newsItems: NewsRecognition[];
}
const projectCache = new Map<string, ProjectCache>();

function extractStoragePath(url: string): string | null {
    const match = url.match(
        /\/storage\/v1\/object\/public\/project-media\/(.+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
}

export default function AddProjectPage() {
    return (
        <Suspense>
            <AddProject />
        </Suspense>
    );
}

function AddProject() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [title, setTitle] = useState("");
    const [year, setYear] = useState("");
    const [introduction, setIntroduction] = useState("");
    const [introPlacement, setIntroPlacement] =
        useState<IntroPlacement>("right-top");
    const [aboutCompany, setAboutCompany] = useState("");
    const [aboutProject, setAboutProject] = useState("");
    const [credits, setCredits] = useState<CreditEntry[]>([]);
    const [showOnHomepage, setShowOnHomepage] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<"published" | "draft">("draft");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [availableTypes, setAvailableTypes] = useState<ProjectType[]>([]);
    const [newTypeName, setNewTypeName] = useState("");
    const [addingType, setAddingType] = useState(false);
    const [saving, setSaving] = useState(false);

    const [existingMedia, setExistingMedia] = useState<ProjectMedia[]>([]);
    const [pendingMedia, setPendingMedia] = useState<MediaData[]>([]);

    const [showAddContent, setShowAddContent] = useState(false);
    const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(
        null
    );
    const [editingExistingMedia, setEditingExistingMedia] =
        useState<ProjectMedia | null>(null);

    const [existingAwards, setExistingAwards] = useState<Award[]>([]);
    const [deletedAwardIds, setDeletedAwardIds] = useState<string[]>([]);
    const [pendingAwards, setPendingAwards] = useState<AwardData[]>([]);
    const [showAddAward, setShowAddAward] = useState(false);
    const [editingAwardIndex, setEditingAwardIndex] = useState<number | null>(
        null
    );
    const [editingExistingAward, setEditingExistingAward] =
        useState<Award | null>(null);

    const [existingNews, setExistingNews] = useState<NewsRecognition[]>([]);
    const [deletedNewsIds, setDeletedNewsIds] = useState<string[]>([]);
    const [pendingNews, setPendingNews] = useState<AwardData[]>([]);
    const [showAddNews, setShowAddNews] = useState(false);
    const [editingNewsIndex, setEditingNewsIndex] = useState<number | null>(null);
    const [editingExistingNews, setEditingExistingNews] =
        useState<NewsRecognition | null>(null);

    const [reorderingContent, setReorderingContent] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const [editingFields, setEditingFields] = useState<
        Record<string, boolean>
    >({});

    const loadTypes = useCallback(async () => {
        const { data } = await supabase
            .from("project_types")
            .select("*")
            .order("name", { ascending: true });
        if (data) setAvailableTypes(data);
    }, [supabase]);

    function applyProjectData(
        project: Record<string, unknown>,
        media: ProjectMedia[],
        awards: Award[],
        newsItems: NewsRecognition[] = []
    ) {
        setTitle(project.title as string);
        setYear((project.year as string) || "");
        setIntroduction((project.introduction as string) || "");
        setIntroPlacement(project.intro_placement as IntroPlacement);
        setAboutCompany((project.about_company as string) || "");
        setAboutProject((project.about_project as string) || "");
        setCredits(
            ((project.credits as CreditEntry[]) || []).filter(
                (c: CreditEntry) => c.role || c.name
            )
        );
        setShowOnHomepage(project.show_on_homepage as boolean);
        setCurrentStatus(project.status as "published" | "draft");
        setSelectedTypes((project.types as string[]) || []);
        setExistingMedia(media);
        setExistingAwards(awards);
        setExistingNews(newsItems);
    }

    const loadProject = useCallback(
        async (id: string) => {
            const cached = projectCache.get(id);
            if (cached) {
                applyProjectData(cached.project, cached.media, cached.awards, cached.newsItems);
            }

            const [projectRes, mediaRes, awardsRes, newsRes] = await Promise.all([
                supabase.from("projects").select("*").eq("id", id).single(),
                supabase
                    .from("project_media")
                    .select("*")
                    .eq("project_id", id)
                    .order("sort_order", { ascending: true }),
                supabase
                    .from("awards")
                    .select("*")
                    .eq("project_id", id)
                    .order("sort_order", { ascending: true }),
                supabase
                    .from("news_recognition")
                    .select("*")
                    .eq("project_id", id)
                    .order("sort_order", { ascending: true }),
            ]);

            if (projectRes.data) {
                const entry = {
                    project: projectRes.data,
                    media: mediaRes.data || [],
                    awards: awardsRes.data || [],
                    newsItems: newsRes.data || [],
                };
                projectCache.set(id, entry);
                applyProjectData(entry.project, entry.media, entry.awards, entry.newsItems);
            }
        },
        [supabase]
    );

    useEffect(() => {
        if (loaded) return;
        setLoaded(true);
        loadTypes();
        if (editId) loadProject(editId);
    }, [loaded, editId, loadTypes, loadProject]);

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

    function toggleType(typeName: string) {
        setSelectedTypes((prev) =>
            prev.includes(typeName)
                ? prev.filter((t) => t !== typeName)
                : [...prev, typeName]
        );
    }

    async function addType(name: string) {
        const { data } = await supabase
            .from("project_types")
            .insert({ name })
            .select()
            .single();
        if (data) {
            setAvailableTypes((prev) =>
                [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
            );
        }
    }

    async function handleAddType() {
        if (!newTypeName.trim()) return;
        setAddingType(true);
        await addType(newTypeName.trim());
        setNewTypeName("");
        setAddingType(false);
    }

    async function handleDeleteMedia(mediaId: string) {
        const media = existingMedia.find((m) => m.id === mediaId);
        if (!media) return;
        const path = extractStoragePath(media.url);
        if (path)
            await supabase.storage.from("project-media").remove([path]);
        await supabase.from("project_media").delete().eq("id", mediaId);
        setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
        if (editId) projectCache.delete(editId);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    }

    async function handleSave(status: "published" | "draft") {
        setSaving(true);

        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        let projectId = editId;

        if (editId) {
            const { error } = await supabase
                .from("projects")
                .update({
                    title,
                    slug,
                    year: year || null,
                    types: selectedTypes,
                    description: introduction || "",
                    introduction: introduction || null,
                    intro_placement: introPlacement,
                    about_company: aboutCompany || null,
                    about_project: aboutProject || null,
                    credits: credits.filter((c) => c.role || c.name),
                    show_on_homepage: showOnHomepage,
                    status,
                })
                .eq("id", editId);
            if (error) {
                setSaving(false);
                return;
            }
        } else {
            const { data: existing } = await supabase
                .from("projects")
                .select("id, sort_order")
                .order("sort_order", { ascending: true });
            if (existing) {
                for (const p of existing) {
                    await supabase
                        .from("projects")
                        .update({ sort_order: (p.sort_order ?? 0) + 1 })
                        .eq("id", p.id);
                }
            }

            const { data, error } = await supabase
                .from("projects")
                .insert({
                    title,
                    slug,
                    year: year || null,
                    types: selectedTypes,
                    description: introduction || "",
                    introduction: introduction || null,
                    intro_placement: introPlacement,
                    about_company: aboutCompany || null,
                    about_project: aboutProject || null,
                    credits: credits.filter((c) => c.role || c.name),
                    show_on_homepage: showOnHomepage,
                    status,
                    sort_order: 0,
                })
                .select("id")
                .single();
            if (error || !data) {
                setSaving(false);
                return;
            }
            projectId = data.id;
        }

        const activeExisting = existingMedia;
        for (let i = 0; i < activeExisting.length; i++) {
            const media = activeExisting[i];
            await supabase
                .from("project_media")
                .update({
                    type_tag: media.type_tag,
                    description: media.description,
                    size_project: media.size_project,
                    size_homepage: media.size_homepage,
                    alignment: media.alignment,
                    sort_order: i,
                })
                .eq("id", media.id);
        }

        for (let i = 0; i < pendingMedia.length; i++) {
            const media = pendingMedia[i];
            if (!media.file) continue;

            const timestamp = Date.now();
            const safeName = media.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const filePath = `${projectId}/${timestamp}-${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from("project-media")
                .upload(filePath, media.file);

            if (uploadError) continue;

            const { data: urlData } = supabase.storage
                .from("project-media")
                .getPublicUrl(filePath);

            const isVideo = media.file.type.startsWith("video/");
            let thumbnailUrl: string | null = null;

            if (isVideo) {
                try {
                    const thumbBlob = await generateVideoThumbnail(
                        urlData.publicUrl
                    );
                    const thumbPath = `${projectId}/${timestamp}-${safeName.replace(/\.[^.]+$/, "")}-thumb.jpg`;
                    const { error: thumbErr } = await supabase.storage
                        .from("project-media")
                        .upload(thumbPath, thumbBlob, {
                            contentType: "image/jpeg",
                        });
                    if (!thumbErr) {
                        const { data: thumbUrl } = supabase.storage
                            .from("project-media")
                            .getPublicUrl(thumbPath);
                        thumbnailUrl = thumbUrl.publicUrl;
                    }
                } catch {}
            }

            await supabase.from("project_media").insert({
                project_id: projectId,
                url: urlData.publicUrl,
                filename: media.file.name,
                type: isVideo ? "video" : "image",
                type_tag: media.typeTag,
                description: media.description || null,
                size_project: media.sizeProject,
                size_homepage: media.sizeHomepage,
                alignment: media.alignment,
                thumbnail_url: thumbnailUrl,
                sort_order: activeExisting.length + i,
            });
        }

        for (const awardId of deletedAwardIds) {
            const award = existingAwards.find((a) => a.id === awardId);
            if (award?.image_url) {
                const path = extractStoragePath(award.image_url);
                if (path)
                    await supabase.storage
                        .from("project-media")
                        .remove([path]);
            }
            await supabase.from("awards").delete().eq("id", awardId);
        }

        const activeAwards = existingAwards.filter(
            (a) => !deletedAwardIds.includes(a.id)
        );
        for (let i = 0; i < activeAwards.length; i++) {
            const award = activeAwards[i];
            await supabase
                .from("awards")
                .update({
                    title: award.title,
                    award: award.award,
                    url: award.url,
                    description: award.description,
                    sort_order: i,
                })
                .eq("id", award.id);
        }

        for (let i = 0; i < pendingAwards.length; i++) {
            const award = pendingAwards[i];
            let imageUrl: string | null = null;

            if (award.file) {
                const timestamp = Date.now();
                const safeName = award.file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );
                const filePath = `${projectId}/awards/${timestamp}-${safeName}`;

                const { error: uploadError } = await supabase.storage
                    .from("project-media")
                    .upload(filePath, award.file);

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from("project-media")
                        .getPublicUrl(filePath);
                    imageUrl = urlData.publicUrl;
                }
            }

            await supabase.from("awards").insert({
                project_id: projectId,
                title: award.awardTitle,
                award: award.award,
                url: award.url || null,
                description: award.description || null,
                image_url: imageUrl,
                sort_order: activeAwards.length + i,
            });
        }

        for (const newsId of deletedNewsIds) {
            const news = existingNews.find((n) => n.id === newsId);
            if (news?.image_url) {
                const path = extractStoragePath(news.image_url);
                if (path)
                    await supabase.storage
                        .from("project-media")
                        .remove([path]);
            }
            await supabase.from("news_recognition").delete().eq("id", newsId);
        }

        const activeNewsItems = existingNews.filter(
            (n) => !deletedNewsIds.includes(n.id)
        );
        for (let i = 0; i < activeNewsItems.length; i++) {
            const news = activeNewsItems[i];
            await supabase
                .from("news_recognition")
                .update({
                    title: news.title,
                    award: news.award,
                    url: news.url,
                    description: news.description,
                    sort_order: i,
                })
                .eq("id", news.id);
        }

        for (let i = 0; i < pendingNews.length; i++) {
            const news = pendingNews[i];
            let imageUrl: string | null = null;

            if (news.file) {
                const timestamp = Date.now();
                const safeName = news.file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );
                const filePath = `${projectId}/news/${timestamp}-${safeName}`;

                const { error: uploadError } = await supabase.storage
                    .from("project-media")
                    .upload(filePath, news.file);

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from("project-media")
                        .getPublicUrl(filePath);
                    imageUrl = urlData.publicUrl;
                }
            }

            await supabase.from("news_recognition").insert({
                project_id: projectId,
                title: news.awardTitle,
                award: news.award,
                url: news.url || null,
                description: news.description || null,
                image_url: imageUrl,
                sort_order: activeNewsItems.length + i,
            });
        }

        if (editId) projectCache.delete(editId);
        setSaving(false);
    }

    function openAddContent() {
        setEditingMediaIndex(null);
        setEditingExistingMedia(null);
        setShowAddContent(true);
    }

    function getOverlayEditData(): MediaData | undefined {
        if (editingMediaIndex !== null) {
            return pendingMedia[editingMediaIndex];
        }
        if (editingExistingMedia) {
            return {
                file: null,
                previewUrl: editingExistingMedia.url,
                typeTag: editingExistingMedia.type_tag,
                description: editingExistingMedia.description || "",
                sizeProject: editingExistingMedia.size_project as MediaSize,
                sizeHomepage:
                    editingExistingMedia.size_homepage as HomepageSize,
                alignment: editingExistingMedia.alignment ?? "left",
            };
        }
        return undefined;
    }

    async function handleOverlaySave(data: MediaData) {
        if (data.typeTag) {
            setSelectedTypes((prev) =>
                prev.includes(data.typeTag!)
                    ? prev
                    : [...prev, data.typeTag!]
            );
        }

        if (editingMediaIndex !== null) {
            setPendingMedia((prev) =>
                prev.map((m, i) => (i === editingMediaIndex ? data : m))
            );
        } else if (editingExistingMedia) {
            if (data.file) {
                const timestamp = Date.now();
                const safeName = data.file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );
                const filePath = `${editId}/${timestamp}-${safeName}`;

                const { error: uploadError } = await supabase.storage
                    .from("project-media")
                    .upload(filePath, data.file);

                if (uploadError) {
                    return `Upload failed: ${uploadError.message}`;
                }

                const { data: urlData } = supabase.storage
                    .from("project-media")
                    .getPublicUrl(filePath);

                const { error: dbError } = await supabase
                    .from("project_media")
                    .update({
                        url: urlData.publicUrl,
                        filename: data.file.name,
                        type: data.file.type.startsWith("video/")
                            ? "video"
                            : "image",
                        type_tag: data.typeTag,
                        description: data.description || null,
                        size_project: data.sizeProject,
                        size_homepage: data.sizeHomepage,
                        alignment: data.alignment,
                    })
                    .eq("id", editingExistingMedia.id);

                if (dbError) {
                    await supabase.storage
                        .from("project-media")
                        .remove([filePath]);
                    return `Failed to save media: ${dbError.message}`;
                }

                const oldPath = extractStoragePath(
                    editingExistingMedia.url
                );
                if (oldPath)
                    await supabase.storage
                        .from("project-media")
                        .remove([oldPath]);

                setExistingMedia((prev) =>
                    prev.map((m) =>
                        m.id !== editingExistingMedia.id
                            ? m
                            : {
                                  ...m,
                                  url: urlData.publicUrl,
                                  filename: data.file!.name,
                                  type: data.file!.type.startsWith(
                                      "video/"
                                  )
                                      ? "video"
                                      : "image",
                                  type_tag: data.typeTag,
                                  description:
                                      data.description || null,
                                  size_project: data.sizeProject,
                                  size_homepage: data.sizeHomepage,
                                  alignment: data.alignment,
                              }
                    )
                );
            } else {
                await supabase
                    .from("project_media")
                    .update({
                        type_tag: data.typeTag,
                        description: data.description || null,
                        size_project: data.sizeProject,
                        size_homepage: data.sizeHomepage,
                        alignment: data.alignment,
                    })
                    .eq("id", editingExistingMedia.id);

                setExistingMedia((prev) =>
                    prev.map((m) => {
                        if (m.id !== editingExistingMedia.id) return m;
                        return {
                            ...m,
                            type_tag: data.typeTag,
                            description: data.description,
                            size_project: data.sizeProject,
                            size_homepage: data.sizeHomepage,
                            alignment: data.alignment,
                        };
                    })
                );
            }
        } else if (editId && data.file) {
            const timestamp = Date.now();
            const safeName = data.file.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );
            const filePath = `${editId}/${timestamp}-${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from("project-media")
                .upload(filePath, data.file);

            if (uploadError) {
                return `Upload failed: ${uploadError.message}`;
            }

            const { data: urlData } = supabase.storage
                .from("project-media")
                .getPublicUrl(filePath);

            const { data: inserted, error: dbError } = await supabase
                .from("project_media")
                .insert({
                    project_id: editId,
                    url: urlData.publicUrl,
                    filename: data.file.name,
                    type: data.file.type.startsWith("video/")
                        ? "video"
                        : "image",
                    type_tag: data.typeTag,
                    description: data.description || null,
                    size_project: data.sizeProject,
                    size_homepage: data.sizeHomepage,
                    alignment: data.alignment,
                    sort_order: existingMedia.length,
                })
                .select()
                .single();

            if (dbError) {
                await supabase.storage
                    .from("project-media")
                    .remove([filePath]);
                return `Failed to save media: ${dbError.message}`;
            } else if (inserted) {
                setExistingMedia((prev) => [...prev, inserted]);
            }
        } else {
            setPendingMedia((prev) => [...prev, data]);
        }
        setShowAddContent(false);
        setEditingMediaIndex(null);
        setEditingExistingMedia(null);
    }

    function handleOverlayCancel() {
        setShowAddContent(false);
        setEditingMediaIndex(null);
        setEditingExistingMedia(null);
    }

    function openAddAward() {
        setEditingAwardIndex(null);
        setEditingExistingAward(null);
        setShowAddAward(true);
    }

    function getAwardEditData(): AwardData | undefined {
        if (editingAwardIndex !== null) {
            return pendingAwards[editingAwardIndex];
        }
        if (editingExistingAward) {
            return {
                file: null,
                previewUrl: editingExistingAward.image_url,
                awardTitle: editingExistingAward.title,
                award: editingExistingAward.award,
                url: editingExistingAward.url || "",
                description: editingExistingAward.description || "",
            };
        }
        return undefined;
    }

    function handleAwardSave(data: AwardData) {
        if (editingAwardIndex !== null) {
            setPendingAwards((prev) =>
                prev.map((a, i) => (i === editingAwardIndex ? data : a))
            );
        } else if (editingExistingAward) {
            if (data.file) {
                setDeletedAwardIds((prev) => [
                    ...prev,
                    editingExistingAward.id,
                ]);
                setPendingAwards((prev) => [...prev, data]);
            } else {
                setExistingAwards((prev) =>
                    prev.map((a) => {
                        if (a.id !== editingExistingAward.id) return a;
                        return {
                            ...a,
                            title: data.awardTitle,
                            award: data.award,
                            url: data.url || null,
                            description: data.description,
                        };
                    })
                );
            }
        } else {
            setPendingAwards((prev) => [...prev, data]);
        }
        setShowAddAward(false);
        setEditingAwardIndex(null);
        setEditingExistingAward(null);
    }

    function handleAwardCancel() {
        setShowAddAward(false);
        setEditingAwardIndex(null);
        setEditingExistingAward(null);
    }

    function openAddNews() {
        setEditingNewsIndex(null);
        setEditingExistingNews(null);
        setShowAddNews(true);
    }

    function getNewsEditData(): AwardData | undefined {
        if (editingNewsIndex !== null) {
            return pendingNews[editingNewsIndex];
        }
        if (editingExistingNews) {
            return {
                file: null,
                previewUrl: editingExistingNews.image_url,
                awardTitle: editingExistingNews.title,
                award: editingExistingNews.award,
                url: editingExistingNews.url || "",
                description: editingExistingNews.description || "",
            };
        }
        return undefined;
    }

    function handleNewsSave(data: AwardData) {
        if (editingNewsIndex !== null) {
            setPendingNews((prev) =>
                prev.map((a, i) => (i === editingNewsIndex ? data : a))
            );
        } else if (editingExistingNews) {
            if (data.file) {
                setDeletedNewsIds((prev) => [...prev, editingExistingNews.id]);
                setPendingNews((prev) => [...prev, data]);
            } else {
                setExistingNews((prev) =>
                    prev.map((a) => {
                        if (a.id !== editingExistingNews.id) return a;
                        return {
                            ...a,
                            title: data.awardTitle,
                            award: data.award,
                            url: data.url || null,
                            description: data.description,
                        };
                    })
                );
            }
        } else {
            setPendingNews((prev) => [...prev, data]);
        }
        setShowAddNews(false);
        setEditingNewsIndex(null);
        setEditingExistingNews(null);
    }

    function handleNewsCancel() {
        setShowAddNews(false);
        setEditingNewsIndex(null);
        setEditingExistingNews(null);
    }

    const activeExisting = existingMedia;
    const activeAwards = existingAwards.filter(
        (a) => !deletedAwardIds.includes(a.id)
    );
    const activeNews = existingNews.filter(
        (n) => !deletedNewsIds.includes(n.id)
    );

    function handleMoveExistingMedia(fromIdx: number, direction: -1 | 1) {
        const toIdx = fromIdx + direction;
        if (toIdx < 0 || toIdx >= activeExisting.length) return;
        const fromId = activeExisting[fromIdx].id;
        const toId = activeExisting[toIdx].id;
        setExistingMedia((prev) => {
            const updated = [...prev];
            const fi = updated.findIndex((m) => m.id === fromId);
            const ti = updated.findIndex((m) => m.id === toId);
            [updated[fi], updated[ti]] = [updated[ti], updated[fi]];
            return updated;
        });
    }

    function handleMovePendingMedia(fromIdx: number, direction: -1 | 1) {
        const toIdx = fromIdx + direction;
        if (toIdx < 0 || toIdx >= pendingMedia.length) return;
        setPendingMedia((prev) => {
            const updated = [...prev];
            [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
            return updated;
        });
    }

    function handleMoveExistingAward(fromIdx: number, direction: -1 | 1) {
        const toIdx = fromIdx + direction;
        if (toIdx < 0 || toIdx >= activeAwards.length) return;
        const fromId = activeAwards[fromIdx].id;
        const toId = activeAwards[toIdx].id;
        setExistingAwards((prev) => {
            const updated = [...prev];
            const fi = updated.findIndex((a) => a.id === fromId);
            const ti = updated.findIndex((a) => a.id === toId);
            [updated[fi], updated[ti]] = [updated[ti], updated[fi]];
            return updated;
        });
    }

    function handleMovePendingAward(fromIdx: number, direction: -1 | 1) {
        const toIdx = fromIdx + direction;
        if (toIdx < 0 || toIdx >= pendingAwards.length) return;
        setPendingAwards((prev) => {
            const updated = [...prev];
            [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
            return updated;
        });
    }

    function handleMoveExistingNews(fromIdx: number, direction: -1 | 1) {
        const toIdx = fromIdx + direction;
        if (toIdx < 0 || toIdx >= activeNews.length) return;
        const fromId = activeNews[fromIdx].id;
        const toId = activeNews[toIdx].id;
        setExistingNews((prev) => {
            const updated = [...prev];
            const fi = updated.findIndex((a) => a.id === fromId);
            const ti = updated.findIndex((a) => a.id === toId);
            [updated[fi], updated[ti]] = [updated[ti], updated[fi]];
            return updated;
        });
    }

    function handleMovePendingNews(fromIdx: number, direction: -1 | 1) {
        const toIdx = fromIdx + direction;
        if (toIdx < 0 || toIdx >= pendingNews.length) return;
        setPendingNews((prev) => {
            const updated = [...prev];
            [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
            return updated;
        });
    }

    async function handleSaveContentOrder() {
        await Promise.all(
            existingMedia.map((media, i) =>
                supabase
                    .from("project_media")
                    .update({ sort_order: i })
                    .eq("id", media.id)
            )
        );
        setReorderingContent(false);
    }

    const imageCount =
        activeExisting.filter((m) => m.type === "image").length +
        pendingMedia.filter((m) => m.file?.type.startsWith("image/")).length;
    const videoCount =
        activeExisting.filter((m) => m.type === "video").length +
        pendingMedia.filter((m) => m.file?.type.startsWith("video/")).length;
    const hasMedia = activeExisting.length + pendingMedia.length > 0;

    return (
        <div className="flex flex-col min-h-screen">
            <Header type="admin" onLogout={handleLogout} />

            <main className="flex-1">
                <div className="h-[128px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <div className="flex items-start gap-xs">
                        <TextLink href="/admin">Projects</TextLink>
                        <span className="text-black">/</span>
                        <span className="text-black uppercase">
                            {editId ? "Project details" : "Add project"}
                        </span>
                    </div>

                    <Divider />

                    <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-md">
                            <TextLink icon="add" onClick={openAddContent}>
                                Add content
                            </TextLink>
                            {reorderingContent ? (
                                <TextLink
                                    onClick={handleSaveContentOrder}
                                    icon="save"
                                >
                                    Save order
                                </TextLink>
                            ) : (
                                <TextLink
                                    onClick={() => setReorderingContent(true)}
                                    icon="reorder"
                                >
                                    Reorder
                                </TextLink>
                            )}
                        </div>
                        <span className="text-black">
                            {imageCount} Images, {videoCount} videos
                        </span>
                    </div>
                </div>

                {hasMedia && (
                    <div className="flex flex-wrap content-start items-start gap-xl p-xl">
                        {activeExisting.map((media, idx) => (
                            <MediaItem
                                key={media.id}
                                previewUrl={media.url}
                                mediaType={media.type === "video" ? "video" : "image"}
                                filename={media.filename || ""}
                                typeTag={media.type_tag}
                                description={media.description || ""}
                                showOnHomepage={
                                    media.size_homepage !== "do-not-show"
                                }
                                onEdit={() => {
                                    setEditingExistingMedia(media);
                                    setShowAddContent(true);
                                }}
                                onDelete={() =>
                                    handleDeleteMedia(media.id)
                                }
                                onMoveBack={
                                    reorderingContent && idx > 0
                                        ? () => handleMoveExistingMedia(idx, -1)
                                        : undefined
                                }
                                onMoveForward={
                                    reorderingContent &&
                                    idx < activeExisting.length - 1
                                        ? () => handleMoveExistingMedia(idx, 1)
                                        : undefined
                                }
                            />
                        ))}
                        {pendingMedia.map((media, index) => (
                            <MediaItem
                                key={`pending-${index}`}
                                previewUrl={media.previewUrl}
                                mediaType={media.file?.type.startsWith("video/") ? "video" : "image"}
                                filename={media.file?.name || ""}
                                typeTag={media.typeTag}
                                description={media.description}
                                showOnHomepage={
                                    media.sizeHomepage !== "do-not-show"
                                }
                                onEdit={() => {
                                    setEditingMediaIndex(index);
                                    setShowAddContent(true);
                                }}
                                onDelete={() =>
                                    setPendingMedia((prev) =>
                                        prev.filter((_, i) => i !== index)
                                    )
                                }
                                onMoveBack={
                                    reorderingContent && index > 0
                                        ? () => handleMovePendingMedia(index, -1)
                                        : undefined
                                }
                                onMoveForward={
                                    reorderingContent &&
                                    index < pendingMedia.length - 1
                                        ? () => handleMovePendingMedia(index, 1)
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                )}

                <div className="h-[80px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <p className="text-black uppercase w-full">
                        Project information
                    </p>
                    <Divider />
                </div>

                <div className="flex gap-xl px-xl py-[24px]">
                    <div className="flex-1 flex flex-col gap-[24px]">
                        <FieldModule
                            label="Project name"
                            value={title}
                            editing={isEditing("title")}
                            onToggle={() => toggleEdit("title")}
                        >
                            <TextField
                                value={title}
                                onChange={handleFieldChange("title", setTitle)}
                                placeholder="Text"
                                className={fieldClass("title", title)}
                            />
                        </FieldModule>

                        <FieldModule
                            label="Year"
                            value={year}
                            editing={isEditing("year")}
                            onToggle={() => toggleEdit("year")}
                        >
                            <TextField
                                value={year}
                                onChange={handleFieldChange("year", setYear)}
                                placeholder="Text"
                                className={fieldClass("year", year)}
                            />
                        </FieldModule>

                        <div className="flex flex-col gap-sm w-full">
                            <p className="text-black">Types</p>
                            <div className="flex flex-wrap content-center items-center gap-x-lg gap-y-xs">
                                {availableTypes.map((type) => (
                                    <Checkbox
                                        key={type.id}
                                        checked={selectedTypes.includes(
                                            type.name
                                        )}
                                        onChange={() => toggleType(type.name)}
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
                                        className="w-[140px]"
                                    />
                                    <TextLink
                                        icon="check"
                                        onClick={handleAddType}
                                    >
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
                            <p className="text-black">Credits</p>
                            {credits.map((entry, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-sm"
                                >
                                    <div className="flex gap-sm flex-1 min-w-0">
                                        <TextField
                                            value={entry.role}
                                            onChange={(val) => {
                                                const updated = [
                                                    ...credits,
                                                ];
                                                updated[i] = {
                                                    ...updated[i],
                                                    role: val,
                                                };
                                                setCredits(updated);
                                            }}
                                            placeholder="Role"
                                            className="w-1/2 min-w-0"
                                        />
                                        <TextField
                                            value={entry.name}
                                            onChange={(val) => {
                                                const updated = [
                                                    ...credits,
                                                ];
                                                updated[i] = {
                                                    ...updated[i],
                                                    name: val,
                                                };
                                                setCredits(updated);
                                            }}
                                            placeholder="Name"
                                            className="w-1/2 min-w-0"
                                        />
                                    </div>
                                    <TextLink
                                        icon="delete"
                                        onClick={() =>
                                            setCredits((prev) =>
                                                prev.filter(
                                                    (_, idx) => idx !== i
                                                )
                                            )
                                        }
                                    >
                                        Delete
                                    </TextLink>
                                </div>
                            ))}
                            <TextLink
                                icon="add"
                                onClick={() =>
                                    setCredits((prev) => [
                                        ...prev,
                                        { role: "", name: "" },
                                    ])
                                }
                            >
                                Add role
                            </TextLink>
                        </div>

                        <Checkbox
                            checked={showOnHomepage}
                            onChange={setShowOnHomepage}
                            label="Show on homepage"
                        />
                    </div>

                    <div className="flex-1 flex flex-col gap-[24px]">
                        <div className="flex flex-col gap-sm w-full">
                            <p className="text-black">
                                Introduction
                            </p>
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
                            <div className="flex items-start gap-md w-full">
                                <div className="flex-1 flex flex-wrap content-center items-center gap-x-sm gap-y-xs">
                                    {INTRO_PLACEMENTS.map((p) => (
                                        <RadioButton
                                            key={p.value}
                                            selected={
                                                introPlacement === p.value
                                            }
                                            onChange={() =>
                                                setIntroPlacement(p.value)
                                            }
                                            label={p.label}
                                        />
                                    ))}
                                </div>
                                <div className="flex-1" />
                                {(isEditing("introduction") ||
                                    !!introduction) && (
                                    <TextLink
                                        onClick={() =>
                                            toggleEdit("introduction")
                                        }
                                        icon={
                                            isEditing("introduction")
                                                ? "save"
                                                : "edit"
                                        }
                                    >
                                        {isEditing("introduction")
                                            ? "Save"
                                            : "Edit"}
                                    </TextLink>
                                )}
                            </div>
                        </div>

                        <FieldModule
                            label="About the company"
                            value={aboutCompany}
                            editing={isEditing("aboutCompany")}
                            onToggle={() => toggleEdit("aboutCompany")}
                        >
                            <TextArea
                                value={aboutCompany}
                                onChange={handleFieldChange(
                                    "aboutCompany",
                                    setAboutCompany
                                )}
                                placeholder="Text"
                                className={fieldClass(
                                    "aboutCompany",
                                    aboutCompany
                                )}
                            />
                        </FieldModule>

                        <FieldModule
                            label="About the project"
                            value={aboutProject}
                            editing={isEditing("aboutProject")}
                            onToggle={() => toggleEdit("aboutProject")}
                        >
                            <TextArea
                                value={aboutProject}
                                onChange={handleFieldChange(
                                    "aboutProject",
                                    setAboutProject
                                )}
                                placeholder="Text"
                                className={fieldClass(
                                    "aboutProject",
                                    aboutProject
                                )}
                            />
                        </FieldModule>
                    </div>
                </div>

                <div className="h-[40px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <div className="flex items-start justify-between w-full">
                        <p className="text-black uppercase">
                            Awards
                        </p>
                        <span className="text-black">
                            {activeAwards.length + pendingAwards.length} Awards
                        </span>
                    </div>
                    <Divider />
                    <TextLink icon="add" onClick={openAddAward}>
                        Add award
                    </TextLink>
                </div>

                {(activeAwards.length > 0 || pendingAwards.length > 0) && (
                    <div className="flex flex-wrap content-start items-start gap-xl p-xl">
                        {activeAwards.map((award, idx) => (
                            <AwardItem
                                key={award.id}
                                title={award.title}
                                award={award.award}
                                description={award.description || ""}
                                previewUrl={award.image_url}
                                onEdit={() => {
                                    setEditingExistingAward(award);
                                    setShowAddAward(true);
                                }}
                                onDelete={() =>
                                    setDeletedAwardIds((prev) => [
                                        ...prev,
                                        award.id,
                                    ])
                                }
                                onMoveBack={undefined}
                                onMoveForward={undefined}
                            />
                        ))}
                        {pendingAwards.map((award, index) => (
                            <AwardItem
                                key={`pending-${index}`}
                                title={award.awardTitle}
                                award={award.award}
                                description={award.description}
                                previewUrl={award.previewUrl}
                                onEdit={() => {
                                    setEditingAwardIndex(index);
                                    setShowAddAward(true);
                                }}
                                onDelete={() =>
                                    setPendingAwards((prev) =>
                                        prev.filter((_, i) => i !== index)
                                    )
                                }
                                onMoveBack={undefined}
                                onMoveForward={undefined}
                            />
                        ))}
                    </div>
                )}

                <div className="h-[40px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <div className="flex items-start justify-between w-full">
                        <p className="text-black uppercase">
                            News & Recognition
                        </p>
                        <span className="text-black">
                            {activeNews.length + pendingNews.length} Items
                        </span>
                    </div>
                    <Divider />
                    <TextLink icon="add" onClick={openAddNews}>
                        Add item
                    </TextLink>
                </div>

                {(activeNews.length > 0 || pendingNews.length > 0) && (
                    <div className="flex flex-wrap content-start items-start gap-xl p-xl">
                        {activeNews.map((news, idx) => (
                            <AwardItem
                                key={news.id}
                                title={news.title}
                                award={news.award}
                                description={news.description || ""}
                                previewUrl={news.image_url}
                                onEdit={() => {
                                    setEditingExistingNews(news);
                                    setShowAddNews(true);
                                }}
                                onDelete={() =>
                                    setDeletedNewsIds((prev) => [
                                        ...prev,
                                        news.id,
                                    ])
                                }
                                onMoveBack={undefined}
                                onMoveForward={undefined}
                            />
                        ))}
                        {pendingNews.map((news, index) => (
                            <AwardItem
                                key={`pending-news-${index}`}
                                title={news.awardTitle}
                                award={news.award}
                                description={news.description}
                                previewUrl={news.previewUrl}
                                onEdit={() => {
                                    setEditingNewsIndex(index);
                                    setShowAddNews(true);
                                }}
                                onDelete={() =>
                                    setPendingNews((prev) =>
                                        prev.filter((_, i) => i !== index)
                                    )
                                }
                                onMoveBack={undefined}
                                onMoveForward={undefined}
                            />
                        ))}
                    </div>
                )}

                <div className="h-[40px]" />

                <div className="flex flex-col gap-xs px-xl">
                    {editId && currentStatus === "published" ? (
                        <>
                            <Button
                                onClick={() => handleSave("published")}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleSave("draft")}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? "Saving..." : "Save as draft"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={() => handleSave("published")}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? "Saving..." : "Publish"}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    handleSave(
                                        editId ? currentStatus : "draft"
                                    )
                                }
                                disabled={saving}
                                className="w-full"
                            >
                                {saving
                                    ? "Saving..."
                                    : editId
                                      ? "Save"
                                      : "Save as draft"}
                            </Button>
                        </>
                    )}
                </div>
            </main>

            <Footer />

            {showAddContent && (
                <AddContentOverlay
                    availableTypes={availableTypes}
                    onAddType={addType}
                    editData={getOverlayEditData()}
                    onSave={handleOverlaySave}
                    onCancel={handleOverlayCancel}
                />
            )}

            {showAddAward && (
                <AddAwardOverlay
                    editData={getAwardEditData()}
                    onSave={handleAwardSave}
                    onCancel={handleAwardCancel}
                />
            )}

            {showAddNews && (
                <AddAwardOverlay
                    editData={getNewsEditData()}
                    onSave={handleNewsSave}
                    onCancel={handleNewsCancel}
                    sectionTitle="news item"
                    titleLabel="Publication"
                    subtitleLabel="Article"
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

function AwardItem({
    title,
    award,
    previewUrl,
    onEdit,
    onDelete,
    onMoveBack,
    onMoveForward,
}: {
    title: string;
    award: string;
    description: string;
    previewUrl: string | null;
    onEdit: () => void;
    onDelete: () => void;
    onMoveBack?: () => void;
    onMoveForward?: () => void;
}) {
    return (
        <div className="flex flex-col gap-xl items-start w-[162px]">
            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt={title}
                    className="w-full h-auto"
                />
            ) : (
                <div className="w-full aspect-square bg-medium-gray" />
            )}

            <div className="flex flex-col gap-xs w-full">
                <p className="text-black leading-[1.2]">
                    {title}
                </p>
                <p className="text-black leading-[1.2]">
                    {award}
                </p>
            </div>

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
