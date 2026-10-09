"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthSocialButtonProps {
    onClick: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    label?: string;
    loadingText?: string;
}

export function AuthSocialButton({
    onClick,
    isLoading = false,
    disabled = false,
    label = "Continue with Google",
    loadingText = "Connecting to Google..."
}: AuthSocialButtonProps) {
    return (
        <Button
            variant="outline"
            type="button"
            disabled={disabled || isLoading}
            className="w-full justify-center gap-2.5 border-slate-200 bg-white hover:bg-slate-50/80 active:bg-slate-100 text-slate-700 font-semibold h-10.5 rounded-xl transition-all shadow-xs cursor-pointer text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-[#35877D]/20 focus-visible:border-[#35877D]"
            onClick={onClick}
        >
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin text-[#35877D] shrink-0" size={16} />
                    <span>{loadingText}</span>
                </>
            ) : (
                <>
                    <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <g>
                            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                            <path d="M12,21c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.57c-0.9,0.6 -2.07,0.97 -3.3,0.97 -2.34,0 -4.33,-1.58 -5.04,-3.7L2.92,16.3c1.5,2.98 4.6,5 8.2,5z" fill="#34A853" />
                            <path d="M6.96,13.57C6.78,13.04 6.68,12.48 6.68,11.9c0,-0.58 0.1,-1.14 0.28,-1.67L3.63,7.57C3.01,8.8 2.68,10.2 2.68,11.9c0,1.7 0.33,3.1 0.95,4.33z" fill="#FBBC05" />
                            <path d="M12,5.27c1.3,0 2.48,0.45 3.4,1.33L17.5,4.5C16.03,3.12 14,2.27 12,2.27c-3.6,0 -6.7,2.02 -8.2,5l3.7,2.83c0.7,-2.12 2.7,-3.7 5.04,-3.7z" fill="#EA4335" />
                        </g>
                    </svg>
                    <span>{label}</span>
                </>
            )}
        </Button>
    );
}
