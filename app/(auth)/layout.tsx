import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Authentication",
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
        <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans flex flex-col justify-center items-center relative overflow-x-hidden antialiased">
            {/* Ambient Background Decorative Glow Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-radial-gradient from-[#35877D]/8 via-[#35877D]/2 to-transparent -z-10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-radial-gradient from-[#35877D]/6 via-[#35877D]/1 to-transparent -z-10 rounded-full blur-2xl pointer-events-none" />

            {children}
        </div>
    );
}
