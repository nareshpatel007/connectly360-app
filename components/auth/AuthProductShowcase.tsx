"use client";

import React from "react";
import { MessageSquare, Bot, Sparkles, TrendingUp, CheckCheck, Users, Zap, CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";

export function AuthProductShowcase() {
    return (
        <div className="relative w-full max-w-[560px] xl:max-w-[580px] select-none">
            {/* Ambient subtle backdrops */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#35877D]/12 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Interactive Product Showcase Card */}
            <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-300/30 p-3.5 xl:p-4 space-y-2.5 xl:space-y-3 overflow-hidden">
                {/* Header Mockup Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
                        </div>
                        <div className="h-3.5 w-px bg-slate-200 mx-1" />
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/80 text-[10.5px] font-semibold text-slate-700">
                            <MessageSquare className="w-3.5 h-3.5 text-[#35877D]" />
                            <span>WhatsApp Team Inbox</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Meta Cloud API Active
                        </span>
                    </div>
                </div>

                {/* Conversation Preview Section */}
                <div className="space-y-2.5">
                    {/* Customer Message Bubble */}
                    <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="w-6.5 h-6.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                            LD
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-2.5 shadow-2xs space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">Liam Davis</span>
                                <span className="text-[10px] text-slate-400">10:42 AM</span>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#35877D] bg-[#35877D]/10 px-1.5 py-0.2 rounded">
                                    <ShieldCheck className="w-2.5 h-2.5" /> Verified
                                </span>
                            </div>
                            <p className="text-[11.5px] text-slate-700 leading-relaxed">
                                Hi Connectly360 team! We want to integrate automated WhatsApp campaign workflows for 10k+ leads. Can you share setup details?
                            </p>
                        </div>
                    </div>

                    {/* AI Automation Response Bubble */}
                    <div className="flex items-start gap-2 max-w-[90%] ml-auto flex-row-reverse">
                        <div className="w-6.5 h-6.5 rounded-full bg-[#35877D] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
                            <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="bg-gradient-to-br from-[#35877D]/95 to-[#276e65] text-white rounded-2xl rounded-tr-xs p-2.5 shadow-sm space-y-1 text-left">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">AI Automation Agent</span>
                                    <span className="inline-flex items-center gap-1 text-[9px] font-medium bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                                        <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Auto-reply
                                    </span>
                                </div>
                                <span className="text-[10px] text-teal-100/80">Just now</span>
                            </div>
                            <p className="text-[11.5px] text-teal-50 leading-relaxed font-normal">
                                Hello Liam! We've prepared our high-volume broadcast playbook and routed your inquiry to your dedicated account manager.
                            </p>
                            <div className="flex items-center justify-end gap-1 pt-0.5 text-[10px] text-teal-100">
                                <span>Delivered</span>
                                <CheckCheck className="w-3.5 h-3.5 text-teal-200" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Split Metrics & Workflow Preview Row */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* Live Campaign Analytics Card */}
                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                                <TrendingUp className="w-3.5 h-3.5 text-[#35877D]" />
                                <span>Broadcast Pulse</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                +38% <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex justify-between items-baseline text-[10.5px]">
                                <span className="text-slate-500 font-medium">Delivery Rate</span>
                                <span className="font-extrabold text-slate-900">99.4%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-[#35877D] h-1.5 rounded-full w-[99.4%]" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Open Rate: <strong className="text-slate-700">84.2%</strong></span>
                            <span>Speed: <strong className="text-slate-700">&lt; 1.2s</strong></span>
                        </div>
                    </div>

                    {/* Smart Workflow Automation Card */}
                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Workflow Trigger</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                                Active
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-700 font-medium leading-tight">
                                <CheckCircle2 className="w-3 h-3 text-[#35877D] shrink-0" />
                                <span className="truncate">Lead Qualified: Score 94</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-700 font-medium leading-tight">
                                <Users className="w-3 h-3 text-[#35877D] shrink-0" />
                                <span className="truncate">Auto-assigned to Enterprise</span>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-0.5 flex items-center justify-between">
                            <span>Saved: <strong className="text-slate-700">14.5 hrs/wk</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom floating trust badge */}
            <div className="mt-2.5 flex items-center justify-between px-3 py-1.5 bg-white/80 backdrop-blur-xs border border-slate-200/70 rounded-xl text-[10.5px] text-slate-600 shadow-2xs">
                <div className="flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800">Official Meta Tech Partner</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                    <span>99.9% Uptime</span>
                    <span>•</span>
                    <span>End-to-End Encrypted</span>
                </div>
            </div>
        </div>
    );
}
