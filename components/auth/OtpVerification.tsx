"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, ArrowRight, RotateCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OtpVerificationProps {
    email: string;
    onVerified: (token: string) => void;
    onResend?: () => Promise<void>;
}

export function OtpVerification({ email, onVerified, onResend }: OtpVerificationProps) {
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [timer, setTimer] = useState<number>(30);
    const [canResend, setCanResend] = useState<boolean>(false);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const [isResending, setIsResending] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<number>(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit if all 6 digits entered
        if (newOtp.every((digit) => digit !== "")) {
            handleVerify(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split("");
            setOtp(digits);
            inputRefs.current[5]?.focus();
            handleVerify(pastedData);
        }
    };

    const handleVerify = async (codeToVerify?: string) => {
        const fullCode = codeToVerify || otp.join("");
        if (fullCode.length !== 6) {
            setError("Please enter all 6 digits of your verification code.");
            return;
        }

        if (attempts >= 5) {
            setError("Maximum verification attempts reached. Please request a new code.");
            return;
        }

        setError(null);
        setIsVerifying(true);
        setAttempts((prev) => prev + 1);

        try {
            const res = await fetch("/api/auth/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: fullCode }),
            });
            const data = await res.json();

            if (data.status && data.data?.access_token) {
                onVerified(data.data.access_token);
            } else {
                setError(data.message || "Invalid verification code. Please try again.");
            }
        } catch (err) {
            setError("Unable to connect to verification server. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend || isResending) return;
        setIsResending(true);
        setError(null);

        try {
            if (onResend) {
                await onResend();
            } else {
                await fetch("/api/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
            }
            setTimer(30);
            setCanResend(false);
            setOtp(Array(6).fill(""));
            setAttempts(0);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError("Failed to resend verification code.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-6 py-2">
            <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20 shadow-sm">
                    <CheckCircle2 size={30} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify your email</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
                    We've sent a 6-digit verification code to:
                    <br />
                    <strong className="text-slate-900 font-bold">{email}</strong>
                </p>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* 6-Digit OTP Box Grid */}
            <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        disabled={isVerifying}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#35877D] focus:ring-2 focus:ring-[#35877D]/20 focus:outline-none transition-all shadow-xs"
                    />
                ))}
            </div>

            {/* Submit Button */}
            <Button
                onClick={() => handleVerify()}
                disabled={isVerifying || otp.some((d) => d === "")}
                className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-11.5 rounded-xl gap-2 shadow-md transition-all cursor-pointer text-sm"
            >
                {isVerifying ? (
                    <>
                        <Loader2 className="animate-spin" size={16} />
                        Verifying Code...
                    </>
                ) : (
                    <>
                        Verify & Continue
                        <ArrowRight size={16} />
                    </>
                )}
            </Button>

            {/* Resend Timer */}
            <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                    Didn't receive the code?{" "}
                    {canResend ? (
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isResending}
                            className="text-[#35877D] font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                            {isResending && <RotateCw className="animate-spin" size={12} />}
                            Resend code
                        </button>
                    ) : (
                        <span className="text-slate-400 font-semibold">
                            Resend available in <strong className="text-slate-700">00:{timer < 10 ? `0${timer}` : timer}</strong>
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
