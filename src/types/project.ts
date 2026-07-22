export type IntroPlacement =
    | "right-top"
    | "right-bottom"
    | "left-top"
    | "left-bottom"
    | "bottom-left"
    | "bottom-right";

export interface Project {
    id: string;
    title: string;
    slug: string;
    year: string | null;
    types: string[];
    description: string;
    introduction: string | null;
    intro_placement: IntroPlacement;
    about_company: string | null;
    about_project: string | null;
    credits: CreditEntry[];
    show_on_homepage: boolean;
    status: "published" | "draft";
    thumbnail_url: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export type MediaSize = "2-column" | "3-column" | "4-column" | "6-column" | "8-column";
export type HomepageSize = "do-not-show" | MediaSize;
export type MediaAlignment = "left" | "center" | "right";

export interface ProjectMedia {
    id: string;
    project_id: string;
    url: string;
    filename: string | null;
    type: "image" | "video";
    type_tag: string | null;
    description: string | null;
    size_project: MediaSize;
    size_homepage: HomepageSize;
    alignment: MediaAlignment;
    alt_text: string | null;
    thumbnail_url: string | null;
    sort_order: number;
    created_at: string;
}

export interface Award {
    id: string;
    project_id: string;
    title: string;
    award: string;
    url: string | null;
    description: string | null;
    image_url: string | null;
    sort_order: number;
    created_at: string;
}

export interface NewsRecognition {
    id: string;
    project_id: string;
    title: string;
    award: string;
    url: string | null;
    description: string | null;
    image_url: string | null;
    sort_order: number;
    created_at: string;
}

export interface CreditEntry {
    role: string;
    name: string;
}

export interface ProjectType {
    id: string;
    name: string;
    created_at: string;
}
