import Link from "next/link";
import Image from "next/image";
import { Header, Footer, Divider } from "@/components";
import LazyVideo from "@/components/LazyVideo";
import FadeIn from "@/components/FadeIn";
import { createAnonSupabaseClient } from "@/lib/supabase-anon";
import { proxyMediaUrl } from "@/lib/media-url";
import type { Project, ProjectMedia, IntroPlacement } from "@/types/project";
import styles from "@/styles/responsive.module.css";

export const revalidate = 60;

function getColSpan(size: string): number {
    switch (size) {
        case "2-column":
            return 2;
        case "3-column":
            return 3;
        case "4-column":
            return 4;
        case "6-column":
            return 6;
        case "8-column":
            return 8;
        default:
            return 2;
    }
}

interface ProjectLayout {
    spanCols: number;
    stacked: boolean;
    textPosition: "left" | "right";
    alignItems: "items-start" | "items-end";
}

function getLayout(placement: IntroPlacement, colSpan: number): ProjectLayout {
    switch (placement) {
        case "right-top":
            return {
                spanCols: colSpan + 2,
                stacked: false,
                textPosition: "right",
                alignItems: "items-start",
            };
        case "right-bottom":
            return {
                spanCols: colSpan + 2,
                stacked: false,
                textPosition: "right",
                alignItems: "items-end",
            };
        case "left-top":
            return {
                spanCols: colSpan + 2,
                stacked: false,
                textPosition: "left",
                alignItems: "items-start",
            };
        case "left-bottom":
            return {
                spanCols: colSpan + 2,
                stacked: false,
                textPosition: "left",
                alignItems: "items-end",
            };
        case "bottom-left":
            return {
                spanCols: colSpan,
                stacked: true,
                textPosition: "left",
                alignItems: "items-start",
            };
        case "bottom-right":
            return {
                spanCols: colSpan,
                stacked: true,
                textPosition: "right",
                alignItems: "items-start",
            };
    }
}

export default async function Home() {
    const supabase = createAnonSupabaseClient();

    const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("show_on_homepage", true)
        .eq("status", "published")
        .order("sort_order", { ascending: true });

    const projectIds = (projects || []).map((p: Project) => p.id);

    const { data: allMedia } = projectIds.length
        ? await supabase
              .from("project_media")
              .select("*")
              .in("project_id", projectIds)
              .neq("size_homepage", "do-not-show")
        : { data: [] };

    const mediaByProject = new Map<string, ProjectMedia>();
    (allMedia || []).forEach((m: ProjectMedia) => {
        if (!mediaByProject.has(m.project_id)) {
            mediaByProject.set(m.project_id, { ...m, url: proxyMediaUrl(m.url) });
        }
    });

    interface RowItem {
        project: Project;
        media: ProjectMedia;
        layout: ProjectLayout;
        startCol: number;
    }

    const items = (projects || [])
        .map((project: Project) => {
            const media = mediaByProject.get(project.id);
            if (!media) return null;
            const colSpan = getColSpan(media.size_homepage);
            return {
                project,
                media,
                layout: getLayout(project.intro_placement, colSpan),
            };
        })
        .filter(Boolean) as {
        project: Project;
        media: ProjectMedia;
        layout: ProjectLayout;
    }[];

    const rows: RowItem[][] = [];
    let currentRow: RowItem[] = [];
    let nextCol = 1;

    for (const item of items) {
        const width = item.layout.spanCols;
        if (nextCol > 1 && nextCol + 1 + width - 1 > 8) {
            rows.push(currentRow);
            currentRow = [{ ...item, startCol: 1 }];
            nextCol = 1 + width;
        } else {
            const col = nextCol === 1 ? 1 : nextCol + 1;
            currentRow.push({ ...item, startCol: col });
            nextCol = col + width;
        }
    }
    if (currentRow.length) rows.push(currentRow);

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
                <div className={`${styles.mobileOnly} px-xl py-[32px]`} style={{ gap: "36px" }}>
                    {items.map(({ project, media }, idx) => (
                        <FadeIn key={project.id} delay={idx * 0.1}>
                            <div className="flex flex-col" style={{ gap: "18px" }}>
                                <Link href={`/project/${project.slug}`} className="overflow-hidden block">
                                    {media.type === "image" ? (
                                        <Image
                                            src={media.url}
                                            alt={media.alt_text || project.title}
                                            width={800}
                                            height={500}
                                            sizes="100vw"
                                            className="w-full h-auto object-cover"
                                        />
                                    ) : (
                                        <LazyVideo
                                            src={media.url}
                                            className="w-full h-auto"
                                        />
                                    )}
                                </Link>
                                <div className="flex flex-col gap-lg">
                                    <div className="flex flex-col">
                                        <p className="text-black uppercase" style={{ fontFamily: "var(--font-title)", fontWeight: 700 }}>
                                            {project.title}
                                        </p>
                                        <p className="text-black">
                                            {project.year}
                                        </p>
                                    </div>
                                    {project.introduction && (
                                        <p className="text-black">
                                            {project.introduction}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Desktop layout */}
                <div className={`${styles.desktopFlex} px-xl py-[32px]`} style={{ gap: "60px" }}>
                    {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-8 gap-xl items-start">
                            {row.map(({ project, media, layout, startCol }, itemIdx) => {
                                const image = (
                                    <Link href={`/project/${project.slug}`}>
                                        {media.type === "image" ? (
                                            <Image
                                                src={media.url}
                                                alt={
                                                    media.alt_text ||
                                                    project.title
                                                }
                                                width={800}
                                                height={500}
                                                sizes="50vw"
                                                className="w-full h-auto object-cover"
                                            />
                                        ) : (
                                            <LazyVideo
                                                src={media.url}
                                                className="w-full h-auto"
                                            />
                                        )}
                                    </Link>
                                );

                                const text = (
                                    <div className="flex flex-col gap-lg w-[300px] shrink-0">
                                        <div className="flex flex-col">
                                            <p className="text-black uppercase" style={{ fontFamily: "var(--font-title)", fontWeight: 700 }}>
                                                {project.title}
                                            </p>
                                            <p className="text-black">
                                                {project.year}
                                            </p>
                                        </div>
                                        {project.introduction && (
                                            <p className="text-black">
                                                {project.introduction}
                                            </p>
                                        )}
                                    </div>
                                );

                                const gridCol = `${startCol} / span ${layout.spanCols}`;

                                if (layout.stacked) {
                                    return (
                                        <FadeIn
                                            key={project.id}
                                            delay={itemIdx * 0.1}
                                            style={{ gridColumn: gridCol }}
                                        >
                                            <div className="overflow-hidden">
                                                {image}
                                            </div>
                                            <div className="mt-[18px]">
                                                {text}
                                            </div>
                                        </FadeIn>
                                    );
                                }

                                return (
                                    <FadeIn
                                        key={project.id}
                                        delay={itemIdx * 0.1}
                                        className={`flex gap-xl ${layout.alignItems}`}
                                        style={{ gridColumn: gridCol }}
                                    >
                                        {layout.textPosition === "left" ? (
                                            <>
                                                {text}
                                                <div className="overflow-hidden flex-1 min-w-0">
                                                    {image}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="overflow-hidden flex-1 min-w-0">
                                                    {image}
                                                </div>
                                                {text}
                                            </>
                                        )}
                                    </FadeIn>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="px-xl">
                    <Divider />
                </div>
            </main>

            <Footer />
        </div>
    );
}
