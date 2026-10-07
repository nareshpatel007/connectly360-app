"use client";

import React from "react";
import { Smile, Plus } from "lucide-react";

export interface GroupedReaction {
    emoji: string;
    count: number;
    users: string[];
    hasUserReacted?: boolean;
}

export function groupReactions(reactions: any[] = [], currentUserId?: number | string): GroupedReaction[] {
    if (!Array.isArray(reactions) || reactions.length === 0) return [];
    const map: { [emoji: string]: GroupedReaction } = {};

    for (const r of reactions) {
        if (!r || !r.emoji) continue;
        const emoji = r.emoji;
        if (!map[emoji]) {
            map[emoji] = { emoji, count: 0, users: [], hasUserReacted: false };
        }
        map[emoji].count += 1;
        const userName = r.contact_name || r.from || (r.user_id ? "Agent" : "User");
        map[emoji].users.push(userName);

        if (currentUserId && (r.user_id === currentUserId || r.from === String(currentUserId))) {
            map[emoji].hasUserReacted = true;
        }
    }

    return Object.values(map);
}

interface ReactionPillProps {
    reactions: any[];
    onReact?: (emoji: string) => void;
    currentUserId?: number | string;
    isInbound?: boolean;
}

export function ReactionPill({ reactions, onReact, currentUserId, isInbound = false }: ReactionPillProps) {
    const grouped = groupReactions(reactions, currentUserId);
    if (grouped.length === 0) return null;

    return (
        <div
            className={`absolute -bottom-3 flex items-center gap-1 z-10 flex-wrap ${
                isInbound ? "right-2" : "left-2"
            }`}
        >
            {grouped.map((gr) => (
                <button
                    key={gr.emoji}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReact?.(gr.emoji);
                    }}
                    title={gr.users.length > 0 ? `${gr.emoji} by ${gr.users.join(", ")}` : gr.emoji}
                    className={`inline-flex items-center gap-1 bg-white border border-[#E5E9EE] shadow-2xs rounded-full px-1.5 py-0.5 text-xs select-none transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                        gr.hasUserReacted ? "ring-1 ring-[#2F8F83] bg-[#EAF7F2]/50" : ""
                    }`}
                >
                    <span className="text-[13px] leading-none">{gr.emoji}</span>
                    {gr.count > 1 && (
                        <span className="text-[10px] font-semibold text-slate-600 leading-none">{gr.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

interface ReactionPickerProps {
    onSelectEmoji: (emoji: string) => void;
    onClose?: () => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function ReactionPicker({ onSelectEmoji, onClose }: ReactionPickerProps) {
    return (
        <div className="flex items-center gap-1 bg-white border border-slate-200/90 shadow-md rounded-full px-2 py-1 select-none animate-in fade-in zoom-in-95 duration-150">
            {QUICK_REACTIONS.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectEmoji(emoji);
                        onClose?.();
                    }}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-sm hover:bg-slate-100 transition-transform hover:scale-125 cursor-pointer active:scale-95"
                    title={emoji}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
