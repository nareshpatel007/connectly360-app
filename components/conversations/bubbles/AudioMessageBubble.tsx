"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Mic, Music, Download } from "lucide-react";

interface AudioMessageBubbleProps {
    mediaUrl?: string | null;
    isVoice?: boolean;
    duration?: number | null;
    filename?: string | null;
    isInbound: boolean;
}

export function AudioMessageBubble({
    mediaUrl,
    isVoice = false,
    duration: initialDuration,
    filename,
    isInbound,
}: AudioMessageBubbleProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialDuration || 0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const setAudioDuration = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", setAudioDuration);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", setAudioDuration);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatSeconds = (sec: number) => {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!mediaUrl) return;
        const link = document.createElement("a");
        link.href = mediaUrl;
        link.download = filename || (isVoice ? "voice-message.ogg" : "audio-file.mp3");
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!mediaUrl) {
        return (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 text-slate-500 text-xs">
                {isVoice ? <Mic size={15} /> : <Music size={15} />}
                <span>Voice note downloading...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 p-1 min-w-[210px] max-w-[280px]">
            <audio ref={audioRef} src={mediaUrl} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                type="button"
                onClick={togglePlay}
                className="h-9 w-9 rounded-full bg-[#2F8F83] text-white flex items-center justify-center shrink-0 shadow-2xs hover:bg-[#267A70] transition-colors cursor-pointer"
            >
                {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>

            {/* Waveform / Progress Slider */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                        {isVoice ? (
                            <span className="text-[#2F8F83] font-semibold flex items-center gap-0.5">
                                <Mic size={10} /> Voice
                            </span>
                        ) : (
                            <span className="text-slate-600 flex items-center gap-0.5">
                                <Music size={10} /> Audio
                            </span>
                        )}
                    </span>
                    <span>{formatSeconds(isPlaying ? currentTime : duration)}</span>
                </div>

                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2F8F83]"
                />
            </div>

            {/* Download Icon */}
            <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                title="Download Audio"
            >
                <Download size={13} />
            </button>
        </div>
    );
}
