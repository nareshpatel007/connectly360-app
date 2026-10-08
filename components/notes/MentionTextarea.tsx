"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { useMentionableUsers, type MentionableUser } from "@workspace/api-client-react";
import { AtSign, User, Shield, Check } from "lucide-react";

interface MentionTextareaProps {
    value: string;
    onChange: (value: string) => void;
    onMentionsChange?: (userIds: number[]) => void;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    className?: string;
    id?: string;
    autoFocus?: boolean;
}

export function MentionTextarea({
    value,
    onChange,
    onMentionsChange,
    placeholder = "Type a note... Use @ to mention team members",
    rows = 3,
    disabled = false,
    className = "",
    id,
    autoFocus = false,
}: MentionTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

    // Fetch matching workspace users
    const { data: mentionables = [], isLoading } = useMentionableUsers(mentionQuery);

    // Track cursor and @ trigger
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursor = e.target.selectionStart ?? newValue.length;
        onChange(newValue);

        // Check if there is an active '@' symbol immediately before or at the cursor
        const textBeforeCursor = newValue.slice(0, cursor);
        const match = /(?:^|\s)@([a-zA-Z0-9._-]*)$/.exec(textBeforeCursor);

        if (match) {
            const query = match[1];
            const atIndex = textBeforeCursor.lastIndexOf("@");
            setMentionStartIndex(atIndex);
            setMentionQuery(query);
            setIsMenuOpen(true);
            setSelectedIndex(0);
        } else {
            setIsMenuOpen(false);
            setMentionStartIndex(null);
            setMentionQuery("");
        }
    };

    // Insert chosen mention
    const insertMention = useCallback(
        (user: MentionableUser) => {
            if (!textareaRef.current || mentionStartIndex === null) return;

            const cursor = textareaRef.current.selectionStart ?? value.length;
            const beforeMention = value.slice(0, mentionStartIndex);
            const afterMention = value.slice(cursor);

            // Insert @UserName with a trailing space
            const mentionText = `@${user.name} `;
            const updatedValue = `${beforeMention}${mentionText}${afterMention}`;
            const newCursor = beforeMention.length + mentionText.length;

            onChange(updatedValue);

            // Record mentioned user ID
            setSelectedUserIds((prev) => {
                const next = new Set(prev);
                next.add(user.id);
                if (onMentionsChange) {
                    onMentionsChange(Array.from(next));
                }
                return next;
            });

            setIsMenuOpen(false);
            setMentionStartIndex(null);
            setMentionQuery("");

            // Refocus textarea and place cursor after inserted mention
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(newCursor, newCursor);
                }
            }, 0);
        },
        [mentionStartIndex, value, onChange, onMentionsChange]
    );

    // Keyboard navigation inside dropdown
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!isMenuOpen || mentionables.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % mentionables.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + mentionables.length) % mentionables.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            if (mentionables[selectedIndex]) {
                insertMention(mentionables[selectedIndex]);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setIsMenuOpen(false);
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Quick button to start a mention
    const handleTriggerMention = () => {
        if (!textareaRef.current) return;
        const currentVal = value;
        const cursor = textareaRef.current.selectionStart ?? currentVal.length;
        const needsSpace = cursor > 0 && currentVal[cursor - 1] !== " " && currentVal[cursor - 1] !== "\n";
        const inserted = needsSpace ? " @" : "@";

        const before = currentVal.slice(0, cursor);
        const after = currentVal.slice(cursor);
        const updated = `${before}${inserted}${after}`;
        const newPos = before.length + inserted.length;

        onChange(updated);
        setMentionStartIndex(newPos - 1);
        setMentionQuery("");
        setIsMenuOpen(true);
        setSelectedIndex(0);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    return (
        <div className="relative w-full">
            <textarea
                ref={textareaRef}
                id={id}
                rows={rows}
                value={value}
                disabled={disabled}
                autoFocus={autoFocus}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`w-full p-2.5 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl resize-none focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${className}`}
            />

            {/* Quick action bar */}
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 px-1">
                <button
                    type="button"
                    onClick={handleTriggerMention}
                    className="inline-flex items-center gap-1 text-[#2F8F83] hover:text-[#25756B] font-medium transition-colors hover:bg-teal-50/60 px-1.5 py-0.5 rounded-md"
                    title="Mention team member (@)"
                >
                    <AtSign size={12} />
                    <span>Mention teammate</span>
                </button>
                <span className="text-[10px] text-slate-400">Type @ to mention</span>
            </div>

            {/* Floating Mention Autocomplete Dropdown */}
            {isMenuOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 left-0 bottom-full mb-1 w-72 max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                        <span className="flex items-center gap-1">
                            <AtSign size={10} className="text-[#2F8F83]" /> Team Members
                        </span>
                        {mentionQuery && (
                            <span className="text-[9px] font-normal text-slate-400 lowercase">
                                matching &ldquo;{mentionQuery}&rdquo;
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="py-3 text-center text-xs text-slate-400">Searching colleagues...</div>
                    ) : mentionables.length === 0 ? (
                        <div className="py-3 text-center text-xs text-slate-400">
                            No team members found for &ldquo;@{mentionQuery}&rdquo;
                        </div>
                    ) : (
                        <ul className="space-y-0.5">
                            {mentionables.map((user, idx) => {
                                const isSelected = idx === selectedIndex;
                                return (
                                    <li
                                        key={user.id}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        onClick={() => insertMention(user)}
                                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                            isSelected ? "bg-teal-50/80 text-[#2F8F83]" : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="h-6 w-6 rounded-full bg-teal-100 text-[#2F8F83] font-bold flex items-center justify-center text-[10px] shrink-0 border border-teal-200">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate text-[12px] leading-tight text-slate-800">
                                                    {user.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate leading-tight">
                                                    {user.email || `@${user.handle}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1">
                                            {user.role && (
                                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                                                    {user.role}
                                                </span>
                                            )}
                                            {isSelected && <Check size={12} className="text-[#2F8F83]" />}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Helper to render note text with highlighted @mention badges
 */
export function MentionFormattedText({
    text,
    mentions,
    className = "",
}: {
    text: string;
    mentions?: Array<{ id: number; name: string; email?: string }> | null;
    className?: string;
}) {
    if (!text) return null;

    // Split text by @mentions (e.g., @Name or @FirstName LastName)
    const parts = text.split(/(@[a-zA-Z0-9_\-\.\s]{1,30}\b)/g);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.startsWith("@")) {
                    const mentionCandidate = part.slice(1).trim();
                    const isMatched = mentions?.some(
                        (m) => m.name.toLowerCase() === mentionCandidate.toLowerCase()
                    );

                    return (
                        <span
                            key={index}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                                isMatched || mentions === undefined
                                    ? "bg-teal-50 text-[#2F8F83] border border-teal-200/80 hover:bg-teal-100/60"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                            title={`Mentioned: ${part}`}
                        >
                            <AtSign size={10} className="shrink-0" />
                            {mentionCandidate}
                        </span>
                    );
                }
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </span>
    );
}
