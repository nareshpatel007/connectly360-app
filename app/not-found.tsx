"use client";

import Link from "next/link";
import { ArrowRight, Home, LayoutDashboard, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://connectly360.com";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col justify-between items-center bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
            {/* Top Logo */}
            <div className="w-full max-w-5xl flex items-center justify-between py-2">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="Connectly360 Logo" className="h-9 w-auto object-contain" />
                </Link>
            </div>

            {/* Main Content */}
            <main className="my-auto max-w-xl w-full text-center py-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-md flex flex-col items-center">
                    
                    {/* Animated 404 Graphic */}
                    <div className="relative flex items-center justify-center mb-6 select-none">
                        <div className="w-20 h-20 rounded-2xl bg-[#35877D]/10 border border-[#35877D]/20 flex items-center justify-center shadow-2xs">
                            <Compass size={40} className="text-[#35877D]" strokeWidth={1.5} />
                        </div>
                    </div>

                    <span className="text-6xl font-black text-slate-900 tracking-tight mb-2">404</span>

                    {/* Message */}
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
                        Page Not Found
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto mb-8">
                        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                        Let&apos;s get you back to your workspace.
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                        <Button
                            asChild
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#35877D] hover:bg-[#2c6f66] text-white text-xs font-bold shadow-sm transition-all cursor-pointer h-11"
                        >
                            <Link href="/dashboard" className="flex items-center justify-center gap-2">
                                <LayoutDashboard size={15} />
                                Go to Dashboard
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer h-11"
                        >
                            <Link href="/login" className="flex items-center justify-center gap-2">
                                <Home size={15} />
                                Back to Sign In
                            </Link>
                        </Button>
                    </div>

                    {/* Main Website Link */}
                    <div className="border-t border-slate-100 pt-6 mt-8 w-full">
                        <p className="text-xs text-slate-400 font-medium">
                            Looking for our main website?{" "}
                            <a
                                href={WEBSITE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#35877D] font-bold hover:underline inline-flex items-center gap-0.5"
                            >
                                Visit Connectly360 Website <ArrowRight size={12} />
                            </a>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>
        </div>
    );
}
