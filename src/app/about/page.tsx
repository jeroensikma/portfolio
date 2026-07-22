import { Header, Footer, Divider } from "@/components";
import FadeIn from "@/components/FadeIn";
import { createAnonSupabaseClient } from "@/lib/supabase-anon";
import { proxyMediaUrl } from "@/lib/media-url";
import type { SocialLink } from "@/types/settings";
import styles from "@/styles/responsive.module.css";

export const revalidate = 60;

export default async function AboutPage() {
    const supabase = createAnonSupabaseClient();

    const { data: settings } = await supabase
        .from("site_settings")
        .select("introduction, email, socials, portrait_url")
        .single();

    const introduction = settings?.introduction || "";
    const email = settings?.email || "";
    const socials: SocialLink[] = settings?.socials || [];
    const portraitUrl = settings?.portrait_url
        ? proxyMediaUrl(settings.portrait_url)
        : null;

    const enabledSocials = socials.filter((s) => s.enabled && s.url);

    return (
        <div className="flex flex-col min-h-screen">
            <Header type="home" />

            <main className="flex-1">
                <div className="h-[128px]" />

                <div className="flex flex-col gap-[20px] px-xl">
                    <div className="h-[14px]" />
                    <Divider />
                </div>

                <div className="px-xl py-xl">
                    <div className="flex flex-col" style={{ gap: "16px", maxWidth: "499px" }}>
                        <FadeIn>
                            {introduction && (
                                <p className="text-black" style={{ width: "499px", maxWidth: "100%" }}>
                                    {introduction}
                                </p>
                            )}
                        </FadeIn>
                        {portraitUrl && (
                            <FadeIn>
                                <div className={styles.mobileOnly} style={{ width: "100%", aspectRatio: "340 / 482", overflow: "hidden" }}>
                                    <img
                                        src={portraitUrl}
                                        alt="Portrait"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <div className={styles.desktopFlex} style={{ width: "340px", height: "482px", overflow: "hidden" }}>
                                    <img
                                        src={portraitUrl}
                                        alt="Portrait"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                            </FadeIn>
                        )}
                    </div>
                </div>

                <FadeIn delay={0.2}>
                    <div className="px-xl py-[24px]">
                        <div className="flex flex-col" style={{ gap: "10px", maxWidth: "696px" }}>
                            {email && (
                                <div>
                                    <p className="text-black">Questions?</p>
                                    <p className="text-black">
                                        {email.replace("@", "(at)")}
                                    </p>
                                </div>
                            )}
                            {enabledSocials.length > 0 && (
                                <div>
                                    <p className="text-black">Social</p>
                                    {enabledSocials.map((social) => (
                                        <a
                                            key={social.platform}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="nav-link text-black uppercase underline block"
                                        >
                                            {social.platform}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </FadeIn>

                <div className="px-xl">
                    <Divider />
                </div>
            </main>

            <Footer />
        </div>
    );
}
