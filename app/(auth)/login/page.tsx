"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ArrowRight, Users, Zap, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

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
                setError(data.message || "Failed to log in. Please check your credentials.");
            }
        } catch (err) {
            setError("Unable to connect to authentication server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 z-10">
            {/* Top Brand bar (Optional subtle brand indicator on mobile) */}
            <div className="w-full max-w-6xl flex items-center justify-between py-2 lg:hidden">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/images/logo.png" alt="Connectly360" className="h-9 w-auto object-contain" />
                </Link>
            </div>

            {/* Main Centered Auth Container */}
            <main className="my-auto w-full max-w-6xl py-4 sm:py-6">
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">

                    {/* Left Side: Product Highlights & Value Proposition */}
                    <div className="hidden lg:flex lg:col-span-7 flex-col justify-between bg-white border border-[#35877D]/15 p-8 md:p-10 lg:p-12 text-slate-800 rounded-3xl shadow-sm relative min-h-[520px]">
                        <div>
                            {/* Logo */}
                            <div className="mb-8">
                                <img src="/images/logo.png" alt="Connectly360 Logo" className="h-10 w-auto object-contain" />
                            </div>

                            {/* Core Marketing Copy */}
                            <div className="space-y-3 max-w-xl">
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                    Turn WhatsApp Chats Into <span className="text-[#35877D]">Qualified CRM Leads Automatically.</span>
                                </h1>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    Connectly360 natively integrates your entire sales and support pipeline, automating standard inquiries to save your team hours of work.
                                </p>
                            </div>

                            {/* Feature list */}
                            <div className="grid sm:grid-cols-2 gap-3.5 mt-8">
                                <FeatureRow
                                    icon={MessageSquare}
                                    title="WhatsApp Integration"
                                    description="Official Meta WhatsApp API integrations"
                                />
                                <FeatureRow
                                    icon={Bot}
                                    title="AI Chatbot Agent"
                                    description="Smart 24/7 support trained on your data"
                                />
                                <FeatureRow
                                    icon={Users}
                                    title="CRM Pipeline"
                                    description="Organize leads and track directories"
                                />
                                <FeatureRow
                                    icon={Zap}
                                    title="Workflows Engine"
                                    description="No-code visual automation builder"
                                />
                            </div>
                        </div>

                        {/* Trust Badge Strip */}
                        <div className="border-t border-[#35877D]/10 pt-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold text-[#35877D] uppercase tracking-wider">Trusted Meta Partner</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Secure, reliable APIs compliant with WhatsApp policy</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Meta Verified Portal</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Sign In Form */}
                    <div className="lg:col-span-5 flex flex-col justify-center items-center w-full">
                        <Card className="w-full max-w-md bg-white border border-slate-200 shadow-md rounded-3xl overflow-hidden p-6 sm:p-8 lg:p-9 space-y-6">
                            
                            {/* Header inside Form Card for mobile visibility */}
                            <div className="text-center space-y-2">
                                <div className="flex justify-center mb-3 lg:hidden">
                                    <img src="/images/logo.png" alt="Connectly360 Logo" className="h-9 w-auto object-contain" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900">Sign in to Connectly360</h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-semibold">Welcome back! Please sign in to continue.</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 text-xs font-semibold text-center leading-normal">
                                    {error}
                                </div>
                            )}

                            {/* Google SSO Button */}
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full justify-center gap-2 border-slate-250 text-slate-700 font-bold hover:bg-slate-50 h-11 rounded-xl transition-all shadow-2xs cursor-pointer text-xs sm:text-sm"
                                onClick={() => router.push("/dashboard")}
                            >
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                                        <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                                        <path d="M12,21c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.57c-0.9,0.6 -2.07,0.97 -3.3,0.97 -2.34,0 -4.33,-1.58 -5.04,-3.7L2.92,16.3c1.5,2.98 4.6,5 8.2,5z" fill="#34A853" />
                                        <path d="M6.96,13.57C6.78,13.04 6.68,12.48 6.68,11.9c0,-0.58 0.1,-1.14 0.28,-1.67L3.63,7.57C3.01,8.8 2.68,10.2 2.68,11.9c0,1.7 0.33,3.1 0.95,4.33z" fill="#FBBC05" />
                                        <path d="M12,5.27c1.3,0 2.48,0.45 3.4,1.33L17.5,4.5C16.03,3.12 14,2.27 12,2.27c-3.6,0 -6.7,2.02 -8.2,5l3.7,2.83c0.7,-2.12 2.7,-3.7 5.04,-3.7z" fill="#EA4335" />
                                    </g>
                                </svg>
                                Continue with Google
                            </Button>

                            {/* Divider */}
                            <div className="relative flex py-1 items-center">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">or</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            {/* Sign In Form */}
                            <form onSubmit={handleLogin} className="space-y-4">
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

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="password" className="text-xs font-bold text-slate-900">
                                            Password
                                        </label>
                                        <Link href="/forgot-password" className="text-xs font-bold text-[#35877D] hover:text-[#2c6f66] hover:underline cursor-pointer">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        disabled={isLoading}
                                        placeholder="••••••••"
                                        className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-11.5 rounded-xl gap-1.5 cursor-pointer shadow-md transition-all mt-2 text-sm"
                                >
                                    {isLoading ? "Signing In..." : "Sign In"}
                                    {!isLoading && <ArrowRight size={16} />}
                                </Button>
                            </form>

                            {/* Sign Up Link */}
                            <div className="text-center text-xs text-slate-500 font-medium pt-1">
                                Don't have an account?{" "}
                                <Link href="/register" className="text-[#35877D] font-extrabold hover:underline cursor-pointer">
                                    Sign up
                                </Link>
                            </div>
                        </Card>
                    </div>

                </div>
            </main>

            {/* Simple Auth Footer */}
            <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>
        </div>
    );
}

function FeatureRow({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
    return (
        <div className="flex gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100 group">
            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/15 transition-transform group-hover:scale-105">
                <Icon size={16} />
            </div>
            <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal font-medium">{description}</p>
            </div>
        </div>
    );
}
