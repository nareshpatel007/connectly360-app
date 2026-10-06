"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface PermissionsData {
    workspace_id: number;
    user_id: number;
    role: string;
    role_display: string;
    is_owner: boolean;
    permissions: string[];
}

export function usePermissions() {
    const { token, user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<PermissionsData | null>({
        queryKey: ["auth", "permissions", user?.tenant_id, user?.id],
        queryFn: async () => {
            if (!token) return null;
            try {
                const res = await fetch("/api/auth/permissions", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const json = await res.json();
                if (json.status && json.data) {
                    return json.data;
                }
                return null;
            } catch (err) {
                console.error("Failed to load effective permissions", err);
                return null;
            }
        },
        enabled: !!token,
        staleTime: 60 * 1000, // 1 minute cache
    });

    const isOwner = Boolean(data?.is_owner || user?.role?.toLowerCase() === "owner");
    const role = data?.role || user?.role?.toLowerCase() || null;
    const permissions = data?.permissions || [];

    const can = useCallback(
        (permission: string): boolean => {
            if (!permission) return true;
            if (isOwner) return true; // Owner has full workspace capability
            if (!permissions || permissions.length === 0) return false;

            if (permissions.includes(permission)) return true;

            // Handle workspace.* vs module.* alias format
            if (permission.startsWith("workspace.")) {
                const canonical = permission.substring(10);
                if (permissions.includes(canonical)) return true;
            } else if (!permission.startsWith("admin.")) {
                const alias = `workspace.${permission}`;
                if (permissions.includes(alias)) return true;
            }

            return false;
        },
        [isOwner, permissions]
    );

    const canAny = useCallback(
        (perms: string[]): boolean => {
            if (isOwner) return true;
            return perms.some((p) => can(p));
        },
        [isOwner, can]
    );

    const canAll = useCallback(
        (perms: string[]): boolean => {
            if (isOwner) return true;
            return perms.every((p) => can(p));
        },
        [isOwner, can]
    );

    const hasRole = useCallback(
        (roleName: string): boolean => {
            if (!role) return false;
            return role.toLowerCase() === roleName.toLowerCase();
        },
        [role]
    );

    const invalidatePermissions = useCallback(() => {
        return queryClient.invalidateQueries({
            queryKey: ["auth", "permissions"],
        });
    }, [queryClient]);

    return {
        can,
        canAny,
        canAll,
        hasRole,
        isOwner,
        role,
        roleDisplay: data?.role_display || user?.role || "Member",
        permissions,
        isLoading,
        refreshPermissions: refetch,
        invalidatePermissions,
    };
}
