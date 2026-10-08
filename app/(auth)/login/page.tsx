"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const { login } = useAuth();

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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.status) {
                login(data.data.access_token);
            } else {
                setError(data.message || "Invalid email or password. Please try again.");
            }
        } catch (err) {
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
        } catch (err) {
            setError("Unable to connect to authentication server. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="w-full h-full max-h-screen flex flex-col items-center justify-between p-3 sm:p-4 z-10 overflow-y-auto sm:overflow-hidden">
            <main className="w-full max-w-[420px] my-auto py-2 sm:py-4">
                <Card className="w-full bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Header: Logo, Welcome Title & Subtitle */}
                    <div className="text-center space-y-1.5">
                        <div className="flex flex-col items-center justify-center">
                            <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
                                <img src="/images/logo.png" alt="Connectly360 Logo" className="h-7.5 sm:h-8.5 w-auto object-contain" />
                            </Link>
                            <span className="text-[10px] font-semibold text-[#35877D] tracking-widest uppercase mt-0.5 opacity-85">
                                Connect • Automate • Grow
                            </span>
                        </div>
                        <div className="pt-1 space-y-0.5">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                Welcome back 👋
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Sign in to your Connectly360 account
                            </p>
                        </div>
                    </div>

                    {/* Clean Polished Alert Banner */}
                    {error && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="flex items-start gap-2.5 p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl text-rose-800 text-xs font-medium leading-snug animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    {/* Google SSO Button */}
                    <Button
                        variant="outline"
                        type="button"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold h-9.5 sm:h-10 rounded-xl transition-all shadow-xs cursor-pointer text-xs sm:text-sm"
                        onClick={handleGoogleLogin}
                    >
                        {isGoogleLoading ? (
                            <>
                                <Loader2 className="animate-spin text-[#35877D]" size={15} />
                                <span>Connecting to Google...</span>
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                                        <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                                        <path d="M12,21c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.57c-0.9,0.6 -2.07,0.97 -3.3,0.97 -2.34,0 -4.33,-1.58 -5.04,-3.7L2.92,16.3c1.5,2.98 4.6,5 8.2,5z" fill="#34A853" />
                                        <path d="M6.96,13.57C6.78,13.04 6.68,12.48 6.68,11.9c0,-0.58 0.1,-1.14 0.28,-1.67L3.63,7.57C3.01,8.8 2.68,10.2 2.68,11.9c0,1.7 0.33,3.1 0.95,4.33z" fill="#FBBC05" />
                                        <path d="M12,5.27c1.3,0 2.48,0.45 3.4,1.33L17.5,4.5C16.03,3.12 14,2.27 12,2.27c-3.6,0 -6.7,2.02 -8.2,5l3.7,2.83c0.7,-2.12 2.7,-3.7 5.04,-3.7z" fill="#EA4335" />
                                    </g>
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </Button>

                    {/* Divider */}
                    <div className="relative flex py-0 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">or</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Sign In Form */}
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div className="space-y-1">
                            <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                                Email address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                disabled={isLoading || isGoogleLoading}
                                placeholder="name@company.com"
                                className="h-9.5 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#35877D]/20 focus-visible:border-[#35877D] rounded-xl bg-slate-50/50 font-medium text-slate-900 text-xs sm:text-sm px-3"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs font-semibold text-[#35877D] hover:text-[#2b7068] hover:underline cursor-pointer transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    disabled={isLoading || isGoogleLoading}
                                    placeholder="••••••••••••"
                                    className="h-9.5 pr-9 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#35877D]/20 focus-visible:border-[#35877D] rounded-xl bg-slate-50/50 font-medium text-slate-900 text-xs sm:text-sm px-3"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-md focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            className="w-full bg-[#35877D] hover:bg-[#2b7068] active:scale-[0.99] text-white font-semibold h-9.5 sm:h-10 rounded-xl gap-2 cursor-pointer shadow-sm shadow-[#35877D]/20 transition-all text-xs sm:text-sm mt-1"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={15} />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="text-center text-xs text-slate-500 font-medium pt-1.5 border-t border-slate-100">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-[#35877D] font-bold hover:underline cursor-pointer transition-colors">
                            Sign up
                        </Link>
                    </div>
                </Card>
            </main>

            <footer className="w-full text-center py-1 text-[11px] text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-[#35877D]" size={32} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
