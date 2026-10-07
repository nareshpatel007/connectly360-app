"use client";

import React, { useEffect, useState } from "react";
import { X, FileText, Music, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export interface PendingAttachment {
    file: File;
    type: "image" | "video" | "document" | "audio";
    previewUrl?: string;
    caption?: string;
}

interface AttachmentPreviewBarProps {
    attachment: PendingAttachment;
    uploadProgress?: number | null; // null if not currently uploading, 0-100 if uploading
    statusText?: string | null;
    onCaptionChange: (caption: string) => void;
    onRemove: () => void;
}

export function AttachmentPreviewBar({
    attachment,
    uploadProgress,
    statusText,
    onCaptionChange,
    onRemove,
}: AttachmentPreviewBarProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (attachment.type === "image" || attachment.type === "video") {
            const url = URL.createObjectURL(attachment.file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [attachment.file, attachment.type]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isUploading = typeof uploadProgress === "number";

    return (
        <div className="p-3 bg-slate-50 border-t border-b border-slate-200 space-y-2">
            <div className="flex items-center gap-3">
                {/* Visual Thumbnail or Icon */}
                <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                    {previewUrl && attachment.type === "image" ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : previewUrl && attachment.type === "video" ? (
                        <video src={previewUrl} className="h-full w-full object-cover" />
                    ) : attachment.type === "document" ? (
                        <FileText size={24} className="text-slate-600" />
                    ) : (
                        <Music size={24} className="text-slate-600" />
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 size={18} className="animate-spin text-white" />
                        </div>
                    )}
                </div>

                {/* File Details & Caption Input */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="truncate">
                            <span className="text-xs font-semibold text-slate-800 truncate block">
                                {attachment.file.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                                {formatSize(attachment.file.size)} • {attachment.type.toUpperCase()}
                            </span>
                        </div>
                        {!isUploading && (
                            <button
                                type="button"
                                onClick={onRemove}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Remove attachment"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    {/* Caption input for image/video/doc */}
                    {!isUploading && (
                        <Input
                            value={attachment.caption || ""}
                            onChange={(e) => onCaptionChange(e.target.value)}
                            placeholder="Add an optional caption..."
                            className="h-7 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#2F8F83]"
                        />
                    )}
                </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
                <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                        <span>{statusText || "Uploading to WhatsApp..."}</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 bg-slate-200" />
                </div>
            )}
        </div>
    );
}
