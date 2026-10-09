"use client";

import React from "react";
import { Input } from "@/components/ui/input";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    error?: string | null;
    helperText?: string;
    isRequired?: boolean;
    rightLabelAction?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
    ({ id, label, error, helperText, isRequired = false, rightLabelAction, className = "", ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label htmlFor={id} className="text-xs font-semibold text-slate-800">
                        {label} {isRequired && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                    {rightLabelAction && <div>{rightLabelAction}</div>}
                </div>
                <Input
                    ref={ref}
                    id={id}
                    className={`h-10 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs sm:text-sm font-medium rounded-xl px-3 transition-colors focus-visible:ring-2 focus-visible:ring-[#35877D]/20 focus-visible:border-[#35877D] ${
                        error ? "border-rose-400 focus-visible:ring-rose-200 focus-visible:border-rose-500" : ""
                    } ${className}`}
                    {...props}
                />
                {error && (
                    <p className="text-[11px] font-semibold text-rose-600 animate-in fade-in duration-150">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="text-[11px] text-slate-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

AuthInput.displayName = "AuthInput";
