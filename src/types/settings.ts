export interface SocialLink {
    platform: string;
    url: string;
    enabled: boolean;
}

export interface SiteSettings {
    id: string;
    introduction: string;
    email: string;
    socials: SocialLink[];
    login_background_url: string | null;
    portrait_url: string | null;
    updated_at: string;
}
