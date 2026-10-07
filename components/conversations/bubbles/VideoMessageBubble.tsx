"use client";

import React, { useRef, useState } from "react";
import { Download, Play, Pause, Video as VideoIcon } from "lucide-react";

interface VideoMessageBubbleProps {
    mediaUrl?: string | null;
    caption?: string | null;
    filename?: string | null;
    size?: number | null;
    isInbound: boolean;
}

export function VideoMessageBubble({
    mediaUrl,
    caption,
    filename,
    size,
    isInbound,
}: VideoMessageBubbleProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const formattedSize = size ? `${(size / (1024 * 1024)).toFixed(1)} MB` : null;

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!mediaUrl) return;
        const link = document.createElement("a");
        link.href = mediaUrl;
        link.download = filename || "whatsapp-video.mp4";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!mediaUrl) {
        return (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 text-slate-500 text-xs">
                <VideoIcon size={16} />
                <span>Video downloading...</span>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 max-w-[280px] sm:max-w-[340px]">
            <div className="relative group overflow-hidden rounded-xl bg-black border border-black/10">
                <video
                    ref={videoRef}
                    src={mediaUrl}
                    controls
                    preload="metadata"
                    className="w-full max-h-[300px] object-cover"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />

                {/* Download hover button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded-md">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="text-white hover:text-slate-200 transition-colors"
                        title="Download Video"
                    >
                        <Download size={13} />
                    </button>
                </div>
            </div>

            {caption && (
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed px-1 whitespace-pre-wrap">
                    {caption}
                </div>
            )}
        </div>
    );
}
