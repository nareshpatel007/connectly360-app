"use client";

import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    useListTemplates,
    useSendMessage,
    type WhatsAppTemplateItem,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Send, Loader2, FileText, CheckCircle2 } from "lucide-react";

interface TemplatePickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recipientPhone: string;
    onTemplateSent?: () => void;
}

export function TemplatePickerModal({
    open,
    onOpenChange,
    recipientPhone,
    onTemplateSent,
}: TemplatePickerModalProps) {
    const { toast } = useToast();
    const { data: templates = [], isLoading } = useListTemplates();
    const sendMessage = useSendMessage();

    const [selectedTemplateName, setSelectedTemplateName] = useState("");
    const [variables, setVariables] = useState<Record<string, string>>({});

    const approvedTemplates = useMemo(() => {
        return (templates || []).filter(
            (t) => !t.status || t.status.toLowerCase() === "approved"
        );
    }, [templates]);

    const activeTemplate = useMemo(() => {
        return approvedTemplates.find((t) => t.name === selectedTemplateName);
    }, [approvedTemplates, selectedTemplateName]);

    const placeholders = useMemo(() => {
        if (!activeTemplate?.body_text) return [];
        const matches = activeTemplate.body_text.match(/\{\{\d+\}\}/g);
        return matches ? Array.from(new Set(matches)) : [];
    }, [activeTemplate]);

    const renderedBody = useMemo(() => {
        if (!activeTemplate?.body_text) return "";
        let body = activeTemplate.body_text;
        Object.entries(variables).forEach(([ph, val]) => {
            if (val) body = body.split(ph).join(val);
        });
        return body;
    }, [activeTemplate, variables]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplateName) {
            toast({ title: "Template Required", description: "Please pick an approved WhatsApp template.", variant: "destructive" });
            return;
        }

        const paramValues = placeholders.map((ph) => ({
            type: "text",
            text: variables[ph] || "",
        }));

        const components = paramValues.length > 0 ? [
            {
                type: "body",
                parameters: paramValues,
            }
        ] : [];

        try {
            await sendMessage.mutateAsync({
                data: {
                    to: recipientPhone,
                    type: "template",
                    template_name: selectedTemplateName,
                    language: activeTemplate?.language || "en",
                    components,
                } as any,
            });

            toast({
                title: "Template Dispatched",
                description: `Sent "${selectedTemplateName}" to +${recipientPhone}.`,
            });

            onOpenChange(false);
            setSelectedTemplateName("");
            setVariables({});
            if (onTemplateSent) onTemplateSent();
        } catch (err: any) {
            toast({
                title: "Template send failed",
                description: err.message || "Failed to dispatch template.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] bg-white rounded-3xl p-6 border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-[#378179]/10 text-[#378179] flex items-center justify-center font-bold">
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-extrabold text-slate-800">
                                Send WhatsApp Template
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Dispatch Meta-approved pre-configured template messages to +{recipientPhone}.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSend} className="space-y-4 pt-1">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Select Template*</Label>
                        <select
                            value={selectedTemplateName}
                            onChange={(e) => {
                                setSelectedTemplateName(e.target.value);
                                setVariables({});
                            }}
                            className="w-full text-xs h-9.5 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 font-medium"
                            required
                        >
                            <option value="">-- Choose an approved template --</option>
                            {approvedTemplates.map((t) => (
                                <option key={t.name} value={t.name}>
                                    {t.name} ({t.language.toUpperCase()}) - {t.category}
                                </option>
                            ))}
                        </select>
                    </div>

                    {activeTemplate && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <FileText size={12} className="text-[#378179]" />
                                    Live Preview
                                </span>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                    Approved
                                </Badge>
                            </div>

                            {placeholders.length > 0 && (
                                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Parameters
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {placeholders.map((ph, idx) => (
                                            <div key={ph} className="space-y-0.5">
                                                <Label className="text-[10px] font-semibold text-slate-600">
                                                    Parameter {idx + 1} ({ph})
                                                </Label>
                                                <Input
                                                    placeholder={`Value for ${ph}`}
                                                    value={variables[ph] || ""}
                                                    onChange={(e) => setVariables((prev) => ({ ...prev, [ph]: e.target.value }))}
                                                    className="text-xs h-8 rounded-lg bg-white border-slate-200"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 shadow-2xs whitespace-pre-wrap">
                                {renderedBody}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-xs rounded-xl h-8.5 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={sendMessage.isPending || !selectedTemplateName}
                            className="bg-[#378179] hover:bg-[#2b625c] text-white font-bold text-xs rounded-xl h-8.5 px-4 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            {sendMessage.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={13} />
                                    Send Template
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
