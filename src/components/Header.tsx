"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/responsive.module.css";

type HeaderType = "home" | "admin-login" | "admin";

interface HeaderProps {
    type?: HeaderType;
    onLogout?: () => void;
}

export default function Header({ type = "home", onLogout }: HeaderProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop header */}
            <header
                className={`${styles.desktopGrid} w-full bg-white items-center px-xl py-lg`}
                style={{ gridTemplateColumns: "50% 50%", gap: "0px" }}
            >
                <div className="flex items-center gap-xl">
                    <Link
                        href="/"
                        className="text-black uppercase whitespace-nowrap"
                        style={{ fontFamily: "var(--font-title)", fontWeight: 700 }}
                    >
                        Jeroen Sikma
                    </Link>
                    <span className="text-black whitespace-nowrap">
                        {type === "home"
                            ? "Identity and Experience Design."
                            : "Admin"}
                    </span>
                </div>

                <div className="flex items-center gap-sm">
                    {type === "home" && (
                        <>
                            <NavItem href="/" label="Selected" active={pathname === "/"} />
                            <NavItem href="/archive" label="Archive" active={pathname === "/archive"} />
                            <NavItem href="/about" label="About" active={pathname === "/about"} />
                        </>
                    )}
                    {type === "admin" && (
                        <div className="flex items-center gap-sm">
                            <NavItem href="/admin" label="Dashboard" active={pathname === "/admin"} />
                            <NavItem href="/admin/settings" label="Settings" active={pathname === "/admin/settings"} />
                            <button
                                onClick={onLogout}
                                className="nav-link text-black uppercase underline whitespace-nowrap"
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile header */}
            <header
                className={`${styles.mobileOnly} w-full bg-white px-xl py-lg`}
                style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}
            >
                <div className="flex flex-col gap-xs">
                    <Link
                        href="/"
                        className="text-black uppercase whitespace-nowrap"
                        style={{ fontFamily: "var(--font-title)", fontWeight: 700 }}
                    >
                        Jeroen Sikma
                    </Link>
                    <span className="text-black whitespace-nowrap">
                        {type === "home"
                            ? "Identity and Experience Design."
                            : "Admin"}
                    </span>
                </div>

                <div className="flex flex-col items-end gap-xs">
                    {type === "home" && (
                        <>
                            <NavItem href="/" label="Selected" active={pathname === "/"} />
                            <NavItem href="/archive" label="Archive" active={pathname === "/archive"} />
                            <NavItem href="/about" label="About" active={pathname === "/about"} />
                        </>
                    )}
                    {type === "admin" && (
                        <>
                            <span className="flex items-center">
                                <NavItem href="/admin" label="Dashboard" active={pathname === "/admin"} />
                                <span className="text-black">,</span>
                            </span>
                            <span className="flex items-center">
                                <NavItem href="/admin/settings" label="Settings" active={pathname === "/admin/settings"} />
                                <span className="text-black">,</span>
                            </span>
                            <button
                                onClick={onLogout}
                                className="nav-link text-black uppercase underline whitespace-nowrap"
                            >
                                Log out
                            </button>
                        </>
                    )}
                </div>
            </header>
        </>
    );
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
    if (active) {
        return (
            <span
                className="text-black uppercase whitespace-nowrap"
            >
                ( {label} )
            </span>
        );
    }

    return (
        <Link
            href={href}
            className="nav-link text-black uppercase underline whitespace-nowrap"
        >
            {label}
        </Link>
    );
}
