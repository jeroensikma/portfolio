const SUPABASE_STORAGE_PREFIX =
    "https://pjmahjdifbynnyavwyru.supabase.co/storage/v1/object/public/";

export function proxyMediaUrl(url: string): string {
    if (url.startsWith(SUPABASE_STORAGE_PREFIX)) {
        return "/storage/" + url.slice(SUPABASE_STORAGE_PREFIX.length);
    }
    return url;
}
