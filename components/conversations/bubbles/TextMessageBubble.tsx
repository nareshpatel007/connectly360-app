"use client";

import React from "react";

interface TextMessageBubbleProps {
    text: string;
    isInbound: boolean;
}

export function TextMessageBubble({ text, isInbound }: TextMessageBubbleProps) {
    // Detect URLs and render clickable links without stripping Unicode emojis
    const renderFormattedText = (rawText: string) => {
        if (!rawText) return null;

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = rawText.split(urlRegex);

        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600 hover:text-blue-800 break-all inline-block font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    return (
        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
            {renderFormattedText(text)}
        </div>
    );
}
