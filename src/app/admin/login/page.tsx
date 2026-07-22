"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadBackground() {
            const { data } = await supabase
                .from("site_settings")
                .select("login_background_url")
                .single();
            if (data?.login_background_url) {
                setBackgroundUrl(data.login_background_url);
            }
        }
        loadBackground();
    }, [supabase]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/admin");
            router.refresh();
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <Header type="admin-login" />

            {/* Background image area */}
            <div className="flex-1 min-h-0 relative px-xl">
                <div className="w-full h-full bg-medium-gray/20 overflow-hidden">
                    {backgroundUrl && (
                        <img
                            src={backgroundUrl}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Centered login module */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[351px] px-lg py-xl">
                    <form
                        onSubmit={handleLogin}
                        className="flex flex-col gap-[6px]"
                    >
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full bg-light-gray px-md py-sm text-black placeholder:text-medium-gray outline-none"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-light-gray px-md py-sm text-black placeholder:text-medium-gray outline-none"
                        />
                        {error && (
                            <p className="text-red">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white uppercase py-sm"
                        >
                            {loading ? "..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
