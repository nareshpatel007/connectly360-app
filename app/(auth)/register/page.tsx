"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Loader2, Info, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { useAuth } from "@/lib/auth-context";

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://connectly360.com";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get("invite_token");
    const { login } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    
    const [step, setStep] = useState<"account" | "verify">("account");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isCheckingInvite, setIsCheckingInvite] = useState(false);

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
    const [inviteDetails, setInviteDetails] = useState<{
        email: string;
        role: string;
        company_name: string;
    } | null>(null);

    useEffect(() => {
        if (inviteToken) {
            const checkInviteToken = async () => {
                setIsCheckingInvite(true);
                try {
                    const res = await fetch(`/api/workspace/invite/check?token=${inviteToken}`);
                    const data = await res.json();
                    if (data.status) {
                        setInviteDetails(data.data);
                        setEmail(data.data.email);
                    } else {
                        setError(data.message || "The workspace invitation is invalid or has expired.");
                    }
                } catch (err) {
                    setError("Failed to verify workspace invitation.");
                } finally {
                    setIsCheckingInvite(false);
                }
            };
            checkInviteToken();
        }
    }, [inviteToken]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setError("You must agree to the Terms of Service and Privacy Policy.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    email,
                    password,
                    invite_token: inviteToken || undefined
                }),
            });
            const data = await res.json();
            if (data.status) {
                setStep("verify");
            } else {
                setError(data.message || "Failed to create account.");
            }
        } catch (err) {
            setError("Unable to connect to registration server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerificationComplete = (token: string) => {
        login(token);
        router.push("/onboarding");
    };

    return (
        <Card className="w-full bg-white border border-slate-200 shadow-md rounded-3xl overflow-hidden p-6 sm:p-9 space-y-6">
            {step === "verify" ? (
                <OtpVerification
                    email={email}
                    onVerified={handleVerificationComplete}
                />
            ) : (
                <>
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-3">
                            <img src="/images/logo.png" alt="Connectly360 Logo" className="h-9 w-auto object-contain" />
                        </div>
                        {inviteDetails ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#35877D]/10 text-[#35877D] text-xs font-medium border border-[#35877D]/20 mb-4 text-left w-full">
                                <Info size={16} className="shrink-0 text-[#35877D]" />
                                <span>
                                    Joining workspace: <strong className="text-slate-900">{inviteDetails.company_name}</strong> as <strong className="text-slate-900">{inviteDetails.role}</strong> role
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#35877D]/10 text-[#35877D] text-xs font-bold border border-[#35877D]/20 mb-1">
                                <Sparkles size={12} className="animate-pulse" />
                                Start Your Free Trial
                            </div>
                        )}
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Create your account</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">Start your free trial and connect your customer conversations in one place.</p>
                    </div>

                    {isCheckingInvite ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                            <Loader2 className="animate-spin text-[#35877D]" size={24} />
                            <p className="text-xs text-slate-500 font-medium">Verifying invitation details...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3.5 text-xs font-semibold text-center">
                                    {error}
                                </div>
                            )}

                            {/* Google SSO Button */}
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading || isGoogleLoading}
                                className="w-full justify-center gap-2 border-slate-250 text-slate-700 font-bold hover:bg-slate-50 h-11 rounded-xl transition-all shadow-2xs cursor-pointer text-xs sm:text-sm"
                                onClick={handleGoogleLogin}
                            >
                                {isGoogleLoading ? (
                                    <>
                                        <Loader2 className="animate-spin text-[#35877D]" size={16} />
                                        Connecting to Google...
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
                                        Continue with Google
                                    </>
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative flex py-0.5 items-center">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">or</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            {/* Registration Form */}
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* First & Last Name row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="firstName" className="text-xs font-bold text-slate-800">
                                            First Name <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            id="firstName"
                                            type="text"
                                            required
                                            disabled={isLoading}
                                            placeholder="John"
                                            className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="lastName" className="text-xs font-bold text-slate-800">
                                            Last Name <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            required
                                            disabled={isLoading}
                                            placeholder="Doe"
                                            className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Business Email */}
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-xs font-bold text-slate-800">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        disabled={isLoading || !!inviteDetails}
                                        placeholder="name@company.com"
                                        className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                {/* Password with Toggle & Strength Meter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="password" className="text-xs font-bold text-slate-800">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            disabled={isLoading}
                                            placeholder="Create a secure password"
                                            className="h-11 pr-10 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <PasswordStrengthMeter password={password} />
                                </div>

                                {/* Checkbox agreement */}
                                <div className="flex items-start gap-2.5 pt-1">
                                    <input
                                        id="agreedToTerms"
                                        type="checkbox"
                                        disabled={isLoading}
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-1.5 h-4 w-4 rounded border-slate-300 text-[#35877D] focus:ring-[#35877D] cursor-pointer"
                                        required
                                    />
                                    <label htmlFor="agreedToTerms" className="text-xs text-slate-500 font-normal leading-relaxed select-none">
                                        I agree to the{" "}
                                        <a href={`${WEBSITE_URL}/terms`} target="_blank" rel="noopener noreferrer" className="text-[#35877D] hover:underline font-bold">
                                            Terms of Service
                                        </a>{" "}
                                        and{" "}
                                        <a href={`${WEBSITE_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="text-[#35877D] hover:underline font-bold">
                                            Privacy Policy
                                        </a>
                                        . By creating an account, I consent to receive updates, verification codes, and support messages from Connectly360.
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-11.5 rounded-xl gap-1.5 shadow-md transition-all mt-3 cursor-pointer text-sm"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* Sign In Link */}
                    <div className="text-center text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#35877D] font-extrabold hover:underline">
                            Sign in
                        </Link>
                    </div>
                </>
            )}
        </Card>
    );
}

export default function RegisterPage() {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 z-10">
            <main className="my-auto w-full max-w-xl py-4 sm:py-6">
                <Suspense fallback={
                    <Card className="w-full bg-white border border-slate-200 shadow-md rounded-3xl p-10 flex flex-col items-center justify-center min-h-[400px]">
                        <Loader2 className="animate-spin text-[#35877D] mb-3" size={32} />
                        <p className="text-sm font-semibold text-slate-500">Loading signup details...</p>
                    </Card>
                }>
                    <RegisterContent />
                </Suspense>
            </main>

            <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>
        </div>
    );
}
