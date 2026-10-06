"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Shield, Building2, UserCheck, AlertCircle, Clock, CheckCircle2, Loader2, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

interface InviteData {
    id: number;
    email: string;
    role: string;
    role_display: string;
    company_name: string;
    inviter_name: string;
    expires_at: string;
}

export default function InviteAcceptPage() {
    const params = useParams();
    const router = useRouter();
    const { token: authToken, user, refreshUser } = useAuth();
    const rawToken = params?.token as string;

    const [isLoading, setIsLoading] = useState(true);
    const [inviteData, setInviteData] = useState<InviteData | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        if (!rawToken) return;

        const checkInvite = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/invitations/${rawToken}`);
                const data = await res.json();

                if (data.status && data.data) {
                    setInviteData(data.data);
                } else {
                    setErrorCode(data.error?.code || "INVALID");
                    setErrorMessage(data.error?.message || "This invitation link is invalid or has expired.");
                }
            } catch (err) {
                setErrorCode("NETWORK_ERROR");
                setErrorMessage("Failed to check invitation status. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        checkInvite();
    }, [rawToken]);

    const handleAccept = async () => {
        if (!authToken) {
            router.push(`/login?redirect=/invite/${rawToken}`);
            return;
        }

        setIsAccepting(true);
        try {
            const res = await fetch(`/api/invitations/${rawToken}/accept`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await res.json();
            if (data.status) {
                toast.success("Welcome to " + (inviteData?.company_name || "the workspace") + "!");
                await refreshUser();
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);
            } else {
                toast.error(data.message || "Failed to accept invitation.");
            }
        } catch (err) {
            toast.error("Network error while accepting invitation.");
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
                <Loader2 className="animate-spin text-[#378179] h-10 w-10 mb-4" />
                <p className="text-sm font-semibold text-slate-600">Checking your invitation details...</p>
            </div>
        );
    }

    if (errorCode || !inviteData) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full border border-slate-200 bg-white rounded-3xl shadow-sm overflow-hidden p-6 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                        <AlertCircle size={28} />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Invitation Unavailable</CardTitle>
                    <CardDescription className="text-slate-500 text-sm mt-2 leading-relaxed">
                        {errorMessage || "This invitation link is invalid or may have already been accepted or cancelled."}
                    </CardDescription>

                    <div className="mt-6 flex flex-col gap-2">
                        <Button
                            asChild
                            className="w-full bg-[#378179] hover:bg-[#2c6f66] text-white rounded-xl h-11 font-semibold"
                        >
                            <Link href="/login">Return to Login</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
            {/* Header Brand */}
            <div className="mb-6 flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-[#378179] text-white flex items-center justify-center font-black text-lg shadow-sm">
                    C
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Connectly360</span>
            </div>

            <Card className="max-w-md w-full border border-slate-200 bg-white rounded-3xl shadow-md overflow-hidden">
                <CardHeader className="text-center pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                    <div className="h-14 w-14 rounded-2xl bg-teal-50 text-[#378179] flex items-center justify-center mx-auto mb-3 border border-teal-100">
                        <Building2 size={28} />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                        Join {inviteData.company_name}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs mt-1">
                        You have been invited by <strong className="text-slate-800 font-semibold">{inviteData.inviter_name}</strong>
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Assigned Role:</span>
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[#378179]/10 text-[#378179] border border-[#378179]/20">
                                {inviteData.role_display}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Invited Email:</span>
                            <span className="font-semibold text-slate-800">{inviteData.email}</span>
                        </div>
                        {inviteData.expires_at && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">Expires:</span>
                                <span className="text-slate-600 font-medium flex items-center gap-1">
                                    <Clock size={12} className="text-slate-400" />
                                    {new Date(inviteData.expires_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>

                    {authToken && user ? (
                        <div className="text-center text-xs text-slate-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/80">
                            Logged in as <strong className="font-semibold text-emerald-900">{user.email}</strong>. Accepting will link your account to this workspace.
                        </div>
                    ) : (
                        <div className="text-center text-xs text-slate-500">
                            Please log in or create your account to accept this invitation.
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-6 pt-0 flex flex-col gap-2.5">
                    {authToken ? (
                        <Button
                            onClick={handleAccept}
                            disabled={isAccepting}
                            className="w-full bg-[#378179] hover:bg-[#2c6f66] text-white rounded-xl h-11 font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isAccepting ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Accepting & Joining...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Accept Invitation & Join
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <Button
                                asChild
                                className="w-full bg-[#378179] hover:bg-[#2c6f66] text-white rounded-xl h-11 font-bold shadow-sm flex items-center justify-center gap-2"
                            >
                                <Link href={`/login?redirect=/invite/${rawToken}`}>
                                    <LogIn size={16} />
                                    Log In to Accept
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-11 font-semibold flex items-center justify-center gap-2"
                            >
                                <Link href={`/register?invite_token=${rawToken}`}>
                                    <UserPlus size={16} />
                                    Create New Account
                                </Link>
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
