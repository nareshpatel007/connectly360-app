"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthPasswordInput } from "@/components/auth/AuthPasswordInput";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Load remembered email on initial mount
    useEffect(() => {
        try {
            const savedEmail = localStorage.getItem("remembered_email");
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        } catch {
            // ignore storage access issues
        }
    }, []);

    // Handle OAuth callback error parameters
    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam) {
            switch (errorParam) {
                case "google_cancelled":
                    setError("Google sign-in was cancelled.");
                    break;
                case "invalid_state":
                    setError("Authentication request expired or invalid security token. Please try again.");
                    break;
                case "google_no_email":
                    setError("Unable to retrieve your email address from Google. Please try another account or sign up with email.");
                    break;
                case "google_email_conflict":
                    setError("A Connectly360 account already exists with this email. Please sign in using your existing password first.");
                    break;
                case "account_suspended":
                    setError("Your Connectly360 account is currently suspended. Please contact support.");
                    break;
                case "google_registration_failed":
                    setError("Could not complete account setup via Google. Please try again or sign up with email.");
                    break;
                default:
                    setError("Google sign-in failed. Please try again or use email and password.");
                    break;
            }
        }
    }, [searchParams]);

    const validateForm = () => {
        const errors: { email?: string; password?: string } = {};
        if (!email.trim()) {
            errors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.email = "Please enter a valid email address.";
        }

        if (!password) {
            errors.password = "Password is required.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await res.json();

            if (data.status && data.data?.access_token) {
                // Handle remember me preference
                try {
                    if (rememberMe) {
                        localStorage.setItem("remembered_email", email.trim());
                    } else {
                        localStorage.removeItem("remembered_email");
                    }
                } catch {
                    // ignore
                }

                login(data.data.access_token);
            } else {
                setError(data.message || "Invalid email or password. Please try again.");
            }
        } catch {
            setError("Unable to connect to Connectly360. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsGoogleLoading(true);

        try {
            const res = await fetch("/api/auth/google/redirect");
            const data = await res.json();
            if (data.status && data.url) {
                window.location.href = data.url;
            } else {
                setError(data.message || "Google sign-in is temporarily unavailable. Please use email and password.");
                setIsGoogleLoading(false);
            }
        } catch {
            setError("Unable to connect to authentication server. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    return (
        <Card className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4">
            {/* Form Header */}
            <div className="space-y-1 text-left">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                    Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Sign in to your Connectly360 workspace.
                </p>
            </div>

            {/* Error Banner */}
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

            {/* 1. Continue with Google SSO Button */}
            <AuthSocialButton
                onClick={handleGoogleLogin}
                isLoading={isGoogleLoading}
                disabled={isLoading}
                label="Continue with Google"
                loadingText="Connecting to Google..."
            />

            {/* 2. Divider */}
            <AuthDivider text="or continue with email" />

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3.5" noValidate>
                {/* 3. Email Address */}
                <AuthInput
                    id="email"
                    label="Email address"
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isLoading || isGoogleLoading}
                    placeholder="name@company.com"
                    value={email}
                    error={fieldErrors.email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                            setFieldErrors((prev) => ({ ...prev, email: undefined }));
                        }
                    }}
                />

                {/* 4. Password & 5. Forgot Password */}
                <AuthPasswordInput
                    id="password"
                    label="Password"
                    required
                    autoComplete="current-password"
                    disabled={isLoading || isGoogleLoading}
                    placeholder="••••••••••••"
                    value={password}
                    error={fieldErrors.password}
                    rightLabelAction={
                        <Link
                            href="/forgot-password"
                            className="text-xs font-semibold text-[#35877D] hover:text-[#286f66] hover:underline transition-colors focus:outline-none"
                            tabIndex={isLoading || isGoogleLoading ? -1 : 0}
                        >
                            Forgot password?
                        </Link>
                    }
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                            setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        }
                    }}
                />

                {/* 6. Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            disabled={isLoading || isGoogleLoading}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-[#35877D] focus:ring-[#35877D] cursor-pointer"
                        />
                        <span className="text-xs text-slate-600 font-medium">Remember me</span>
                    </label>
                </div>

                {/* 7. Sign In Primary Button */}
                <Button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full bg-[#35877D] hover:bg-[#2b7068] active:scale-[0.99] text-white font-semibold h-10 rounded-xl gap-2 cursor-pointer shadow-sm shadow-[#35877D]/25 transition-all text-xs sm:text-sm mt-1 focus-visible:ring-2 focus-visible:ring-[#35877D]/40"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin shrink-0" size={16} />
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            <span>Sign In</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                </Button>
            </form>

            {/* 8. Link to Create an Account */}
            <div className="text-center text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="text-[#35877D] font-bold hover:text-[#286f66] hover:underline cursor-pointer transition-colors"
                >
                    Sign up
                </Link>
            </div>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <AuthSplitLayout>
            <Suspense
                fallback={
                    <Card className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl p-8 flex flex-col items-center justify-center min-h-[360px] space-y-3">
                        <Loader2 className="animate-spin text-[#35877D]" size={32} />
                        <p className="text-xs font-semibold text-slate-500">Loading your workspace sign-in...</p>
                    </Card>
                }
            >
                <LoginContent />
            </Suspense>
        </AuthSplitLayout>
    );
}
