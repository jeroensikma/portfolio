const SUPABASE_STORAGE =
    "https://pjmahjdifbynnyavwyru.supabase.co/storage/v1/object/public/";

const ALLOWED_BUCKET = "project-media";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;

    if (path[0] !== ALLOWED_BUCKET) {
        return new Response(null, { status: 404 });
    }

    if (path.some(segment => segment === ".." || segment === ".")) {
        return new Response(null, { status: 400 });
    }

    const fetchHeaders: HeadersInit = {};
    const range = request.headers.get("Range");
    if (range) {
        fetchHeaders["Range"] = range;
    }

    const upstream = await fetch(`${SUPABASE_STORAGE}${path.join("/")}`, {
        headers: fetchHeaders,
    });

    if (!upstream.ok && upstream.status !== 206) {
        return new Response(null, { status: upstream.status });
    }

    const headers: Record<string, string> = {
        "Content-Type":
            upstream.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
    };

    const contentLength = upstream.headers.get("Content-Length");
    if (contentLength) headers["Content-Length"] = contentLength;

    const contentRange = upstream.headers.get("Content-Range");
    if (contentRange) headers["Content-Range"] = contentRange;

    return new Response(upstream.body, {
        status: upstream.status,
        headers,
    });
}
