"use client";

import React, { useState, useMemo } from "react";
import { Smile, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const EMOJI_CATEGORIES: { name: string; icon: string; emojis: { char: string; name: string }[] }[] = [
    {
        name: "Smileys",
        icon: "😀",
        emojis: [
            { char: "😀", name: "grinning" }, { char: "😃", name: "smiley" }, { char: "😄", name: "smile" },
            { char: "😁", name: "beam" }, { char: "😆", name: "laughing" }, { char: "😅", name: "sweat smile" },
            { char: "🤣", name: "rofl" }, { char: "😂", name: "joy" }, { char: "🙂", name: "slightly smiling" },
            { char: "🙃", name: "upside down" }, { char: "😉", name: "wink" }, { char: "😊", name: "blush" },
            { char: "😇", name: "innocent" }, { char: "🥰", name: "heart eyes smiling" }, { char: "😍", name: "heart eyes" },
            { char: "🤩", name: "star struck" }, { char: "😘", name: "kissing heart" }, { char: "😗", name: "kissing" },
            { char: "😚", name: "kissing closed eyes" }, { char: "😋", name: "yum" }, { char: "😛", name: "stuck out tongue" },
            { char: "😜", name: "wink tongue" }, { char: "🤪", name: "zany" }, { char: "😝", name: "squint tongue" },
            { char: "🤑", name: "money mouth" }, { char: "🤗", name: "hugs" }, { char: "🤭", name: "hand over mouth" },
            { char: "🤫", name: "shushing" }, { char: "🤔", name: "thinking" }, { char: "🤐", name: "zipper mouth" },
            { char: "🤨", name: "raised eyebrow" }, { char: "😐", name: "neutral" }, { char: "😑", name: "expressionless" },
            { char: "😶", name: "no mouth" }, { char: "😏", name: "smirk" }, { char: "😒", name: "unamused" },
            { char: "🙄", name: "roll eyes" }, { char: "😬", name: "grimacing" }, { char: "🤥", name: "lying" },
            { char: "😌", name: "relieved" }, { char: "😔", name: "pensive" }, { char: "😪", name: "sleepy" },
            { char: "🤤", name: "drooling" }, { char: "😴", name: "sleeping" }, { char: "😷", name: "mask" },
            { char: "🤒", name: "thermometer" }, { char: "🤕", name: "bandage" }, { char: "🤢", name: "nauseated" },
            { char: "🤮", name: "vomiting" }, { char: "🥵", name: "hot" }, { char: "🥶", name: "cold" },
            { char: "🥴", name: "woozy" }, { char: "😵", name: "dizzy" }, { char: "🤯", name: "exploding head" },
            { char: "🤠", name: "cowboy" }, { char: "🥳", name: "partying" }, { char: "😎", name: "sunglasses" },
        ],
    },
    {
        name: "Gestures",
        icon: "👍",
        emojis: [
            { char: "👍", name: "thumbs up" }, { char: "👎", name: "thumbs down" }, { char: "👌", name: "ok hand" },
            { char: "✌️", name: "victory" }, { char: "🤞", name: "crossed fingers" }, { char: "🤟", name: "love you" },
            { char: "🤘", name: "rock on" }, { char: "🤙", name: "call me" }, { char: "👈", name: "point left" },
            { char: "👉", name: "point right" }, { char: "👆", name: "point up" }, { char: "👇", name: "point down" },
            { char: "☝️", name: "index up" }, { char: "✋", name: "raised hand" }, { char: "🤚", name: "back of hand" },
            { char: "🖐️", name: "hand splayed" }, { char: "🖖", name: "vulcan" }, { char: "👋", name: "wave" },
            { char: "🤙", name: "shaka" }, { char: "👏", name: "clap" }, { char: "🤝", name: "handshake" },
            { char: "🙏", name: "pray please" }, { char: "✍️", name: "writing" }, { char: "💪", name: "biceps flex" },
            { char: "❤️", name: "red heart" }, { char: "🧡", name: "orange heart" }, { char: "💛", name: "yellow heart" },
            { char: "💚", name: "green heart" }, { char: "💙", name: "blue heart" }, { char: "💜", name: "purple heart" },
            { char: "🖤", name: "black heart" }, { char: "🤍", name: "white heart" }, { char: "🤎", name: "brown heart" },
            { char: "💔", name: "broken heart" }, { char: "💖", name: "sparkling heart" }, { char: "🔥", name: "fire" },
        ],
    },
    {
        name: "Objects & Work",
        icon: "💼",
        emojis: [
            { char: "💼", name: "briefcase" }, { char: "📁", name: "folder" }, { char: "📄", name: "document" },
            { char: "📅", name: "calendar" }, { char: "📈", name: "chart upwards" }, { char: "📉", name: "chart downwards" },
            { char: "📊", name: "bar chart" }, { char: "📋", name: "clipboard" }, { char: "📌", name: "pin" },
            { char: "📍", name: "map pin" }, { char: "📎", name: "paperclip" }, { char: "📏", name: "ruler" },
            { char: "📐", name: "triangular ruler" }, { char: "🔒", name: "lock" }, { char: "🔓", name: "unlock" },
            { char: "🔑", name: "key" }, { char: "🔨", name: "hammer" }, { char: "🛠️", name: "tools" },
            { char: "⚙️", name: "gear" }, { char: "📦", name: "package box" }, { char: "🏷️", name: "label tag" },
            { char: "💳", name: "credit card" }, { char: "💰", name: "money bag" }, { char: "💵", name: "dollar bill" },
            { char: "🪙", name: "coin" }, { char: "✉️", name: "envelope" }, { char: "📧", name: "email" },
            { char: "📞", name: "telephone" }, { char: "📱", name: "phone mobile" }, { char: "💻", name: "laptop" },
            { char: "🖥️", name: "desktop computer" }, { char: "🔔", name: "bell alert" }, { char: "🚀", name: "rocket" },
            { char: "🎉", name: "party popper" }, { char: "✨", name: "sparkles" }, { char: "⭐", name: "star" },
        ],
    },
];

interface EmojiPickerPopoverProps {
    onSelectEmoji: (emoji: string) => void;
}

export function EmojiPickerPopover({ onSelectEmoji }: EmojiPickerPopoverProps) {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const filteredEmojis = useMemo(() => {
        if (!search.trim()) return null;
        const q = search.toLowerCase();
        const results: { char: string; name: string }[] = [];
        for (const cat of EMOJI_CATEGORIES) {
            for (const e of cat.emojis) {
                if (e.name.toLowerCase().includes(q) || e.char.includes(q)) {
                    results.push(e);
                }
            }
        }
        return results;
    }, [search]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Insert Emoji"
                >
                    <Smile size={14} />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                className="w-80 p-2.5 bg-white border border-slate-200 shadow-xl rounded-xl"
            >
                {/* Search */}
                <div className="relative mb-2">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search emojis..."
                        className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#2F8F83]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Categories Tab Bar */}
                {!search && (
                    <div className="flex items-center gap-1 border-b border-slate-100 pb-1 mb-2">
                        {EMOJI_CATEGORIES.map((cat, idx) => (
                            <button
                                key={cat.name}
                                type="button"
                                onClick={() => setActiveTab(idx)}
                                className={`h-7 px-2 rounded flex items-center gap-1 text-xs cursor-pointer transition-colors ${
                                    activeTab === idx
                                        ? "bg-[#2F8F83]/10 text-[#2F8F83] font-semibold"
                                        : "text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                <span className="text-sm">{cat.icon}</span>
                                <span className="text-[11px]">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Emoji Grid */}
                <div className="h-48 overflow-y-auto grid grid-cols-8 gap-1 p-1">
                    {filteredEmojis ? (
                        filteredEmojis.length > 0 ? (
                            filteredEmojis.map((e, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        onSelectEmoji(e.char);
                                        setIsOpen(false);
                                    }}
                                    className="h-8 w-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded cursor-pointer transition-transform hover:scale-125"
                                    title={e.name}
                                >
                                    {e.char}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-8 flex items-center justify-center h-32 text-xs text-slate-400">
                                No emojis found
                            </div>
                        )
                    ) : (
                        EMOJI_CATEGORIES[activeTab].emojis.map((e, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    onSelectEmoji(e.char);
                                    setIsOpen(false);
                                }}
                                className="h-8 w-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded cursor-pointer transition-transform hover:scale-125"
                                title={e.name}
                            >
                                {e.char}
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
