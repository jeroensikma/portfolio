import Link from "next/link";
import Image from "next/image";
import { Header, Footer, Divider } from "@/components";
import LazyVideo from "@/components/LazyVideo";
import ClickableMedia from "@/components/ClickableMedia";
import MediaOverlay from "@/components/MediaOverlay";
import type { OverlayMediaItem } from "@/components/MediaOverlay";
import FadeIn from "@/components/FadeIn";
import { createAnonSupabaseClient } from "@/lib/supabase-anon";
import { proxyMediaUrl } from "@/lib/media-url";
import type { Project, ProjectMedia } from "@/types/project";
import styles from "@/styles/responsive.module.css";

export const revalidate = 60;

type Cell =
    | { type: "info"; project: Project }
    | {
          type: "media";
          project: Project;
          media: ProjectMedia;
          number: string;
          label: string;
      };

function buildCells(
    projects: Project[],
    mediaByProject: Map<string, ProjectMedia[]>
): Cell[] {
    const cells: Cell[] = [];

    for (const project of projects) {
        cells.push({ type: "info", project });

        const media = mediaByProject.get(project.id) || [];
        const countByType: Record<string, number> = {};

        for (const m of media) {
            const tag = m.type_tag || "";
            const typeIndex = project.types.indexOf(tag);
            const typeNum = typeIndex === -1 ? "–" : `${typeIndex + 1}`;
            countByType[tag] = (countByType[tag] || 0) + 1;

            cells.push({
                type: "media",
                project,
                media: m,
                number: `${typeNum}.${countByType[tag]}`,
                label: m.description || m.type_tag || "",
            });
        }
    }

    return cells;
}

export default async function IndexPage() {
    const supabase = createAnonSupabaseClient();

    const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true });

    const projectIds = (projects || []).map((p: Project) => p.id);

    const { data: allMedia } = projectIds.length
        ? await supabase
              .from("project_media")
              .select("*")
              .in("project_id", projectIds)
              .order("sort_order", { ascending: true })
        : { data: [] };

    const mediaByProject = new Map<string, ProjectMedia[]>();
    for (const m of allMedia || []) {
        const list = mediaByProject.get(m.project_id) || [];
        list.push({
            ...m,
            url: proxyMediaUrl(m.url),
            thumbnail_url: m.thumbnail_url ? proxyMediaUrl(m.thumbnail_url) : null,
        });
        mediaByProject.set(m.project_id, list);
    }

    const cells = buildCells(projects || [], mediaByProject);

    const overlayItems: OverlayMediaItem[] = cells
        .filter((c): c is Extract<Cell, { type: "media" }> => c.type === "media")
        .map((c) => ({
            mediaId: c.media.id,
            url: c.media.url,
            type: c.media.type,
            altText: c.media.alt_text || c.label,
            projectTitle: c.project.title,
            projectYear: c.project.year,
            number: c.number,
            label: c.label,
        }));

    const desktopRows: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 8) {
        desktopRows.push(cells.slice(i, i + 8));
    }

    const mobileRows: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 3) {
        mobileRows.push(cells.slice(i, i + 3));
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header type="home" />

            <main className="flex-1">
                <div className="h-[128px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <div className="h-[14px]" />
                    <Divider />
                </div>

                {/* Mobile layout */}
                <div className={`${styles.mobileOnly} px-xl py-[24px]`}>
                    {mobileRows.map((row, rowIdx) => (
                        <div key={rowIdx}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                    columnGap: "16px",
                                }}
                            >
                                {row.map((cell, cellIdx) => {
                                    if (cell.type === "info") {
                                        return (
                                            <FadeIn key={`info-${cell.project.id}`} delay={cellIdx * 0.08}>
                                                <InfoCell project={cell.project} />
                                            </FadeIn>
                                        );
                                    }
                                    return (
                                        <FadeIn key={cell.media.id} delay={cellIdx * 0.08}>
                                            <MediaCell
                                                media={cell.media}
                                                number={cell.number}
                                                label={cell.label}
                                            />
                                        </FadeIn>
                                    );
                                })}
                            </div>
                            {rowIdx < mobileRows.length - 1 && (
                                <div style={{ padding: "24px 0" }}>
                                    <Divider />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Desktop layout */}
                <div className={`${styles.desktopFlex} px-xl py-[32px]`}>
                    {desktopRows.map((row, rowIdx) => (
                        <div key={rowIdx}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(8, 1fr)",
                                    gap: "16px",
                                }}
                            >
                                {row.map((cell, cellIdx) => {
                                    if (cell.type === "info") {
                                        return (
                                            <FadeIn key={`info-${cell.project.id}`} delay={cellIdx * 0.06}>
                                                <InfoCell project={cell.project} />
                                            </FadeIn>
                                        );
                                    }
                                    return (
                                        <FadeIn key={cell.media.id} delay={cellIdx * 0.06}>
                                            <MediaCell
                                                media={cell.media}
                                                number={cell.number}
                                                label={cell.label}
                                            />
                                        </FadeIn>
                                    );
                                })}
                            </div>
                            {rowIdx < desktopRows.length - 1 && (
                                <div className="py-[40px]">
                                    <Divider />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="px-xl">
                    <Divider />
                </div>
            </main>

            <Footer />
            <MediaOverlay items={overlayItems} />
        </div>
    );
}

function InfoCell({ project }: { project: Project }) {
    return (
        <div className="flex flex-col justify-between">
            <div className="flex flex-col gap-xl">
                <div className="flex flex-col">
                    <p className="text-black uppercase" style={{ fontFamily: "var(--font-title)", fontWeight: 700 }}>
                        {project.title}
                    </p>
                    <p className="text-black">
                        {project.year}
                    </p>
                </div>
                {project.types.length > 0 && (
                    <ol className="flex flex-col gap-[2px] text-black list-none" style={{ fontSize: "14px", paddingBottom: "16px" }}>
                        {project.types.map((type, i) => (
                            <li key={type} className="flex">
                                <span className="w-[24px] shrink-0">
                                    {i + 1}.
                                </span>
                                <span>{type}</span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
            <Link
                href={`/project/${project.slug}`}
                className="nav-link text-black uppercase underline"
            >
                Showcase
            </Link>
        </div>
    );
}

function MediaCell({
    media,
    number,
    label,
}: {
    media: ProjectMedia;
    number: string;
    label: string;
}) {
    return (
        <div className="flex flex-col justify-between">
            <ClickableMedia mediaId={media.id}>
                <div className="overflow-hidden">
                    {media.type === "image" || media.thumbnail_url ? (
                        <Image
                            src={media.thumbnail_url || media.url}
                            alt={media.alt_text || label}
                            width={320}
                            height={200}
                            sizes="160px"
                            className="w-full h-auto object-cover"
                        />
                    ) : (
                        <LazyVideo
                            src={media.url}
                            className="w-full h-auto"
                            autoPlay={false}
                        />
                    )}
                </div>
            </ClickableMedia>
            <div className="flex flex-col pt-[16px]">
                <p className="text-black">{number}</p>
                <p className="text-black">{label}</p>
            </div>
        </div>
    );
}
