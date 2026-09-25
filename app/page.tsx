"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SaaSAppRootPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace("/dashboard");
            } else {
                router.replace("/login");
            }
        }
    }, [isAuthenticated, isLoading, router]);

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-[#f2f8f7] to-[#e6f2f0]">
            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/40 backdrop-blur-lg border border-white/30 shadow-xl shadow-[#35877D]/5">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#35877D]/20 blur-xl animate-pulse" />
                    <div className="h-12 w-12 rounded-full border-4 border-[#35877D]/25 border-t-[#35877D] animate-spin" />
                    <div className="absolute h-6 w-6 rounded-full border-2 border-transparent border-t-[#35877D] border-b-[#35877D] animate-spin [animation-direction:reverse]" />
                </div>
                <p className="text-sm font-bold text-[#35877D] tracking-wide font-sans animate-pulse">
                    Connecting to Connectly360...
                </p>
            </div>
        </div>
    );
}