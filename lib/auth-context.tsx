"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: number;
    tenant_id: number | null;
    company_id?: string | null;
    name: string;
    email: string;
    role: string | null;
    plan?: string;
    trial_ends_at?: string | null;
    credits?: number;
    onboarding_completed?: boolean;
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, targetPath?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchProfile = async (authToken: string) => {
        try {
            const res = await fetch("/api/auth/profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });
            const data = await res.json();
            if (data.status) {
                const fetchedUser = data.data;
                setUser({
                    id: fetchedUser.id,
                    tenant_id: fetchedUser.tenant_id,
                    company_id: fetchedUser.company_id,
                    name: fetchedUser.name || `${fetchedUser.first_name || ""} ${fetchedUser.last_name || ""}`.trim() || "User",
                    email: fetchedUser.email,
                    role: fetchedUser.role,
                    plan: fetchedUser.plan,
                    trial_ends_at: fetchedUser.trial_ends_at,
                    credits: fetchedUser.credits,
                    onboarding_completed: fetchedUser.onboarding_completed
                });
            } else {
                logout();
            }
        } catch (err) {
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        localStorage.removeItem("auth_user");

        if (storedToken) {
            setToken(storedToken);
            fetchProfile(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    // Route protection logic
    useEffect(() => {
        if (isLoading) return;

        const isPublicPage =
            pathname === "/" ||
            pathname === "/pricing" ||
            pathname === "/contact" ||
            pathname === "/book-demo" ||
            pathname === "/privacy" ||
            pathname === "/terms" ||
            pathname === "/cookie-policy" ||
            pathname === "/refund-policy" ||
            pathname === "/faq" ||
            pathname === "/login" ||
            pathname === "/register" ||
            pathname === "/forgot-password" ||
            pathname.startsWith("/verify") ||
            pathname.startsWith("/auth/google");

        const isAuthPage =
            pathname === "/login" ||
            pathname === "/register" ||
            pathname === "/forgot-password";

        if (!token && !isPublicPage && pathname !== "/onboarding") {
            router.push("/login");
        } else if (token && isAuthPage) {
            router.push(user?.onboarding_completed ? "/dashboard" : "/onboarding");
        }
    }, [token, user, pathname, isLoading, router]);

    const login = (newToken: string, targetPath?: string) => {
        localStorage.setItem("auth_token", newToken);
        setToken(newToken);
        setIsLoading(true);
        fetchProfile(newToken);
        if (targetPath) {
            router.push(targetPath);
        } else {
            router.push(user?.onboarding_completed ? "/dashboard" : "/onboarding");
        }
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    const isPublicPage =
        pathname === "/" ||
        pathname === "/pricing" ||
        pathname === "/contact" ||
        pathname === "/book-demo" ||
        pathname === "/privacy" ||
        pathname === "/terms" ||
        pathname === "/cookie-policy" ||
        pathname === "/refund-policy" ||
        pathname === "/faq" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname.startsWith("/verify") ||
        pathname.startsWith("/auth/google") ||
        pathname === "/onboarding";

    const showContent = isPublicPage || (token && !isLoading);

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated: !!token,
                isLoading,
                login,
                logout,
            }}
        >
            {showContent ? (
                children
            ) : (
                <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-[#f2f8f7] to-[#e6f2f0]">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/40 backdrop-blur-lg border border-white/30 shadow-xl shadow-[#35877D]/5">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-[#35877D]/20 blur-xl animate-pulse" />
                            <div className="h-12 w-12 rounded-full border-4 border-[#35877D]/25 border-t-[#35877D] animate-spin" />
                            <div className="absolute h-6 w-6 rounded-full border-2 border-transparent border-t-[#35877D] border-b-[#35877D] animate-spin [animation-direction:reverse]" />
                        </div>
                        <p className="text-sm font-bold text-[#35877D] tracking-wide font-sans animate-pulse">
                            Initializing your Workspace
                        </p>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
