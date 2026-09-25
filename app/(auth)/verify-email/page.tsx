"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, RotateCw, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useRegistrationSession } from "@/hooks/useRegistrationSession";

function VerifyEmailContent() {
    const router = useRouter();
    const { login } = useAuth();
    const {
        isLoading,
        hasPendingRegistration,
        email,
        status: challengeStatus,
        resendSeconds,
        canResend,
        error: sessionError,
        verifyOtp,
        resendOtp,
        changeEmail,
    } = useRegistrationSession();

    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!isLoading && !hasPendingRegistration && !isVerifiedSuccess) {
            router.replace("/register");
        }
    }, [isLoading, hasPendingRegistration, isVerifiedSuccess, router]);

    // Auto-focus first digit on mount
    useEffect(() => {
        if (!isLoading && hasPendingRegistration) {
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isLoading, hasPendingRegistration]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        setError(null);
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newOtp.every((digit) => digit !== "")) {
            handleVerifyCode(newOtp.join(""));
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
            handleVerifyCode(pastedData);
        }
    };

    const handleVerifyCode = async (codeToVerify?: string) => {
        const fullCode = codeToVerify || otp.join("");
        if (fullCode.length !== 6) {
            setError("Please enter all 6 digits of your verification code.");
            return;
        }

        setError(null);
        setIsVerifying(true);

        try {
            const data = await verifyOtp(fullCode);

            if (data.status && data.data?.access_token) {
                setIsVerifiedSuccess(true);
                setTimeout(() => {
                    login(data.data.access_token);
                    router.replace("/onboarding");
                }, 1200);
            } else {
                setError(data.message || "The verification code is incorrect. Please try again.");
                setOtp(Array(6).fill(""));
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError("Unable to connect to verification server. Please try again.");
            setOtp(Array(6).fill(""));
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend || isResending) return;
        setIsResending(true);
        setError(null);

        try {
            const data = await resendOtp();
            if (data.status) {
                setOtp(Array(6).fill(""));
                inputRefs.current[0]?.focus();
            } else {
                setError(data.message || "Failed to resend code.");
            }
        } catch (err) {
            setError("Failed to resend verification code. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleChangeEmail = async () => {
        setIsChangingEmail(true);
        try {
            await changeEmail();
        } catch (err) {
            // ignore
        } finally {
            router.replace("/register");
        }
    };

    // Show initial loading skeleton matching final card layout without text messages
    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 z-10 font-sans">
                <main className="my-auto w-full max-w-md py-4 sm:py-6">
                    <Card className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 rounded-3xl p-8 text-center space-y-6">
                        <div className="flex justify-center mb-2">
                            <Skeleton className="h-9 w-36 rounded-xl" />
                        </div>
                        <div className="flex flex-col items-center justify-center space-y-4 py-2">
                            <Skeleton variant="circular" className="h-16 w-16" />
                            <div className="space-y-2 w-full flex flex-col items-center">
                                <Skeleton className="h-6 w-56 rounded-lg" />
                                <Skeleton className="h-4 w-72 rounded-md" />
                            </div>
                            <div className="flex justify-center gap-2 pt-4 w-full">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-10 sm:w-12 rounded-xl" />
                                ))}
                            </div>
                            <Skeleton className="h-10 w-full rounded-xl mt-4" />
                        </div>
                    </Card>
                </main>
                <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                    © {new Date().getFullYear()} Connectly360. All rights reserved.
                </footer>
            </div>
        );
    }

    if (!hasPendingRegistration && !isVerifiedSuccess) {
        return null;
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 z-10 font-sans">
            <main className="my-auto w-full max-w-md py-4 sm:py-6">
                <Card className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="flex justify-center mb-1">
                            <Link href="/">
                                <img src="/images/logo.png" alt="Connectly360" className="h-9 w-auto object-contain" />
                            </Link>
                        </div>

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20 shadow-xs">
                            {isVerifiedSuccess ? <CheckCircle2 size={30} className="text-emerald-600" /> : <Mail size={28} />}
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isVerifiedSuccess ? "Verification Complete!" : "Verify your email"}
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                            {isVerifiedSuccess ? (
                                "Your email has been verified. Redirecting to workspace..."
                            ) : (
                                <>
                                    We've sent a 6-digit verification code to:
                                    <br />
                                    <strong className="text-slate-900 font-bold">{email || "your email address"}</strong>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Error Message */}
                    {(error || sessionError) && !isVerifiedSuccess && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3.5 text-xs font-semibold text-center flex items-center justify-center gap-2">
                            <AlertCircle size={16} className="shrink-0 text-rose-500" />
                            <span>{error || sessionError}</span>
                        </div>
                    )}

                    {!isVerifiedSuccess && (
                        <>
                            {/* 6-Digit OTP Box Grid */}
                            <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        disabled={isVerifying || isResending}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="h-12 w-10 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-2xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:bg-white focus:border-[#35877D] focus:ring-4 focus:ring-[#35877D]/15 focus:outline-none transition-all shadow-2xs disabled:opacity-50"
                                    />
                                ))}
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={() => handleVerifyCode()}
                                disabled={isVerifying || otp.some((d) => d === "")}
                                className="w-full bg-[#35877D] hover:bg-[#2c7068] text-white font-bold h-11.5 rounded-xl gap-2 shadow-md shadow-[#35877D]/20 transition-all cursor-pointer text-sm"
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

                            {/* Resend & Change Email Footer */}
                            <div className="space-y-3 pt-2 text-center border-t border-slate-100">
                                <p className="text-xs text-slate-500 font-medium">
                                    Didn't receive the code?{" "}
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendCode}
                                            disabled={isResending}
                                            className="text-[#35877D] font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        >
                                            {isResending && <RotateCw className="animate-spin" size={12} />}
                                            Resend code
                                        </button>
                                    ) : (
                                        <span className="text-slate-400 font-semibold">
                                            Resend available in{" "}
                                            <strong className="text-slate-700 font-bold">
                                                00:{resendSeconds < 10 ? `0${resendSeconds}` : resendSeconds}
                                            </strong>
                                        </span>
                                    )}
                                </p>

                                <div>
                                    <button
                                        type="button"
                                        onClick={handleChangeEmail}
                                        disabled={isChangingEmail || isVerifying}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    >
                                        <ArrowLeft size={13} />
                                        Wrong email? Change email
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </main>

            <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 z-10 font-sans">
                    <main className="my-auto w-full max-w-md py-4 sm:py-6">
                        <Card className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 rounded-3xl p-8 text-center space-y-6">
                            <div className="flex justify-center mb-2">
                                <img src="/images/logo.png" alt="Connectly360" className="h-9 w-auto object-contain" />
                            </div>
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <Loader2 size={32} className="animate-spin text-[#35877D]" />
                                <p className="text-xs font-semibold text-slate-500">Loading email verification...</p>
                            </div>
                        </Card>
                    </main>
                    <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                        © {new Date().getFullYear()} Connectly360. All rights reserved.
                    </footer>
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
