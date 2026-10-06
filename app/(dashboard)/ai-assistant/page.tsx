"use client";

import Link from "next/link";
import { Bot, Sparkles, BookOpen, Zap, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AIAssistantPage() {
    return (
        <UpgradeGuard 
            allowedPlans={["growth", "business", "enterprise"]} 
            featureName="AI Assistant" 
            description="Train a custom AI agent on your business files and automate customer replies 24/7."
        >
            <div className="space-y-6">
                <PageHeader
                    icon={Bot}
                    title="AI Agents"
                    description="Configure intelligent AI agent workflows, contextual training, and automated responses."
                    breadcrumbs={[{ label: "AI" }, { label: "AI Agents" }]}
                    actions={
                        <Link href="/knowledge-base">
                            <Button className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer">
                                <Sparkles size={16} />
                                Train Knowledge Base
                            </Button>
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <CardHeader className="pb-3">
                            <div className="h-10 w-10 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center mb-2">
                                <BookOpen size={20} />
                            </div>
                            <CardTitle className="text-base font-bold text-slate-900">Knowledge Base Training</CardTitle>
                            <CardDescription className="text-xs text-slate-500 leading-relaxed">
                                Upload business documents, product FAQs, and custom instructions for grounded AI answers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link href="/knowledge-base">
                                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold cursor-pointer border-slate-200">
                                    Manage Knowledge Base <ArrowRight size={13} className="ml-1.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <CardHeader className="pb-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                                <Zap size={20} />
                            </div>
                            <CardTitle className="text-base font-bold text-slate-900">Automated Reply Triggers</CardTitle>
                            <CardDescription className="text-xs text-slate-500 leading-relaxed">
                                Enable autonomous AI fallbacks for incoming customer chats when agents are offline.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link href="/automations">
                                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold cursor-pointer border-slate-200">
                                    Configure Automations <ArrowRight size={13} className="ml-1.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <CardHeader className="pb-3">
                            <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center mb-2">
                                <ShieldCheck size={20} />
                            </div>
                            <CardTitle className="text-base font-bold text-slate-900">Agent Guardrails</CardTitle>
                            <CardDescription className="text-xs text-slate-500 leading-relaxed">
                                Enforce strict persona boundary rules, safety limits, and prompt response validation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link href="/knowledge-base">
                                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold cursor-pointer border-slate-200">
                                    View Agent Settings <ArrowRight size={13} className="ml-1.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </UpgradeGuard>
    );
}
