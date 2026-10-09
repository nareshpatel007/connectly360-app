"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AuthPasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    error?: string | null;
    isRequired?: boolean;
    rightLabelAction?: React.ReactNode;
    forceShowPassword?: boolean;
    onToggleShowPassword?: (visible: boolean) => void;
}

export const AuthPasswordInput = React.forwardRef<HTMLInputElement, AuthPasswordInputProps>(
    ({
        id,
        label,
        error,
        isRequired = false,
        rightLabelAction,
        forceShowPassword,
        onToggleShowPassword,
        className = "",
        ...props
    }, ref) => {
        const [internalShow, setInternalShow] = useState(false);
        const isVisible = forceShowPassword !== undefined ? forceShowPassword : internalShow;

        const toggleVisibility = () => {
            const next = !isVisible;
            setInternalShow(next);
            if (onToggleShowPassword) {
                onToggleShowPassword(next);
            }
        };

        return (
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label htmlFor={id} className="text-xs font-semibold text-slate-800">
                        {label} {isRequired && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                    {rightLabelAction && <div>{rightLabelAction}</div>}
                </div>
                <div className="relative">
                    <Input
                        ref={ref}
                        id={id}
                        type={isVisible ? "text" : "password"}
                        className={`h-10 pr-10 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs sm:text-sm font-medium rounded-xl px-3 transition-colors focus-visible:ring-2 focus-visible:ring-[#35877D]/20 focus-visible:border-[#35877D] ${
                            error ? "border-rose-400 focus-visible:ring-rose-200 focus-visible:border-rose-500" : ""
                        } ${className}`}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={toggleVisibility}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35877D]/30 cursor-pointer"
                        aria-label={isVisible ? "Hide password" : "Show password"}
                    >
                        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {error && (
                    <p className="text-[11px] font-semibold text-rose-600 animate-in fade-in duration-150">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

AuthPasswordInput.displayName = "AuthPasswordInput";
