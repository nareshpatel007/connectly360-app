"use client";

import React, { useState } from "react";
import {
    FileText,
    FileSpreadsheet,
    FileCode,
    File,
    Download,
    Eye,
    ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DocumentMessageBubbleProps {
    mediaUrl?: string | null;
    filename?: string | null;
    size?: number | null;
    mimeType?: string | null;
    caption?: string | null;
    isInbound: boolean;
}

export function DocumentMessageBubble({
    mediaUrl,
    filename,
    size,
    mimeType,
    caption,
    isInbound,
}: DocumentMessageBubbleProps) {
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const safeFilename = filename || "document.pdf";
    const extension = safeFilename.split(".").pop()?.toLowerCase() || "";
    const isPdf = extension === "pdf" || mimeType?.includes("pdf");

    const formatSize = (bytes?: number | null) => {
        if (!bytes) return "";
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const renderFileIcon = () => {
        if (isPdf) {
            return (
                <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                    <FileText size={20} />
                </div>
            );
        }
        if (["xls", "xlsx", "csv"].includes(extension)) {
            return (
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                    <FileSpreadsheet size={20} />
                </div>
            );
        }
        if (["doc", "docx"].includes(extension)) {
            return (
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <FileText size={20} />
                </div>
            );
        }
        return (
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                <File size={20} />
            </div>
        );
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!mediaUrl) return;
        const link = document.createElement("a");
        link.href = mediaUrl;
        link.download = safeFilename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-1.5 max-w-[320px]">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/90 border border-slate-200/80 shadow-2xs hover:bg-slate-100/80 transition-colors">
                {renderFileIcon()}

                <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={safeFilename}>
                        {safeFilename}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {size && <span>{formatSize(size)}</span>}
                        <span className="uppercase font-bold text-[9px] bg-slate-200/70 px-1 rounded text-slate-700">
                            {extension || "DOC"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {isPdf && mediaUrl && (
                        <button
                            type="button"
                            onClick={() => setIsPdfModalOpen(true)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                            title="Preview PDF"
                        >
                            <Eye size={14} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="p-1.5 text-slate-500 hover:text-[#2F8F83] rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="Download Document"
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>

            {caption && (
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed px-1 whitespace-pre-wrap">
                    {caption}
                </div>
            )}

            {/* Inline PDF Preview Modal */}
            {isPdf && (
                <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                    <DialogContent className="max-w-4xl h-[85vh] p-4 flex flex-col bg-white">
                        <div className="flex items-center justify-between border-b pb-2 text-xs">
                            <span className="font-semibold text-slate-800 truncate">{safeFilename}</span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={mediaUrl || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
                                >
                                    <ExternalLink size={13} />
                                    <span>Open Tab</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="flex items-center gap-1 text-[#2F8F83] hover:text-[#267A70] font-semibold"
                                >
                                    <Download size={13} />
                                    <span>Download</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 w-full bg-slate-100 rounded overflow-hidden">
                            {mediaUrl && (
                                <iframe
                                    src={`${mediaUrl}#toolbar=0`}
                                    className="w-full h-full border-0"
                                    title={safeFilename}
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
