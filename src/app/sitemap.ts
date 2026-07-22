import type { MetadataRoute } from "next";
import { createAnonSupabaseClient } from "@/lib/supabase-anon";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createAnonSupabaseClient();

    const { data: projects } = await supabase
        .from("projects")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("sort_order", { ascending: true });

    const projectEntries: MetadataRoute.Sitemap = (projects || []).map((p) => ({
        url: `https://jeroensikma.com/project/${p.slug}`,
        lastModified: p.updated_at,
    }));

    return [
        { url: "https://jeroensikma.com", priority: 1 },
        { url: "https://jeroensikma.com/archive" },
        { url: "https://jeroensikma.com/about" },
        ...projectEntries,
    ];
}
