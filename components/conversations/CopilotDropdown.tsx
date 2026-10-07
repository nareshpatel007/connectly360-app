"use client";

import React, { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCopilotAction, type InboxSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
    Sparkles,
    ChevronDown,
    Wand2,
    Scissors,
    Briefcase,
    HeartHandshake,
    Globe,
    FileText,
    Loader2,
} from "lucide-react";

interface CopilotDropdownProps {
    currentText: string;
    onApplyText: (text: string) => void;
    customerId?: number;
    settings?: InboxSettings["copilot"];
}

export function CopilotDropdown({
    currentText,
    onApplyText,
    customerId,
    settings,
}: CopilotDropdownProps) {
    const { toast } = useToast();
    const copilotMutation = useCopilotAction();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Default enabled features if settings not yet loaded
    const features = settings || {
        enabled: true,
        suggest_reply: true,
        rewrite: true,
        shorten: true,
        professional: true,
        friendly: true,
        translate: true,
        summarize: true,
    };

    if (features.enabled === false) {
        return null; // Disabled by Admin
    }

    const handleAction = async (action: string, language?: string) => {
        setLoadingAction(action);
        try {
            const res = await copilotMutation.mutateAsync({
                action,
                text: currentText,
                customer_id: customerId,
                language,
            });

            if (res.result) {
                if (action === "summarize") {
                    toast({
                        title: "Conversation Summary",
                        description: res.result,
                    });
                } else {
                    onApplyText(res.result);
                    toast({
                        title: "AI Copilot Applied",
                        description: `Message updated (${action.replace("_", " ")}).`,
                    });
                }
            }
        } catch (err: any) {
            toast({
                title: "AI Copilot Error",
                description: err.message || "Failed to process AI request.",
                variant: "destructive",
            });
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    size="sm"
                    disabled={copilotMutation.isPending}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs h-7 px-3 rounded-lg border-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                    {copilotMutation.isPending ? (
                        <Loader2 size={11} className="animate-spin text-teal-400" />
                    ) : (
                        <Sparkles size={12} className="text-teal-400" />
                    )}
                    <span>Copilot</span>
                    <ChevronDown size={10} className="text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50">
                <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1">
                    AI Assistance
                </DropdownMenuLabel>

                {features.suggest_reply && (
                    <DropdownMenuItem
                        onClick={() => handleAction("suggest_reply")}
                        className="text-xs font-semibold text-slate-700 hover:text-[#378179] hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <Wand2 size={13} className="text-[#378179]" />
                        Suggest Reply
                    </DropdownMenuItem>
                )}

                {features.rewrite && (
                    <DropdownMenuItem
                        onClick={() => handleAction("rewrite")}
                        className="text-xs font-semibold text-slate-700 hover:text-[#378179] hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <Sparkles size={13} className="text-purple-500" />
                        Rewrite &amp; Improve
                    </DropdownMenuItem>
                )}

                {features.shorten && (
                    <DropdownMenuItem
                        onClick={() => handleAction("shorten")}
                        className="text-xs font-semibold text-slate-700 hover:text-[#378179] hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <Scissors size={13} className="text-amber-500" />
                        Shorten
                    </DropdownMenuItem>
                )}

                {features.professional && (
                    <DropdownMenuItem
                        onClick={() => handleAction("professional")}
                        className="text-xs font-semibold text-slate-700 hover:text-[#378179] hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <Briefcase size={13} className="text-blue-500" />
                        Make Professional
                    </DropdownMenuItem>
                )}

                {features.friendly && (
                    <DropdownMenuItem
                        onClick={() => handleAction("friendly")}
                        className="text-xs font-semibold text-slate-700 hover:text-[#378179] hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <HeartHandshake size={13} className="text-rose-500" />
                        Make Friendly
                    </DropdownMenuItem>
                )}

                {features.translate && (
                    <DropdownMenuItem
                        onClick={() => handleAction("translate", "Hindi")}
                        className="text-xs font-semibold text-slate-700 hover:text-[#378179] hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                    >
                        <Globe size={13} className="text-emerald-500" />
                        Translate to Hindi
                    </DropdownMenuItem>
                )}

                {features.summarize && (
                    <>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem
                            onClick={() => handleAction("summarize")}
                            className="text-xs font-semibold text-slate-700 hover:text-[#378179] hover:bg-[#378179]/05 rounded-xl cursor-pointer py-2 px-2.5 flex items-center gap-2"
                        >
                            <FileText size={13} className="text-slate-600" />
                            Summarize Chat
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
