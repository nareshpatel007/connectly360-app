"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            setStatus("error");
            switch (errorParam) {
                case "google_cancelled":
                    setErrorMessage("Google sign-in was cancelled.");
                    break;
                case "invalid_state":
                    setErrorMessage("Authentication request expired or invalid security token. Please try again.");
                    break;
                case "google_no_email":
                    setErrorMessage("Unable to retrieve your email address from Google. Please try another account or sign up with email.");
                    break;
                case "google_email_conflict":
                    setErrorMessage("A Connectly360 account already exists with this email. Please sign in using your existing password first.");
                    break;
                case "account_suspended":
                    setErrorMessage("Your Connectly360 account is currently suspended. Please contact support.");
                    break;
                case "google_registration_failed":
                    setErrorMessage("Could not complete account setup via Google. Please try again or sign up with email.");
                    break;
                default:
                    setErrorMessage("Google sign-in failed. Please try again or use email and password.");
                    break;
            }
            return;
        }

        if (!code) {
            setStatus("error");
            setErrorMessage("No authorization code returned from Google. Please try logging in again.");
            return;
        }

        // Exchange code with Laravel backend
        const exchangeCode = async () => {
            try {
                const res = await fetch("/api/auth/google/exchange", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                const data = await res.json();

                if (res.ok && data.status) {
                    setStatus("success");
                    const token = data.data.access_token;
                    const isOnboardingCompleted = data.data.onboarding_completed;
                    const destination = isOnboardingCompleted ? "/dashboard" : "/onboarding";

                    // Small smooth delay for clean UI transition
                    setTimeout(() => {
                        login(token, destination);
                    }, 500);
                } else {
                    setStatus("error");
                    setErrorMessage(data.message || "Unable to complete Google sign-in. Please try again.");
                }
            } catch (err) {
                setStatus("error");
                setErrorMessage("Unable to connect to authentication server. Please try again later.");
            }
        };

        exchangeCode();
    }, [searchParams, login]);

    return (
        <Card className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
            {/* Connectly360 Logo Header */}
            <div className="flex justify-center mb-2">
                <img src="/images/logo.png" alt="Connectly360" className="h-9 w-auto object-contain" />
            </div>

            {status === "verifying" && (
                <div className="space-y-4 py-4">
                    <div className="relative flex items-center justify-center mx-auto">
                        <div className="h-14 w-14 rounded-full border-4 border-[#35877D]/20 border-t-[#35877D] animate-spin" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">Signing you in...</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Please wait while we securely complete your Google sign-in.
                        </p>
                    </div>
                </div>
            )}

            {status === "success" && (
                <div className="space-y-4 py-4">
                    <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                        <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">Successfully Authenticated!</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Redirecting you to your Connectly360 workspace...
                        </p>
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="space-y-5 py-2">
                    <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                        <AlertTriangle size={30} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-bold text-slate-900">Unable to Sign In</h3>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed px-2">
                            {errorMessage}
                        </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                        <Button
                            asChild
                            className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-10.5 rounded-xl gap-2 cursor-pointer shadow-sm text-xs sm:text-sm"
                        >
                            <Link href="/login">
                                Back to Login <ArrowRight size={15} />
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense
            fallback={
                <Card className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl p-8 text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <img src="/images/logo.png" alt="Connectly360" className="h-9 w-auto object-contain" />
                    </div>
                    <div className="h-12 w-12 rounded-full border-4 border-[#35877D]/20 border-t-[#35877D] animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Loading authentication state...</p>
                </Card>
            }
        >
            <GoogleCallbackContent />
        </Suspense>
    );
}
