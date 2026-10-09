"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Loader2, Info, Wand2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthSocialButton } from "@/components/auth/AuthSocialButton";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthPasswordInput } from "@/components/auth/AuthPasswordInput";
import { useRegistrationSession } from "@/hooks/useRegistrationSession";
import { notify } from "@/lib/notifications";

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://connectly360.com";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get("invite_token");
    const { isLoading: isSessionLoading, hasPendingRegistration } = useRegistrationSession();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToUpdates, setAgreedToUpdates] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        agreedToTerms?: string;
    }>({});

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isCheckingInvite, setIsCheckingInvite] = useState(false);

    const [inviteDetails, setInviteDetails] = useState<{
        email: string;
        role: string;
        company_name: string;
    } | null>(null);

    // If an active registration challenge is pending in browser session, redirect to /verify-email
    useEffect(() => {
        if (!isSessionLoading && hasPendingRegistration) {
            router.replace("/verify-email");
        }
    }, [isSessionLoading, hasPendingRegistration, router]);

    // Check workspace invite token if provided in URL
    useEffect(() => {
        if (inviteToken) {
            const checkInviteToken = async () => {
                setIsCheckingInvite(true);
                try {
                    const res = await fetch(`/api/workspace/invite/check?token=${inviteToken}`);
                    const data = await res.json();
                    if (data.status && data.data) {
                        setInviteDetails(data.data);
                        setEmail(data.data.email);
                    } else {
                        setError(data.message || "The workspace invitation is invalid or has expired.");
                    }
                } catch {
                    setError("Failed to verify workspace invitation.");
                } finally {
                    setIsCheckingInvite(false);
                }
            };
            checkInviteToken();
        }
    }, [inviteToken]);

    const generateStrongPassword = () => {
        const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const lowercase = "abcdefghijkmnopqrstuvwxyz";
        const numbers = "23456789";
        const symbols = "!@#$%^&*()_+-=";
        const allChars = uppercase + lowercase + numbers + symbols;

        const newPassword = [
            uppercase[Math.floor(Math.random() * uppercase.length)],
            lowercase[Math.floor(Math.random() * lowercase.length)],
            numbers[Math.floor(Math.random() * numbers.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
        ];

        for (let i = 0; i < 12; i++) {
            newPassword.push(allChars[Math.floor(Math.random() * allChars.length)]);
        }

        for (let i = newPassword.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newPassword[i], newPassword[j]] = [newPassword[j], newPassword[i]];
        }

        const generated = newPassword.join("");
        setPassword(generated);
        setShowPassword(true);
        if (fieldErrors.password) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
        }
        notify.info("Generated a strong password", {
            description: "Password has been automatically unmasked for easy copying.",
        });
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

    const validateForm = () => {
        const errors: {
            firstName?: string;
            lastName?: string;
            email?: string;
            password?: string;
            agreedToTerms?: string;
        } = {};

        if (!firstName.trim()) {
            errors.firstName = "First name is required.";
        }

        if (!lastName.trim()) {
            errors.lastName = "Last name is required.";
        }

        if (!email.trim()) {
            errors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.email = "Please enter a valid email address.";
        }

        if (!password) {
            errors.password = "Password is required.";
        } else if (password.length < 8) {
            errors.password = "Password must be at least 8 characters long.";
        }

        if (!agreedToTerms) {
            errors.agreedToTerms = "You must agree to the Terms of Service and Privacy Policy to continue.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    name: `${firstName.trim()} ${lastName.trim()}`,
                    email: email.trim(),
                    password,
                    agreed_to_terms: agreedToTerms,
                    agreed_to_updates: agreedToUpdates,
                    invite_token: inviteToken || undefined,
                }),
            });
            const data = await res.json();
            if (data.status) {
                router.push("/verify-email");
            } else {
                setError(data.message || "Failed to initiate registration.");
            }
        } catch {
            setError("Unable to connect to registration server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4">
            {/* Header: Title & Trial Pill */}
            <div className="space-y-1.5 text-left">
                {inviteDetails ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#35877D]/10 text-[#35877D] text-xs font-medium border border-[#35877D]/20 mb-1 w-full">
                        <Info size={14} className="shrink-0 text-[#35877D]" />
                        <span>
                            Joining workspace: <strong className="text-slate-900">{inviteDetails.company_name}</strong> as{" "}
                            <strong className="text-slate-900">{inviteDetails.role}</strong>
                        </span>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#35877D]/10 text-[#35877D] text-[11px] font-bold border border-[#35877D]/20 mb-0.5">
                        <Sparkles size={11} className="text-[#35877D]" />
                        <span>Start Your Free Trial</span>
                    </div>
                )}
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                    Create your account
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Start your free trial and manage your customer conversations in one place.
                </p>
            </div>

            {isCheckingInvite ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Loader2 className="animate-spin text-[#35877D]" size={24} />
                    <p className="text-xs text-slate-500 font-medium">Verifying invitation details...</p>
                </div>
            ) : (
                <>
                    {/* Error Banner */}
                    {error && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="flex items-start gap-2.5 p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    {/* Continue with Google SSO */}
                    <AuthSocialButton
                        onClick={handleGoogleLogin}
                        isLoading={isGoogleLoading}
                        disabled={isLoading}
                        label="Continue with Google"
                        loadingText="Connecting to Google..."
                    />

                    {/* Divider */}
                    <AuthDivider text="or continue with email" />

                    {/* Registration Form */}
                    <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
                        {/* First Name & Last Name */}
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                            <AuthInput
                                id="firstName"
                                label="First Name"
                                isRequired
                                type="text"
                                disabled={isLoading}
                                placeholder="John"
                                value={firstName}
                                error={fieldErrors.firstName}
                                onChange={(e) => {
                                    setFirstName(e.target.value);
                                    if (fieldErrors.firstName) {
                                        setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
                                    }
                                }}
                            />
                            <AuthInput
                                id="lastName"
                                label="Last Name"
                                isRequired
                                type="text"
                                disabled={isLoading}
                                placeholder="Doe"
                                value={lastName}
                                error={fieldErrors.lastName}
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                    if (fieldErrors.lastName) {
                                        setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
                                    }
                                }}
                            />
                        </div>

                        {/* Email Address */}
                        <AuthInput
                            id="email"
                            label="Email Address"
                            isRequired
                            type="email"
                            autoComplete="email"
                            disabled={isLoading || !!inviteDetails}
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

                        {/* Password with generator & strength meter */}
                        <div className="space-y-1.5">
                            <AuthPasswordInput
                                id="password"
                                label="Password"
                                isRequired
                                autoComplete="new-password"
                                disabled={isLoading}
                                placeholder="Create a secure password"
                                value={password}
                                error={fieldErrors.password}
                                forceShowPassword={showPassword}
                                onToggleShowPassword={(vis) => setShowPassword(vis)}
                                rightLabelAction={
                                    <button
                                        type="button"
                                        onClick={generateStrongPassword}
                                        disabled={isLoading}
                                        className="text-[11px] font-semibold text-[#35877D] hover:text-[#286f66] hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors focus:outline-none"
                                    >
                                        <Wand2 size={12} />
                                        <span>Generate Strong Password</span>
                                    </button>
                                }
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) {
                                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                                    }
                                }}
                            />
                            <PasswordStrengthMeter password={password} />
                        </div>

                        {/* Consent Checkboxes */}
                        <div className="space-y-2.5 pt-1">
                            {/* Required Terms Agreement */}
                            <div className="space-y-1">
                                <div className="flex items-start gap-2.5">
                                    <input
                                        id="agreedToTerms"
                                        type="checkbox"
                                        disabled={isLoading}
                                        checked={agreedToTerms}
                                        onChange={(e) => {
                                            setAgreedToTerms(e.target.checked);
                                            if (fieldErrors.agreedToTerms) {
                                                setFieldErrors((prev) => ({ ...prev, agreedToTerms: undefined }));
                                            }
                                        }}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#35877D] focus:ring-[#35877D] cursor-pointer shrink-0"
                                    />
                                    <label
                                        htmlFor="agreedToTerms"
                                        className="text-[11px] text-slate-600 font-normal leading-snug select-none"
                                    >
                                        I agree to the{" "}
                                        <a
                                            href={`${WEBSITE_URL}/terms`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#35877D] hover:underline font-bold"
                                        >
                                            Terms of Service
                                        </a>{" "}
                                        and{" "}
                                        <a
                                            href={`${WEBSITE_URL}/privacy`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#35877D] hover:underline font-bold"
                                        >
                                            Privacy Policy
                                        </a>
                                        .<span className="text-rose-500 font-bold ml-0.5">*</span>
                                    </label>
                                </div>
                                {fieldErrors.agreedToTerms && (
                                    <p className="text-[11px] font-semibold text-rose-600 pl-6 animate-in fade-in duration-150">
                                        {fieldErrors.agreedToTerms}
                                    </p>
                                )}
                            </div>

                            {/* Optional Marketing Consent (unchecked by default) */}
                            <div className="flex items-start gap-2.5">
                                <input
                                    id="agreedToUpdates"
                                    type="checkbox"
                                    disabled={isLoading}
                                    checked={agreedToUpdates}
                                    onChange={(e) => setAgreedToUpdates(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#35877D] focus:ring-[#35877D] cursor-pointer shrink-0"
                                />
                                <label
                                    htmlFor="agreedToUpdates"
                                    className="text-[11px] text-slate-500 font-normal leading-snug select-none"
                                >
                                    I would like to receive product updates, news, and promotional communications from Connectly360.
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#35877D] hover:bg-[#2b7068] active:scale-[0.99] text-white font-semibold h-10.5 rounded-xl gap-2 shadow-sm shadow-[#35877D]/25 transition-all mt-2 cursor-pointer text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-[#35877D]/40"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin shrink-0" size={16} />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Sign In Link */}
                    <div className="text-center text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-[#35877D] font-bold hover:text-[#286f66] hover:underline cursor-pointer transition-colors"
                        >
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
        <AuthSplitLayout>
            <Suspense
                fallback={
                    <Card className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl p-8 flex flex-col items-center justify-center min-h-[380px] space-y-3">
                        <Loader2 className="animate-spin text-[#35877D]" size={32} />
                        <p className="text-xs font-semibold text-slate-500">Loading registration form...</p>
                    </Card>
                }
            >
                <RegisterContent />
            </Suspense>
        </AuthSplitLayout>
    );
}
