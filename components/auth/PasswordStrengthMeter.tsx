"use client";

import React, { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
    password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    const checks = useMemo(() => {
        return [
            { id: "length", label: "At least 8 characters", valid: password.length >= 8 },
            { id: "uppercase", label: "One uppercase letter", valid: /[A-Z]/.test(password) },
            { id: "lowercase", label: "One lowercase letter", valid: /[a-z]/.test(password) },
            { id: "number", label: "One number", valid: /[0-9]/.test(password) },
            { id: "special", label: "One special character (!@#$%^&*)", valid: /[^A-Za-z0-9]/.test(password) },
        ];
    }, [password]);

    const score = useMemo(() => {
        if (!password) return 0;
        return checks.filter((c) => c.valid).length;
    }, [password, checks]);

    const getStrengthColor = () => {
        if (score <= 1) return "bg-rose-500";
        if (score <= 3) return "bg-amber-500";
        if (score === 4) return "bg-emerald-400";
        return "bg-[#35877D]";
    };

    const getStrengthText = () => {
        if (!password) return "";
        if (score <= 1) return "Weak";
        if (score <= 3) return "Fair";
        if (score === 4) return "Good";
        return "Strong";
    };

    if (!password) return null;

    return (
        <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Password strength</span>
                    <span className={`font-bold ${score <= 2 ? "text-rose-600" : score <= 3 ? "text-amber-600" : "text-[#35877D]"}`}>
                        {getStrengthText()}
                    </span>
                </div>
                <div className="grid grid-cols-5 gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            className={`h-full rounded-full transition-all duration-300 ${
                                level <= score ? getStrengthColor() : "bg-slate-200"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-medium">
                {checks.map((check) => (
                    <div
                        key={check.id}
                        className={`flex items-center gap-1.5 transition-colors ${
                            check.valid ? "text-emerald-700 font-semibold" : "text-slate-400"
                        }`}
                    >
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                            check.valid ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        }`}>
                            {check.valid ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={2} />}
                        </div>
                        <span className="text-[11px] select-none">{check.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
