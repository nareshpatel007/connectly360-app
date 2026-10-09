"use client";

import React from "react";

interface AuthDividerProps {
    text?: string;
}

export function AuthDivider({ text = "or continue with email" }: AuthDividerProps) {
    return (
        <div className="relative flex items-center my-4 select-none">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium tracking-wide">
                {text}
            </span>
            <div className="flex-grow border-t border-slate-200" />
        </div>
    );
}
