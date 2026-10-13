"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthInput } from "@/components/auth/AuthInput";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError("Email address is required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (data.status) {
                setSubmitted(true);
            } else {
                setError(data.message || "Failed to submit reset request. Please check the email address.");
            }
        } catch {
            setError("Unable to connect to authentication server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthSplitLayout>
            <Card className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4.5">
                {!submitted ? (
                    <>
                        {/* Header */}
                        <div className="space-y-1 text-left">
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                                Forgot password?
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="flex items-start gap-2.5 p-3 bg-rose-50/90 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200"
                            >
                                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="flex-1">{error}</div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <AuthInput
                                id="email"
                                label="Email address"
                                type="email"
                                isRequired
                                autoComplete="email"
                                disabled={isLoading}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError(null);
                                }}
                            />

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#35877D] hover:bg-[#2b7068] active:scale-[0.99] text-white font-semibold h-10.5 rounded-xl gap-2 cursor-pointer shadow-sm shadow-[#35877D]/25 transition-all text-xs sm:text-sm mt-1 focus-visible:ring-2 focus-visible:ring-[#35877D]/40"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin shrink-0" size={16} />
                                        <span>Sending reset link...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send Reset Link</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Sign in back link */}
                        <div className="text-center text-xs text-slate-500 font-medium pt-3 border-t border-slate-100">
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="text-[#35877D] font-bold hover:text-[#286f66] hover:underline cursor-pointer transition-colors"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    </>
                ) : (
                    /* Success state */
                    <div className="text-center space-y-4 py-2">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20 shadow-xs">
                            <CheckCircle2 size={28} />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                                Reset link sent!
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                                We&apos;ve emailed a password reset link to <strong className="text-slate-900 font-semibold">{email}</strong>. Please check your inbox and spam folder.
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setSubmitted(false);
                                setError(null);
                            }}
                            variant="outline"
                            className="w-full border-slate-200 hover:bg-slate-50 font-semibold h-10.5 rounded-xl text-xs sm:text-sm text-slate-700 cursor-pointer"
                        >
                            Send to another email
                        </Button>
                        <div className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                            <Link
                                href="/login"
                                className="text-[#35877D] font-bold hover:text-[#286f66] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                            >
                                <ArrowLeft size={13} />
                                <span>Back to sign in</span>
                            </Link>
                        </div>
                    </div>
                )}
            </Card>
        </AuthSplitLayout>
    );
}
