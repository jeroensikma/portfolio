import Link from "next/link";
import Image from "next/image";
import { Header, Footer, Divider } from "@/components";
import VideoPlayer from "@/components/VideoPlayer";
import FadeIn from "@/components/FadeIn";
import { createAnonSupabaseClient } from "@/lib/supabase-anon";
import { proxyMediaUrl } from "@/lib/media-url";
import { notFound } from "next/navigation";
import type {
    Project,
    ProjectMedia,
    Award,
    NewsRecognition,
    CreditEntry,
    MediaAlignment,
} from "@/types/project";
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

function getAlignmentClass(alignment: MediaAlignment): string {
    switch (alignment) {
        case "center":
            return "justify-self-center";
        case "right":
            return "justify-self-end";
        default:
            return "justify-self-start";
    }
}

function getAlignmentCol(
    alignment: MediaAlignment,
    span: number
): string {
    if (span >= 8) return "1 / -1";
    switch (alignment) {
        case "center": {
            const start = Math.max(1, Math.floor((8 - span) / 2) + 1);
            return `${start} / span ${span}`;
        }
        case "right":
            return `${9 - span} / span ${span}`;
        default:
            return `1 / span ${span}`;
    }
}

function getOccupiedCols(
    alignment: MediaAlignment,
    span: number
): [number, number] {
    if (span >= 8) return [1, 8];
    switch (alignment) {
        case "center": {
            const start = Math.max(1, Math.floor((8 - span) / 2) + 1);
            return [start, start + span - 1];
        }
        case "right":
            return [9 - span, 8];
        default:
            return [1, span];
    }
}

function overlaps(a: [number, number], b: [number, number]): boolean {
    return a[0] <= b[1] && b[0] <= a[1];
}

interface RowItem {
    media: ProjectMedia;
    number: string;
    gridCol: string;
    span: number;
    cols: [number, number];
}

function toRowItem(media: ProjectMedia, number: string): RowItem {
    const span = getColSpan(media.size_project);
    const alignment = (media.alignment as MediaAlignment) || "left";
    return {
        media,
        number,
        gridCol: getAlignmentCol(alignment, span),
        span,
        cols: getOccupiedCols(alignment, span),
    };
}

function packMediaIntoRows(items: NumberedMedia[]): RowItem[][] {
    const rows: RowItem[][] = [];
    let i = 0;

    while (i < items.length) {
        const current = toRowItem(items[i].media, items[i].number);

        const currentAlignment =
            (items[i].media.alignment as MediaAlignment) || "left";

        if (
            current.span >= 8 ||
            currentAlignment === "right" ||
            i + 1 >= items.length
        ) {
            rows.push([current]);
            i++;
            continue;
        }

        const next = toRowItem(items[i + 1].media, items[i + 1].number);

        if (
            next.span < 8 &&
            !overlaps(current.cols, next.cols)
        ) {
            rows.push([current, next]);
            i += 2;
        } else {
            rows.push([current]);
            i++;
        }
    }

    return rows;
}

interface NumberedMedia {
    media: ProjectMedia;
    number: string;
}

function numberMedia(
    mediaItems: ProjectMedia[],
    types: string[]
): NumberedMedia[] {
    const countByType: Record<string, number> = {};

    return mediaItems.map((m) => {
        const tag = m.type_tag || "";
        const typeIndex = types.indexOf(tag);
        const typeNum = typeIndex === -1 ? "–" : `${typeIndex + 1}`;
        countByType[tag] = (countByType[tag] || 0) + 1;

        return {
            media: m,
            number: `${typeNum}.${countByType[tag]}`,
        };
    });
}

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = createAnonSupabaseClient();

    const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (!project) notFound();

    const [{ data: media }, { data: awards }, { data: newsItems }] = await Promise.all([
        supabase
            .from("project_media")
            .select("*")
            .eq("project_id", project.id)
            .order("sort_order", { ascending: true }),
        supabase
            .from("awards")
            .select("*")
            .eq("project_id", project.id)
            .order("sort_order", { ascending: true }),
        supabase
            .from("news_recognition")
            .select("*")
            .eq("project_id", project.id)
            .order("sort_order", { ascending: true }),
    ]);

    const mediaItems = (media || []).map((m: ProjectMedia) => ({
        ...m,
        url: proxyMediaUrl(m.url),
    }));
    const seenAwardTitles = new Set<string>();
    const awardItems = (awards || [])
        .filter((a: Award) => {
            const key = `${a.title}::${a.award}`;
            if (seenAwardTitles.has(key)) return false;
            seenAwardTitles.add(key);
            return true;
        })
        .map((a: Award) => ({
            ...a,
            image_url: a.image_url ? proxyMediaUrl(a.image_url) : a.image_url,
        }));
    const seenNewsTitles = new Set<string>();
    const newsRecognitionItems = (newsItems || [])
        .filter((n: NewsRecognition) => {
            const key = `${n.title}::${n.award}`;
            if (seenNewsTitles.has(key)) return false;
            seenNewsTitles.add(key);
            return true;
        })
        .map((n: NewsRecognition) => ({
            ...n,
            image_url: n.image_url ? proxyMediaUrl(n.image_url) : n.image_url,
        }));
    const numbered = numberMedia(mediaItems, project.types);

    const firstItem = numbered[0];
    const restItems = numbered.slice(1);
    const contentRows = packMediaIntoRows(restItems);

    return (
        <div className="flex flex-col min-h-screen">
            <Header type="home" />

            <main className="flex-1">
                <div className="h-[128px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <div className="flex items-center gap-sm">
                        <Link
                            href="/"
                            className="nav-link text-black uppercase underline whitespace-nowrap"
                        >
                            Selected
                        </Link>
                        <span className="text-black">/</span>
                        <span className="text-black uppercase whitespace-nowrap"
                        >
                            ( {project.title} )
                        </span>
                    </div>
                    <Divider />
                </div>

                {/* Mobile layout */}
                <div className={`${styles.mobileOnly} gap-[32px] px-xl py-[24px]`}>
                    {/* Project info: 50% width */}
                    <div style={{ width: "50%" }}>
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
                                <ol className="flex flex-col gap-[2px] text-black list-none" style={{ fontSize: "14px" }}>
                                    {project.types.map(
                                        (type: string, i: number) => (
                                            <li key={type} className="flex">
                                                <span className="w-[24px] shrink-0">
                                                    {i + 1}.
                                                </span>
                                                <span>{type}</span>
                                            </li>
                                        )
                                    )}
                                </ol>
                            )}
                        </div>
                    </div>

                    {/* Project description: 100% width */}
                    <div className="flex flex-col gap-md">
                        {project.about_company && (
                            <p className="text-black">
                                {project.about_company}
                            </p>
                        )}
                        {project.about_project && (
                            <p className="text-black">
                                {project.about_project}
                            </p>
                        )}
                    </div>

                    {/* All media: 100% width */}
                    {numbered.map(({ media: m, number }, idx) => (
                        <FadeIn key={m.id} delay={idx * 0.1}>
                            <div className="flex flex-col" style={{ gap: "16px" }}>
                                <div className="overflow-hidden">
                                    <MediaElement media={m} />
                                </div>
                                <MediaCaption
                                    number={number}
                                    typeTag={m.type_tag}
                                    description={m.description}
                                    span={8}
                                />
                            </div>
                        </FadeIn>
                    ))}

                </div>

                {/* Desktop layout */}
                <div className={`${styles.desktopFlex} gap-[60px] px-xl py-[32px]`}>
                {/* Hero: project info + first media */}
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
                        gap: "16px",
                    }}
                >
                    {/* Col 1: title, year, types */}
                    <div
                        className="flex flex-col gap-xl"
                        style={{ gridColumn: "1 / span 1" }}
                    >
                        <div className="flex flex-col">
                            <p className="text-black uppercase" style={{ fontFamily: "var(--font-title)", fontWeight: 700 }}>
                                {project.title}
                            </p>
                            <p className="text-black">
                                {project.year}
                            </p>
                        </div>
                        {project.types.length > 0 && (
                            <ol className="flex flex-col gap-[2px] text-black list-none">
                                {project.types.map(
                                    (type: string, i: number) => (
                                        <li key={type} className="flex">
                                            <span className="w-[24px] shrink-0">
                                                {i + 1}.
                                            </span>
                                            <span>{type}</span>
                                        </li>
                                    )
                                )}
                            </ol>
                        )}
                    </div>

                    {/* Cols 2-4: about company + about project */}
                    <div
                        className="flex flex-col gap-md"
                        style={{ gridColumn: "2 / span 3" }}
                    >
                        {project.about_company && (
                            <p className="text-black">
                                {project.about_company}
                            </p>
                        )}
                        {project.about_project && (
                            <p className="text-black">
                                {project.about_project}
                            </p>
                        )}
                    </div>

                    {/* Cols 5-8: first media item */}
                    {firstItem && (
                        <FadeIn style={{ gridColumn: "5 / span 4" }}>
                            <div
                                className="flex flex-col"
                                style={{ gap: "16px" }}
                            >
                                <div className="overflow-hidden">
                                    <MediaElement media={firstItem.media} />
                                </div>
                                <MediaCaption
                                    number={firstItem.number}
                                    typeTag={firstItem.media.type_tag}
                                    description={firstItem.media.description}
                                    span={4}
                                />
                            </div>
                        </FadeIn>
                    )}
                </div>

                {/* Remaining media items */}
                {contentRows.map((row, rowIdx) => (
                    <div
                        key={rowIdx}
                        className="grid"
                        style={{
                            gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
                            gap: "16px",
                        }}
                    >
                        {row.map(({ media: m, number, gridCol, span }) => (
                            <FadeIn
                                key={m.id}
                                style={{ gridColumn: gridCol }}
                            >
                                <div
                                    className="flex flex-col"
                                    style={{ gap: "16px" }}
                                >
                                    <div className="overflow-hidden">
                                        <MediaElement media={m} />
                                    </div>
                                    <MediaCaption
                                        number={number}
                                        typeTag={m.type_tag}
                                        description={m.description}
                                        span={span}
                                    />
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                ))}

                </div>

                {/* Credits & Awards */}
                {(project.credits?.length > 0 || awardItems.length > 0) && (
                    <div className={`${styles.stackOnMobile} gap-xl px-xl pb-[32px]`}>
                        {project.credits?.length > 0 && (
                            <div className="flex-1 flex flex-col" style={{ gap: "32px" }}>
                                <div className="flex flex-col" style={{ gap: "20px" }}>
                                    <p className="text-black uppercase">Credits</p>
                                    <Divider />
                                </div>
                                <div className="flex flex-col gap-md text-black">
                                    {project.credits.map((entry: CreditEntry, i: number) => (
                                        <div key={i}>
                                            <p>{entry.role}</p>
                                            <p className="uppercase">{entry.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {awardItems.length > 0 && (
                            <div className="flex-1 flex flex-col" style={{ gap: "32px" }}>
                                <div className="flex flex-col" style={{ gap: "20px" }}>
                                    <p className="text-black uppercase">Awards</p>
                                    <Divider />
                                </div>
                                <div className={styles.awardsGrid}>
                                    {awardItems.map((award) => (
                                        <AwardCard key={award.id} award={award} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* News & Recognition */}
                {newsRecognitionItems.length > 0 && (
                    <div className={`${styles.alignToRight} px-xl pb-[32px]`}>
                        <div className="flex flex-col" style={{ gap: "32px" }}>
                            <div className="flex flex-col" style={{ gap: "20px" }}>
                                <p className="text-black uppercase">News & Recognition</p>
                                <Divider />
                            </div>
                            <div className={styles.awardsGrid}>
                                {newsRecognitionItems.map((item) => (
                                    <AwardCard key={item.id} award={item} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-xl">
                    <Divider />
                </div>
            </main>

            <Footer />
        </div>
    );
}

function MediaElement({ media }: { media: ProjectMedia }) {
    if (media.type === "video") {
        return <VideoPlayer src={media.url} />;
    }
    return (
        <Image
            src={media.url}
            alt={media.alt_text || ""}
            width={1440}
            height={900}
            sizes="(max-width: 768px) 100vw, 75vw"
            className="w-full h-auto object-cover"
        />
    );
}

function MediaCaption({
    number,
    typeTag,
    description,
    span,
}: {
    number: string;
    typeTag: string | null;
    description: string | null;
    span: number;
}) {
    if (!typeTag && !description) {
        return (
            <div className="flex flex-col gap-xs">
                <p className="text-black">{number}</p>
            </div>
        );
    }

    const hasDescription = !!description;
    const useInlineLayout = span <= 4;

    if (hasDescription && !useInlineLayout) {
        return (
            <div className="grid grid-cols-8 gap-xl">
                <div className="col-span-1 flex flex-col gap-xs">
                    <p className="text-black">
                        {number}
                    </p>
                    {typeTag && (
                        <p className="text-black">
                            {typeTag}
                        </p>
                    )}
                </div>
                <div className="col-start-6 col-span-3">
                    <p className="text-black">
                        {description}
                    </p>
                </div>
            </div>
        );
    }

    if (hasDescription) {
        return (
            <div className="flex justify-between gap-xl">
                <div className="flex flex-col gap-xs shrink-0">
                    <p className="text-black">
                        {number}
                    </p>
                    {typeTag && (
                        <p className="text-black">
                            {typeTag}
                        </p>
                    )}
                </div>
                <div className="max-w-[340px]">
                    <p className="text-black">
                        {description}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-xs">
            <p className="text-black">{number}</p>
            {typeTag && (
                <p className="text-black">
                    {typeTag}
                </p>
            )}
        </div>
    );
}

function AwardCard({ award }: { award: Award }) {
    return (
        <div className="flex flex-col gap-sm">
            {award.image_url && (
                award.url ? (
                    <a href={award.url} target="_blank" rel="noopener noreferrer">
                        <Image
                            src={award.image_url}
                            alt={award.title}
                            width={300}
                            height={200}
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="w-full h-auto"
                        />
                    </a>
                ) : (
                    <Image
                        src={award.image_url}
                        alt={award.title}
                        width={300}
                        height={200}
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="w-full h-auto"
                    />
                )
            )}
            <div className="flex flex-col">
                <p className="text-black uppercase">
                    {award.title}
                </p>
                <p className="text-black">
                    {award.award}
                </p>
            </div>
            {award.description && (
                <p className="text-black">
                    {award.description}
                </p>
            )}
        </div>
    );
}
