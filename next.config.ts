import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "pjmahjdifbynnyavwyru.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
        ],
        // Each width a browser or crawler can request is a separate billed
        // transformation on Vercel, so offer fewer than Next's 15 defaults.
        deviceSizes: [640, 1080, 1920],
        imageSizes: [256, 384],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
};

export default nextConfig;
