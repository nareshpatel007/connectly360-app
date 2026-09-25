"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface RegistrationSessionState {
    isLoading: boolean;
    hasPendingRegistration: boolean;
    currentStep: string | null;
    email: string | null;
    status: string | null;
    resendAvailableAt: string | null;
    otpExpiresAt: string | null;
    attempts: number;
    maxAttempts: number;
    resendSeconds: number;
    canResend: boolean;
    error: string | null;
}

export function useRegistrationSession() {
    const [state, setState] = useState<RegistrationSessionState>({
        isLoading: true,
        hasPendingRegistration: false,
        currentStep: null,
        email: null,
        status: null,
        resendAvailableAt: null,
        otpExpiresAt: null,
        attempts: 0,
        maxAttempts: 5,
        resendSeconds: 0,
        canResend: false,
        error: null,
    });

    const isMountedRef = useRef(true);

    const checkSession = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/register/status", {
                method: "GET",
                headers: { "Cache-Control": "no-cache" },
            });
            const data = await res.json();

            if (data.status && data.data) {
                const info = data.data;
                const resendAtStr = info.resend_available_at || null;
                let secondsLeft = 0;

                if (resendAtStr) {
                    const resendAtTime = new Date(resendAtStr).getTime();
                    const nowTime = Date.now();
                    secondsLeft = Math.max(0, Math.ceil((resendAtTime - nowTime) / 1000));
                }

                if (isMountedRef.current) {
                    setState({
                        isLoading: false,
                        hasPendingRegistration: !!info.has_pending_registration,
                        currentStep: info.current_step || null,
                        email: info.email || null,
                        status: info.status || null,
                        resendAvailableAt: resendAtStr,
                        otpExpiresAt: info.otp_expires_at || null,
                        attempts: info.attempts || 0,
                        maxAttempts: info.max_attempts || 5,
                        resendSeconds: secondsLeft,
                        canResend: secondsLeft <= 0,
                        error: info.message || null,
                    });
                }
            } else {
                if (isMountedRef.current) {
                    setState((prev) => ({
                        ...prev,
                        isLoading: false,
                        hasPendingRegistration: false,
                    }));
                }
            }
        } catch {
            if (isMountedRef.current) {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasPendingRegistration: false,
                }));
            }
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        let isCancelled = false;

        fetch("/api/auth/register/status", {
            method: "GET",
            headers: { "Cache-Control": "no-cache" },
        })
            .then((res) => res.json())
            .then((data) => {
                if (isCancelled || !isMountedRef.current) return;
                if (data.status && data.data) {
                    const info = data.data;
                    const resendAtStr = info.resend_available_at || null;
                    let secondsLeft = 0;

                    if (resendAtStr) {
                        const resendAtTime = new Date(resendAtStr).getTime();
                        const nowTime = Date.now();
                        secondsLeft = Math.max(0, Math.ceil((resendAtTime - nowTime) / 1000));
                    }

                    setState({
                        isLoading: false,
                        hasPendingRegistration: !!info.has_pending_registration,
                        currentStep: info.current_step || null,
                        email: info.email || null,
                        status: info.status || null,
                        resendAvailableAt: resendAtStr,
                        otpExpiresAt: info.otp_expires_at || null,
                        attempts: info.attempts || 0,
                        maxAttempts: info.max_attempts || 5,
                        resendSeconds: secondsLeft,
                        canResend: secondsLeft <= 0,
                        error: info.message || null,
                    });
                } else {
                    setState((prev) => ({
                        ...prev,
                        isLoading: false,
                        hasPendingRegistration: false,
                    }));
                }
            })
            .catch(() => {
                if (isCancelled || !isMountedRef.current) return;
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasPendingRegistration: false,
                }));
            });

        return () => {
            isCancelled = true;
            isMountedRef.current = false;
        };
    }, []);

    // Dynamic timer countdown based on resendAvailableAt
    useEffect(() => {
        if (!state.resendAvailableAt) return;

        const updateTimer = () => {
            const resendAtTime = new Date(state.resendAvailableAt!).getTime();
            const nowTime = Date.now();
            const secondsLeft = Math.max(0, Math.ceil((resendAtTime - nowTime) / 1000));

            setState((prev) => ({
                ...prev,
                resendSeconds: secondsLeft,
                canResend: secondsLeft <= 0,
            }));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [state.resendAvailableAt]);

    const resendOtp = async () => {
        const res = await fetch("/api/auth/register/resend-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (data.status) {
            await checkSession();
        }
        return data;
    };

    const verifyOtp = async (code: string) => {
        const res = await fetch("/api/auth/register/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ otp: code }),
        });
        const data = await res.json();
        return data;
    };

    const changeEmail = async () => {
        const res = await fetch("/api/auth/register/change-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (isMountedRef.current) {
            setState({
                isLoading: false,
                hasPendingRegistration: false,
                currentStep: null,
                email: null,
                status: null,
                resendAvailableAt: null,
                otpExpiresAt: null,
                attempts: 0,
                maxAttempts: 5,
                resendSeconds: 0,
                canResend: false,
                error: null,
            });
        }
        return data;
    };

    return {
        ...state,
        checkSession,
        resendOtp,
        verifyOtp,
        changeEmail,
    };
}
