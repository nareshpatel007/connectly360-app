"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, Loader2, Info } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://connectly360.com";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get("invite_token");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>("");
    const [referralSource, setReferralSource] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingInvite, setIsCheckingInvite] = useState(false);
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
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`.trim(),
                    email,
                    password,
                    phone: phoneNumber,
                    referral_source: referralSource || "Workspace Invite",
                    invite_token: inviteToken || undefined
                }),
            });
            const data = await res.json();
            if (data.status) {
                setSuccess(true);
            } else {
                setError(data.message || "Failed to create account.");
            }
        } catch (err) {
            setError("Unable to connect to registration server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full bg-white border border-slate-200 shadow-md rounded-3xl overflow-hidden p-6 sm:p-9 space-y-6">
            {success ? (
                <div className="text-center space-y-6 py-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#35877D] border border-emerald-100 shadow-xs">
                        <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Verify Your Email</h2>
                        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto font-normal">
                            We've sent an email verification link to <strong className="text-slate-800 font-medium">{email}</strong>. Please check your inbox and follow the instructions to verify your account and join the workspace.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Button
                            onClick={() => router.push("/login")}
                            className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-11.5 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                            Go to Sign In
                        </Button>
                    </div>
                </div>
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
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">Get started with Connectly360 today.</p>
                    </div>

                    {isCheckingInvite ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                            <Loader2 className="animate-spin text-[#35877D]" size={24} />
                            <p className="text-xs text-slate-500 font-medium">Verifying invitation details...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 text-xs font-semibold text-center">
                                    {error}
                                </div>
                            )}

                            {/* Registration Form */}
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* First & Last Name row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="firstName" className="text-xs font-bold text-slate-800">
                                            First Name
                                        </label>
                                        <Input
                                            id="firstName"
                                            type="text"
                                            required
                                            disabled={isLoading || success}
                                            placeholder="John"
                                            className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="lastName" className="text-xs font-bold text-slate-800">
                                            Last Name
                                        </label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            required
                                            disabled={isLoading || success}
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
                                        Email Address
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        disabled={isLoading || success || !!inviteDetails}
                                        placeholder="name@company.com"
                                        className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label htmlFor="password" className="text-xs font-bold text-slate-800">
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        disabled={isLoading || success}
                                        placeholder="Create a secure password"
                                        className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                {/* Phone Number with react-phone-number-input */}
                                <div className="space-y-1.5 custom-phone-input">
                                    <label htmlFor="phoneNumber" className="text-xs font-bold text-slate-800">
                                        Phone Number
                                    </label>
                                    <PhoneInput
                                        international
                                        withCountryCallingCode
                                        placeholder="98765 43210"
                                        value={phoneNumber}
                                        onChange={setPhoneNumber}
                                        defaultCountry="IN"
                                        disabled={isLoading || success}
                                        required
                                        numberInputProps={{
                                            className: "h-11 w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#35877D] focus:border-[#35877D] rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900 transition-all"
                                        }}
                                        className="flex gap-2 items-center"
                                    />
                                </div>

                                {/* Referral Info (Only shown for non-invites) */}
                                {!inviteDetails && (
                                    <div className="space-y-1.5">
                                        <label htmlFor="referral" className="text-xs font-bold text-slate-800">
                                            How did you hear about Connectly360?
                                        </label>
                                        <select
                                            id="referral"
                                            required
                                            disabled={isLoading || success}
                                            value={referralSource}
                                            onChange={(e) => setReferralSource(e.target.value)}
                                            className="h-11 w-full border border-slate-200 focus:ring-[#35877D] focus:border-[#35877D] focus:outline-none rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900"
                                        >
                                            <option value="" disabled>Select an option</option>
                                            <option value="Google Search">Google Search</option>
                                            <option value="Social Media">Social Media (LinkedIn, Twitter, Facebook)</option>
                                            <option value="YouTube">YouTube</option>
                                            <option value="Meta Partner Directory">Meta Partner Directory</option>
                                            <option value="Word of Mouth">Word of Mouth / Colleague Recommendation</option>
                                            <option value="LLM (ChatGPT, Claude, Perplexity)">LLM (ChatGPT, Claude, Perplexity)</option>
                                            <option value="Connectly360 Blog">Connectly360 Blog</option>
                                            <option value="Newsletter">Newsletter</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}

                                {/* Checkbox agreement */}
                                <div className="flex items-start gap-2.5 pt-1">
                                    <input
                                        id="agreedToTerms"
                                        type="checkbox"
                                        disabled={isLoading || success}
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-1.5 h-4 w-4 rounded border-slate-300 text-[#35877D] focus:ring-[#35877D]"
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
                                    {isLoading ? "Creating Account..." : success ? "Account Created!" : "Create Account"}
                                    {!isLoading && !success && <ArrowRight size={16} />}
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

            {/* Simple Auth Footer */}
            <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>

            {/* Custom Styles for react-phone-number-input flag styling */}
            <style jsx global>{`
                .custom-phone-input .PhoneInputCountry {
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 0 0.75rem;
                    height: 2.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .custom-phone-input .PhoneInputCountry:hover {
                    border-color: #cbd5e1;
                }
                .custom-phone-input .PhoneInputCountrySelectArrow {
                    margin-left: 0.35rem;
                    color: #64748b;
                }
                .custom-phone-input .PhoneInputCountryIcon--border {
                    background-color: transparent;
                    box-shadow: none;
                }
            `}</style>
        </div>
    );
}
