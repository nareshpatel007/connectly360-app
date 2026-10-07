"use client";

import React, { useRef } from "react";
import {
    Paperclip,
    Image as ImageIcon,
    Video as VideoIcon,
    FileText,
    Music,
    MapPin,
    User,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttachmentMenuProps {
    onSelectFile: (file: File, type: "image" | "video" | "document" | "audio") => void;
    onOpenLocationModal: () => void;
    onOpenContactModal: () => void;
    disabled?: boolean;
}

export function AttachmentMenu({
    onSelectFile,
    onOpenLocationModal,
    onOpenContactModal,
    disabled = false,
}: AttachmentMenuProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingTypeRef = useRef<"image" | "video" | "document" | "audio">("document");

    const triggerFileInput = (type: "image" | "video" | "document" | "audio", accept: string) => {
        pendingTypeRef.current = type;
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onSelectFile(file, pendingTypeRef.current);
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
                        title="Attach file, media, or info"
                    >
                        <Paperclip size={14} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48 p-1 shadow-lg border-slate-200">
                    <DropdownMenuItem
                        onClick={() => triggerFileInput("image", "image/jpeg,image/png,image/webp")}
                        className="cursor-pointer text-xs flex items-center gap-2 py-2"
                    >
                        <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ImageIcon size={14} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800">Photos</p>
                            <p className="text-[10px] text-slate-400">JPG, PNG (max 5MB)</p>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => triggerFileInput("video", "video/mp4,video/3gpp,video/quicktime")}
                        className="cursor-pointer text-xs flex items-center gap-2 py-2"
                    >
                        <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                            <VideoIcon size={14} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800">Videos</p>
                            <p className="text-[10px] text-slate-400">MP4, 3GP (max 16MB)</p>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => triggerFileInput("document", ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt")}
                        className="cursor-pointer text-xs flex items-center gap-2 py-2"
                    >
                        <div className="h-6 w-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                            <FileText size={14} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800">Document</p>
                            <p className="text-[10px] text-slate-400">PDF, Office (max 100MB)</p>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => triggerFileInput("audio", "audio/mpeg,audio/aac,audio/ogg,audio/wav,audio/mp4")}
                        className="cursor-pointer text-xs flex items-center gap-2 py-2"
                    >
                        <div className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Music size={14} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800">Audio</p>
                            <p className="text-[10px] text-slate-400">MP3, AAC, OGG (max 16MB)</p>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={onOpenLocationModal}
                        className="cursor-pointer text-xs flex items-center gap-2 py-2"
                    >
                        <div className="h-6 w-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center">
                            <MapPin size={14} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800">Location</p>
                            <p className="text-[10px] text-slate-400">Share coordinates or place</p>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={onOpenContactModal}
                        className="cursor-pointer text-xs flex items-center gap-2 py-2"
                    >
                        <div className="h-6 w-6 rounded bg-teal-50 text-[#2F8F83] flex items-center justify-center">
                            <User size={14} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800">Contact Card</p>
                            <p className="text-[10px] text-slate-400">Share contact details</p>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
