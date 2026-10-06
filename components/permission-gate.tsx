"use client";

import React from "react";
import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGateProps {
    permission?: string;
    any?: string[];
    all?: string[];
    role?: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function PermissionGate({
    permission,
    any,
    all,
    role,
    fallback = null,
    children,
}: PermissionGateProps) {
    const { can, canAny, canAll, hasRole, isOwner } = usePermissions();

    if (isOwner) {
        return <>{children}</>;
    }

    if (role && !hasRole(role)) {
        return <>{fallback}</>;
    }

    if (permission && !can(permission)) {
        return <>{fallback}</>;
    }

    if (any && any.length > 0 && !canAny(any)) {
        return <>{fallback}</>;
    }

    if (all && all.length > 0 && !canAll(all)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
