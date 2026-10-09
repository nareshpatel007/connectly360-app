"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Megaphone, Bot, Sparkles } from "lucide-react";
import { AuthProductShowcase } from "./AuthProductShowcase";

interface AuthSplitLayoutProps {
    children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
    const features = [
        {
            icon: MessageSquare,
            title: "Unified Inbox",
            description: "Manage customer conversations with your team."
        },
        {
            icon: Megaphone,
            title: "Smart Campaigns",
            description: "Reach the right audience with targeted WhatsApp campaigns."
        },
        {
            icon: Bot,
            title: "AI-Powered Automation",
            description: "Save time with intelligent workflows and customer support."
        }
    ];

    return (
        <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden w-full bg-slate-50 flex flex-col lg:flex-row antialiased selection:bg-[#35877D]/15 selection:text-[#35877D]">
            {/* ============================================================== */}
            {/* LEFT COLUMN: Platform Introduction & Visual Showcase (50-52%) */}
            {/* ============================================================== */}
            <aside className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-full relative bg-gradient-to-br from-teal-50/70 via-slate-50/90 to-emerald-50/50 border-r border-slate-200/80 px-8 xl:px-12 py-5 xl:py-7 flex-col justify-between overflow-hidden shrink-0">
                {/* Decorative Subtle Ambient Geometry */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-[#35877D]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 -right-20 w-80 h-80 bg-gradient-to-tl from-emerald-200/25 to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 left-1/4 w-88 h-88 bg-gradient-to-tr from-teal-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Subtle Grid Texture */}
                <div
                    className="absolute inset-0 opacity-[0.025] pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(#172033 1px, transparent 1px)`,
                        backgroundSize: "24px 24px"
                    }}
                />

                {/* Top: Connectly360 Brand Header */}
                <div className="relative z-10 flex items-center justify-between w-full max-w-[560px] xl:max-w-[580px] ml-auto mr-3 xl:mr-6 shrink-0">
                    <Link href="/" className="inline-flex flex-col items-start group transition-transform">
                        <img
                            src="/images/logo.png"
                            alt="Connectly360"
                            className="h-8 xl:h-8.5 w-auto object-contain transition-opacity group-hover:opacity-95"
                        />
                        <span className="text-[9px] font-bold text-[#35877D] tracking-widest uppercase mt-0.5">
                            CONNECT • AUTOMATE • GROW
                        </span>
                    </Link>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-2xs backdrop-blur-xs">
                        <Sparkles size={12} className="text-[#35877D]" />
                        <span>Next-Gen WhatsApp CRM</span>
                    </div>
                </div>

                {/* Center Content: Headline, Highlights, & Visual Product Mockup */}
                <div className="relative z-10 my-auto py-2 xl:py-3 space-y-4 xl:space-y-4.5 w-full max-w-[560px] xl:max-w-[580px] ml-auto mr-3 xl:mr-6">
                    {/* Value Proposition Headline & Subtitle */}
                    <div className="space-y-1.5">
                        <h1 className="text-2xl xl:text-[28px] 2xl:text-[30px] font-extrabold tracking-tight text-slate-900 leading-[1.2]">
                            Every customer conversation. <br />
                            <span className="bg-gradient-to-r from-[#205C55] via-[#35877D] to-[#2B7068] bg-clip-text text-transparent">
                                One powerful platform.
                            </span>
                        </h1>
                        <p className="text-xs xl:text-[13px] text-slate-600 font-normal leading-relaxed max-w-xl">
                            Manage WhatsApp conversations, organize your contacts, automate engagement, and grow your business from one place.
                        </p>
                    </div>

                    {/* Feature Highlights Grid */}
                    <div className="grid grid-cols-3 gap-2 xl:gap-2.5">
                        {features.map((feature, idx) => {
                            const IconComponent = feature.icon;
                            return (
                                <div
                                    key={idx}
                                    className="bg-white/85 backdrop-blur-xs border border-slate-200/80 rounded-xl p-2.5 shadow-2xs transition-all hover:bg-white hover:border-[#35877D]/30"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-[#35877D]/10 text-[#35877D] flex items-center justify-center mb-1.5">
                                        <IconComponent size={13} />
                                    </div>
                                    <h2 className="text-xs font-bold text-slate-900 mb-0.5 leading-tight">{feature.title}</h2>
                                    <p className="text-[10px] text-slate-500 leading-tight">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Interactive High-Fidelity Product Visual Composition */}
                    <div className="pt-0.5">
                        <AuthProductShowcase />
                    </div>
                </div>
            </aside>

            {/* ============================================================== */}
            {/* RIGHT COLUMN: Vertically Centered Form Container (48-50%)    */}
            {/* ============================================================== */}
            <main className="w-full lg:w-1/2 xl:w-[48%] h-full flex flex-col justify-between p-4 sm:p-6 lg:px-8 xl:px-12 lg:py-5 xl:py-7 overflow-y-auto">
                {/* Mobile / Tablet Header (shown when left column is hidden) */}
                <div className="lg:hidden flex flex-col items-center justify-center pt-2 pb-4 text-center">
                    <Link href="/" className="inline-flex flex-col items-center">
                        <img
                            src="/images/logo.png"
                            alt="Connectly360"
                            className="h-8 w-auto object-contain"
                        />
                        <span className="text-[9px] font-bold text-[#35877D] tracking-widest uppercase mt-0.5">
                            CONNECT • AUTOMATE • GROW
                        </span>
                    </Link>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Every customer conversation. One powerful platform.
                    </p>
                </div>

                {/* Form Wrapper (Anchored towards center, matching left column) */}
                <div className="w-full max-w-[420px] xl:max-w-[440px] mr-auto lg:ml-3 xl:ml-6 my-auto py-2">
                    {children}
                </div>

                {/* Footer Navigation & Legal Links */}
                <footer className="w-full max-w-[420px] xl:max-w-[440px] mr-auto lg:ml-3 xl:ml-6 text-center py-2 space-y-1 text-[11px] text-slate-500 font-medium shrink-0">
                    <div className="flex items-center justify-center gap-3 text-slate-500">
                        <a
                            href={`${process.env.NEXT_PUBLIC_WEBSITE_URL || "https://connectly360.com"}/terms`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-slate-800 hover:underline transition-colors"
                        >
                            Terms of Service
                        </a>
                        <span>•</span>
                        <a
                            href={`${process.env.NEXT_PUBLIC_WEBSITE_URL || "https://connectly360.com"}/privacy`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-slate-800 hover:underline transition-colors"
                        >
                            Privacy Policy
                        </a>
                        <span>•</span>
                        <a
                            href={`${process.env.NEXT_PUBLIC_WEBSITE_URL || "https://connectly360.com"}/contact`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-slate-800 hover:underline transition-colors"
                        >
                            Support
                        </a>
                    </div>
                    <p className="text-slate-400">
                        © {new Date().getFullYear()} Connectly360. All rights reserved.
                    </p>
                </footer>
            </main>
        </div>
    );
}
