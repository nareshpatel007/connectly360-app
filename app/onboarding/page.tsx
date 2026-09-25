"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
    Building2,
    Briefcase,
    Globe,
    Phone,
    Users,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Check,
    Plus,
    Trash2,
    Loader2,
    MessageSquare,
    Target,
    Megaphone,
    Bot,
    Zap,
    BarChart3,
    HelpCircle,
    UserCheck,
    CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INDUSTRIES = [
    "E-commerce & Retail",
    "Real Estate",
    "Education & EdTech",
    "Healthcare & Clinic",
    "Finance & Banking",
    "Travel & Hospitality",
    "Technology & SaaS",
    "Professional Services",
    "Agency / Marketing",
    "Other"
];

const BUSINESS_SIZES = ["Just me", "2–10", "11–50", "51–200", "201–500", "500+"];

const GOALS = [
    { id: "whatsapp", title: "Manage WhatsApp conversations", desc: "Central inbox for customer chats", icon: "💬" },
    { id: "contacts", title: "Manage customer contacts", desc: "Organize contacts & custom attributes", icon: "📇" },
    { id: "leads", title: "Capture and qualify leads", desc: "Track lead stages & pipeline", icon: "🎯" },
    { id: "campaigns", title: "Run WhatsApp campaigns", desc: "Broadcast bulk messages & templates", icon: "📣" },
    { id: "ai", title: "Automate support with AI", desc: "Auto-reply using Knowledge Base", icon: "🤖" },
    { id: "workflows", title: "Build automated workflows", desc: "Trigger automated messaging flows", icon: "⚡" },
    { id: "analytics", title: "Track sales & activity", desc: "Performance & conversion reports", icon: "📊" },
    { id: "support", title: "Manage customer support", desc: "Live chat widget & tickets", icon: "🛟" },
];

const TEAM_SIZES = ["Just me", "2–5", "6–10", "11–25", "26–50", "51+"];

const REFERRAL_SOURCES = [
    "Google Search",
    "Social Media (LinkedIn, Twitter, FB)",
    "YouTube",
    "Friend or Colleague",
    "Partner / Agency",
    "Advertisement",
    "Blog / Article",
    "AI / LLM (ChatGPT, Claude)",
    "Other"
];

export default function OnboardingPage() {
    const router = useRouter();
    const { token, user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Step 2: Workspace Setup (Required)
    const [companyName, setCompanyName] = useState("");

    // Step 3: Business Details (Optional)
    const [industry, setIndustry] = useState("");
    const [businessSize, setBusinessSize] = useState("");
    const [website, setWebsite] = useState("");
    const [phone, setPhone] = useState<string | undefined>("");
    const [referralSource, setReferralSource] = useState("");

    // Step 4: Goals (Optional)
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

    // Step 5: Team Size (Optional)
    const [teamSize, setTeamSize] = useState("");

    // Step 6: Team Invites (Optional)
    const [invites, setInvites] = useState<{ email: string; role: string }[]>([
        { email: "", role: "member" }
    ]);

    const steps = [
        { id: "workspace", title: "Workspace" },
        { id: "business", title: "Business Details" },
        { id: "goals", title: "Goals" },
        { id: "team-size", title: "Team Size" },
        { id: "invite", title: "Invite Team" },
        { id: "complete", title: "All Set" },
    ];

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
            return;
        }

        if (token) {
            const fetchOnboardingStatus = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch("/api/onboarding/status", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (data.status) {
                        if (data.completed) {
                            router.push("/dashboard");
                            return;
                        }
                        if (data.workspace?.company_name) {
                            setCompanyName(data.workspace.company_name);
                        } else if (user?.name) {
                            setCompanyName(`${user.name}'s Workspace`);
                        }
                        if (data.onboarding) {
                            if (data.onboarding.industry) setIndustry(data.onboarding.industry);
                            if (data.onboarding.business_size) setBusinessSize(data.onboarding.business_size);
                            if (data.onboarding.website) setWebsite(data.onboarding.website);
                            if (data.onboarding.phone) setPhone(data.onboarding.phone);
                            if (data.onboarding.use_cases) setSelectedGoals(data.onboarding.use_cases);
                            if (data.onboarding.team_size) setTeamSize(data.onboarding.team_size);
                            if (data.onboarding.referral_source) setReferralSource(data.onboarding.referral_source);

                            // Restore current step if returning
                            const stepMap: Record<string, number> = {
                                workspace: 0,
                                business: 1,
                                goals: 2,
                                "team-size": 3,
                                invite: 4,
                                complete: 5
                            };
                            if (data.onboarding.current_step && stepMap[data.onboarding.current_step] !== undefined) {
                                setCurrentStepIndex(stepMap[data.onboarding.current_step]);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch onboarding status", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchOnboardingStatus();
        }
    }, [token, isAuthenticated, authLoading, router, user]);

    const saveStepData = async (stepName: string, extraData: Record<string, any> = {}) => {
        if (!token) return;
        setIsSaving(true);
        try {
            await fetch("/api/onboarding/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    step: stepName,
                    company_name: companyName,
                    industry,
                    business_size: businessSize,
                    website,
                    phone: phone || null,
                    use_cases: selectedGoals,
                    team_size: teamSize,
                    referral_source: referralSource,
                    ...extraData
                })
            });
        } catch (err) {
            console.error("Error saving onboarding step", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = async () => {
        const currentStep = steps[currentStepIndex].id;
        await saveStepData(steps[Math.min(currentStepIndex + 1, steps.length - 1)].id);
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        }
    };

    const handleSkip = async () => {
        await saveStepData(steps[Math.min(currentStepIndex + 1, steps.length - 1)].id);
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const toggleGoal = (id: string) => {
        setSelectedGoals((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    const handleAddInvite = () => {
        setInvites((prev) => [...prev, { email: "", role: "member" }]);
    };

    const handleRemoveInvite = (index: number) => {
        setInvites((prev) => prev.filter((_, i) => i !== index));
    };

    const handleInviteChange = (index: number, field: "email" | "role", value: string) => {
        setInvites((prev) => {
            const next = [...prev];
            next[index][field] = value;
            return next;
        });
    };

    const handleSendInvites = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const validInvites = invites.filter((inv) => inv.email.trim() !== "");
            for (const inv of validInvites) {
                await fetch("/api/workspace/invite", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ email: inv.email, role: inv.role })
                });
            }
        } catch (err) {
            console.error("Failed to send invitations", err);
        } finally {
            setIsSaving(false);
            handleNext();
        }
    };

    const handleFinishOnboarding = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            router.push("/dashboard");
        } catch (err) {
            console.error("Failed to complete onboarding", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="animate-spin text-[#35877D]" />
                    <p className="text-sm font-semibold text-slate-600">Setting up your onboarding workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-emerald-50/30 flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8">
            {/* Header / Logo & Progress */}
            <header className="w-full max-w-2xl pt-2 sm:pt-4 text-center space-y-4">
                <div className="flex justify-center">
                    <img src="/images/logo.png" alt="Connectly360 Logo" className="h-10 w-auto object-contain" />
                </div>

                {/* Modern Step Indicator */}
                <div className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                    <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500 mb-2">
                        <span>Step {currentStepIndex + 1} of {steps.length}</span>
                        <span className="text-[#35877D]">{steps[currentStepIndex].title}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
                        {steps.map((s, idx) => (
                            <div
                                key={s.id}
                                className={`h-full rounded-full transition-all duration-300 flex-1 ${
                                    idx <= currentStepIndex ? "bg-[#35877D]" : "bg-slate-200"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Step Content Card */}
            <main className="my-auto w-full max-w-2xl py-6">
                <Card className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-3xl p-6 sm:p-10 space-y-6">

                    {/* STEP 2: WORKSPACE SETUP (REQUIRED) */}
                    {currentStepIndex === 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-2">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20">
                                    <Building2 size={30} />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Set up your workspace</h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Tell us a little about your business so we can personalize Connectly360.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-800">
                                        Workspace / Company Name <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="e.g. Acme Technologies"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="h-12 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                    />
                                    <p className="text-xs text-slate-400 font-medium">This name will be displayed across your Connectly360 dashboard and team accounts.</p>
                                </div>

                                {/* Preview Card */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border border-emerald-100/80 space-y-1">
                                    <div className="text-[11px] uppercase tracking-wider font-extrabold text-[#35877D]">Workspace Preview</div>
                                    <div className="text-base font-black text-slate-900">{companyName || "Your Company Workspace"}</div>
                                    <div className="text-xs text-slate-500 font-medium">Free Trial • 500 Credits Included</div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    onClick={handleNext}
                                    disabled={!companyName.trim() || isSaving}
                                    className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-12 rounded-xl gap-2 shadow-md transition-all cursor-pointer text-sm"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                                    Continue
                                    <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: BUSINESS DETAILS (OPTIONAL - SKIPPABLE) */}
                    {currentStepIndex === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-2">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20">
                                    <Briefcase size={30} />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Tell us about your business</h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Help us personalize your Connectly360 experience. All fields are optional.</p>
                            </div>

                            <div className="space-y-4">
                                {/* Industry Select */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-800">Industry</label>
                                    <select
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="h-11 w-full border border-slate-200 focus:ring-[#35877D] focus:border-[#35877D] focus:outline-none rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900"
                                    >
                                        <option value="">Select industry</option>
                                        {INDUSTRIES.map((ind) => (
                                            <option key={ind} value={ind}>{ind}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Business Size Select */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-800">Company Size</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {BUSINESS_SIZES.map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setBusinessSize(size)}
                                                className={`h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                    businessSize === size
                                                        ? "bg-[#35877D] text-white border-[#35877D] shadow-xs"
                                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Website & Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-800">Company Website</label>
                                        <Input
                                            type="url"
                                            placeholder="https://company.com"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5 custom-phone-input">
                                        <label className="text-xs font-bold text-slate-800">Business Phone Number</label>
                                        <PhoneInput
                                            international
                                            withCountryCallingCode
                                            placeholder="98765 43210"
                                            value={phone}
                                            onChange={setPhone}
                                            defaultCountry="IN"
                                            numberInputProps={{
                                                className: "h-11 w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#35877D] focus:border-[#35877D] rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900"
                                            }}
                                            className="flex gap-2 items-center"
                                        />
                                    </div>
                                </div>

                                {/* Referral Source */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-800">How did you hear about Connectly360?</label>
                                    <select
                                        value={referralSource}
                                        onChange={(e) => setReferralSource(e.target.value)}
                                        className="h-11 w-full border border-slate-200 focus:ring-[#35877D] focus:border-[#35877D] focus:outline-none rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900"
                                    >
                                        <option value="">Select option</option>
                                        {REFERRAL_SOURCES.map((src) => (
                                            <option key={src} value={src}>{src}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Nav Action Buttons */}
                            <div className="flex items-center justify-between pt-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="h-11 rounded-xl font-bold px-4 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleSkip}
                                        className="h-11 rounded-xl font-bold px-4 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer text-xs"
                                    >
                                        Skip for now
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={isSaving}
                                        className="h-11 bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold rounded-xl px-5 gap-1.5 shadow-md transition-all cursor-pointer text-sm"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                                        Continue
                                        <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: GOALS / ACCOMPLISHMENTS (OPTIONAL - SKIPPABLE) */}
                    {currentStepIndex === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-2">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20">
                                    <Sparkles size={30} />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">What are you hoping to accomplish?</h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Choose everything that applies to customize your workspace dashboard.</p>
                            </div>

                            {/* Goals Card Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {GOALS.map((goal) => {
                                    const isSelected = selectedGoals.includes(goal.id);
                                    return (
                                        <div
                                            key={goal.id}
                                            onClick={() => toggleGoal(goal.id)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                                isSelected
                                                    ? "bg-emerald-50/50 border-[#35877D] ring-2 ring-[#35877D]/20 shadow-xs"
                                                    : "bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                                            }`}
                                        >
                                            <span className="text-2xl shrink-0">{goal.icon}</span>
                                            <div className="space-y-0.5 flex-1">
                                                <div className="text-xs font-bold text-slate-900">{goal.title}</div>
                                                <div className="text-[11px] font-medium text-slate-500">{goal.desc}</div>
                                            </div>
                                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected ? "bg-[#35877D] text-white" : "border border-slate-300 bg-white"
                                            }`}>
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Nav Action Buttons */}
                            <div className="flex items-center justify-between pt-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="h-11 rounded-xl font-bold px-4 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleSkip}
                                        className="h-11 rounded-xl font-bold px-4 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer text-xs"
                                    >
                                        Skip for now
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={isSaving}
                                        className="h-11 bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold rounded-xl px-5 gap-1.5 shadow-md transition-all cursor-pointer text-sm"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                                        Continue
                                        <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: TEAM SIZE (OPTIONAL - SKIPPABLE) */}
                    {currentStepIndex === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-2">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20">
                                    <Users size={30} />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">How large is your team?</h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">This helps us recommend the best workspace workflow and seat configurations.</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TEAM_SIZES.map((size) => (
                                    <div
                                        key={size}
                                        onClick={() => setTeamSize(size)}
                                        className={`p-4 rounded-2xl border text-center transition-all cursor-pointer select-none space-y-1 ${
                                            teamSize === size
                                                ? "bg-emerald-50/50 border-[#35877D] ring-2 ring-[#35877D]/20 shadow-xs"
                                                : "bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                                        }`}
                                    >
                                        <div className="text-lg font-black text-slate-900">{size}</div>
                                        <div className="text-xs font-medium text-slate-500">
                                            {size === "Just me" ? "Solo Operator" : "Team Members"}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Nav Action Buttons */}
                            <div className="flex items-center justify-between pt-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="h-11 rounded-xl font-bold px-4 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleSkip}
                                        className="h-11 rounded-xl font-bold px-4 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer text-xs"
                                    >
                                        Skip for now
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={isSaving}
                                        className="h-11 bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold rounded-xl px-5 gap-1.5 shadow-md transition-all cursor-pointer text-sm"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                                        Continue
                                        <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: INVITE TEAM (OPTIONAL - SKIPPABLE) */}
                    {currentStepIndex === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-2">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20">
                                    <UserCheck size={30} />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Invite your team</h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Bring your teammates into Connectly360 to manage customer chats together.</p>
                            </div>

                            <div className="space-y-3">
                                {invites.map((inv, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            type="email"
                                            placeholder="teammate@company.com"
                                            value={inv.email}
                                            onChange={(e) => handleInviteChange(idx, "email", e.target.value)}
                                            className="h-11 border-slate-200 focus-visible:ring-[#35877D] focus-visible:border-[#35877D] rounded-xl bg-slate-50 font-medium text-slate-900 text-sm flex-1"
                                        />
                                        <select
                                            value={inv.role}
                                            onChange={(e) => handleInviteChange(idx, "role", e.target.value)}
                                            className="h-11 border border-slate-200 focus:ring-[#35877D] focus:border-[#35877D] focus:outline-none rounded-xl bg-slate-50 font-medium px-3 text-xs text-slate-900"
                                        >
                                            <option value="member">Member</option>
                                            <option value="agent">Agent</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {invites.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveInvite(idx)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddInvite}
                                    className="w-full h-10 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs gap-1.5 cursor-pointer mt-1"
                                >
                                    <Plus size={16} />
                                    Add Another Teammate
                                </Button>
                            </div>

                            {/* Nav Action Buttons */}
                            <div className="flex items-center justify-between pt-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="h-11 rounded-xl font-bold px-4 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleSkip}
                                        className="h-11 rounded-xl font-bold px-4 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer text-xs"
                                    >
                                        Skip for now
                                    </Button>
                                    <Button
                                        onClick={handleSendInvites}
                                        disabled={isSaving}
                                        className="h-11 bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold rounded-xl px-5 gap-1.5 shadow-md transition-all cursor-pointer text-sm"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                                        Send Invitations & Continue
                                        <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 7: COMPLETION SCREEN */}
                    {currentStepIndex === 5 && (
                        <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300 py-2">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                                <CheckCircle2 size={36} />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">You're all set! 🎉</h2>
                                <p className="text-sm text-slate-500 font-medium">Your Connectly360 workspace is ready. Let's start connecting customer conversations.</p>
                            </div>

                            {/* Summary Card */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 max-w-md mx-auto">
                                <div className="text-xs uppercase tracking-wider font-extrabold text-[#35877D]">Workspace Summary</div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-400 font-medium block">Workspace</span>
                                        <strong className="text-slate-900 font-bold text-sm">{companyName || "Workspace"}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium block">Account</span>
                                        <strong className="text-slate-900 font-bold text-sm truncate block">{user?.email}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium block">Plan</span>
                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md mt-0.5">
                                            Free Trial
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium block">Included Credits</span>
                                        <strong className="text-slate-900 font-bold text-sm">500 Credits</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    onClick={handleFinishOnboarding}
                                    disabled={isLoading}
                                    className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-bold h-12 rounded-xl gap-2 shadow-lg shadow-[#35877D]/20 transition-all cursor-pointer text-base"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                    Go to Dashboard
                                    <ArrowRight size={18} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </main>

            {/* Footer */}
            <footer className="w-full text-center py-2 text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} Connectly360. All rights reserved.
            </footer>
        </div>
    );
}
