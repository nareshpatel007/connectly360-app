import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: {
        template: "%s | Connectly360",
        default: "Authentication | Connectly360",
    },
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans antialiased">
            {children}
        </div>
    );
}
