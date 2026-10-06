"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
    status?: string;
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, targetPath?: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const isFirstRender = useRef(true);

    const logout = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
        }
        setToken(null);
        setUser(null);
        setIsLoading(false);
        router.push("/login");
    }, [router]);

    // Primary profile fetch (used on initial reload / mount)
    const fetchProfile = useCallback(async (authToken: string) => {
        try {
            const res = await fetch("/api/auth/profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });
            const data = await res.json();
            if (data.status && data.data) {
                const fetchedUser = data.data;
                if (fetchedUser.status && fetchedUser.status !== "active") {
                    logout();
                    return;
                }

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
                    onboarding_completed: fetchedUser.onboarding_completed,
                    status: fetchedUser.status,
                });
            } else {
                logout();
            }
        } catch {
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    // Silent background auth check (used on route / page navigation)
    const checkAuthInBackground = useCallback(async (authToken: string) => {
        try {
            const res = await fetch("/api/auth/profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });
            const data = await res.json();
            if (data.status && data.data) {
                const fetchedUser = data.data;
                if (fetchedUser.status && fetchedUser.status !== "active") {
                    logout();
                    return;
                }

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
                    onboarding_completed: fetchedUser.onboarding_completed,
                    status: fetchedUser.status,
                });
            } else {
                logout();
            }
        } catch {
            logout();
        }
    }, [logout]);

    // Initial load / browser reload check
    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        localStorage.removeItem("auth_user");

        if (storedToken) {
            setToken(storedToken);
            fetchProfile(storedToken);
        } else {
            setIsLoading(false);
        }
    }, [fetchProfile]);

    // Background auth check on page navigation (route changes)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (token && !isLoading) {
            checkAuthInBackground(token);
        }
    }, [pathname, token, isLoading, checkAuthInBackground]);

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
            pathname.startsWith("/invite") ||
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

    const refreshUser = useCallback(async () => {
        const storedToken = token || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
        if (storedToken) {
            await fetchProfile(storedToken);
        }
    }, [token, fetchProfile]);

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

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated: !!token,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
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
