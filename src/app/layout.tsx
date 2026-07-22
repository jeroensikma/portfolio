import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL("https://jeroensikma.com"),
    title: {
        default: "Jeroen Sikma — Identity and Experience Design",
        template: "%s — Jeroen Sikma",
    },
    description: "Portfolio of Jeroen Sikma — Identity and Experience Design.",
    openGraph: {
        title: "Jeroen Sikma — Identity and Experience Design",
        description: "Portfolio of Jeroen Sikma — Identity and Experience Design.",
        url: "https://jeroensikma.com",
        siteName: "Jeroen Sikma",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Jeroen Sikma — Identity and Experience Design",
        description: "Portfolio of Jeroen Sikma — Identity and Experience Design.",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="antialiased">
            <body className="min-h-screen flex flex-col">
                <SmoothScroll>
                    {children}
                </SmoothScroll>
            </body>
        </html>
    );
}
