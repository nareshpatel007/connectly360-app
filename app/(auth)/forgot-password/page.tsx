"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.status) {
                setSubmitted(true);
            } else {
                setError(data.message || "Failed to submit reset request.");
            }
        } catch (err) {
            setError("Unable to connect to authentication server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 z-10">
            <main className="my-auto w-full max-w-md py-4 sm:py-6">
                <Card className="w-full bg-white border border-slate-200 shadow-md rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6">

                    {!submitted ? (
                        <>
                            <div className="text-center space-y-2">
                                <div className="flex justify-center mb-3">
                                    <img src="/images/logo.png" alt="Connectly360 Logo" className="h-9 w-auto object-contain" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900">Forgot Password?</h2>
                                <p className="text-xs sm:text-sm text-slate-500 leading-normal font-semibold">
                                    Enter your email address and we&apos;ll send you a link to reset your password.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 text-xs font-semibold text-center leading-normal">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-xs font-bold text-slate-900">
                                        Email Address
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        disabled={isLoading}
                                        placeholder="name@company.com"
                                        className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-11.5 rounded-xl gap-1.5 shadow-md transition-all mt-2 cursor-pointer text-sm"
                                >
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                    {!isLoading && <ArrowRight size={16} />}
                                </Button>
                            </form>

                            <div className="text-center text-xs pt-1">
                                <Link href="/login" className="text-[#35877D] font-extrabold hover:underline cursor-pointer">
                                    Back to sign in
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-5 py-2">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#35877D] border border-emerald-100 shadow-2xs">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reset Link Sent!</h2>
                                <p className="text-xs sm:text-sm text-slate-500 leading-normal max-w-sm mx-auto font-semibold">
                                    We&apos;ve emailed a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
                                </p>
                            </div>
                            <Button
                                onClick={() => setSubmitted(false)}
                                className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-11 rounded-xl text-sm"
                            >
                                Resend Email
                            </Button>
                            <div className="text-xs pt-1">
                                <Link href="/login" className="text-[#35877D] font-extrabold hover:underline">
                                    Back to sign in
                                </Link>
                            </div>
                        </div>
                    )}

                </Card>
            </main>

            {/* Simple Auth Footer */}
            <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>
        </div>
    );
}
