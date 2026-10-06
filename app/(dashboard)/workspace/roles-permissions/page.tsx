"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Shield,
    CheckCircle2,
    Plus,
    Copy,
    Edit3,
    Trash2,
    Users,
    Lock,
    Search,
    Loader2,
    AlertTriangle,
    Eye,
    Check,
    Save,
    ChevronDown,
    ChevronUp,
    Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RoleItem {
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_system: boolean;
    scope: string;
    tenant_id: number | null;
    members_count: number;
    permissions_count: number;
    permissions: string[];
    capabilities: string[];
}

interface PermissionDef {
    key: string;
    label: string;
    description: string;
}

interface ModuleDef {
    module_key: string;
    module_title: string;
    description: string;
    permissions: PermissionDef[];
}

export default function RolesPermissionsPage() {
    const { token, user } = useAuth();
    const { can, isOwner, invalidatePermissions } = usePermissions();

    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [modules, setModules] = useState<ModuleDef[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "system" | "custom">("all");

    // Create Role Modal
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createDesc, setCreateDesc] = useState("");
    const [createPerms, setCreatePerms] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Permission Matrix Drawer / Modal (View or Edit)
    const [matrixOpen, setMatrixOpen] = useState(false);
    const [activeRole, setActiveRole] = useState<RoleItem | null>(null);
    const [isEditingMatrix, setIsEditingMatrix] = useState(false);
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [isSavingMatrix, setIsSavingMatrix] = useState(false);
    const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

    // Delete Role Modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);
    const [reassignTargetId, setReassignTargetId] = useState<string>("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Duplicate Role Modal
    const [duplicateOpen, setDuplicateOpen] = useState(false);
    const [roleToDuplicate, setRoleToDuplicate] = useState<RoleItem | null>(null);
    const [duplicateName, setDuplicateName] = useState("");
    const [isDuplicating, setIsDuplicating] = useState(false);

    const canCreateRole = isOwner || can("workspace.roles.create");
    const canUpdateRole = isOwner || can("workspace.roles.update");
    const canDeleteRole = isOwner || can("workspace.roles.delete");

    const fetchRoles = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/workspace/roles", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status && json.data) {
                setRoles(json.data);
            }
        } catch (err) {
            console.error("Failed to fetch roles", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPermissionsCatalog = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/workspace/permissions", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status && json.data) {
                setModules(json.data);
            }
        } catch (err) {
            console.error("Failed to load permissions catalog", err);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchPermissionsCatalog();
    }, [token]);

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createName) {
            toast.error("Role name is required");
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch("/api/workspace/roles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: createName,
                    display_name: createName,
                    description: createDesc || "Custom workspace access role.",
                    permissions: createPerms,
                }),
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Role '${createName}' created successfully.`);
                setCreateOpen(false);
                setCreateName("");
                setCreateDesc("");
                setCreatePerms([]);
                fetchRoles();
            } else {
                toast.error(data.message || "Failed to create role.");
            }
        } catch (err) {
            toast.error("Network error while creating role.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenMatrix = (role: RoleItem, editable: boolean) => {
        setActiveRole(role);
        setIsEditingMatrix(editable);
        setSelectedPerms([...(role.permissions || [])]);
        setMatrixOpen(true);
    };

    const handleSaveMatrix = async () => {
        if (!activeRole || !token) return;
        setIsSavingMatrix(true);
        try {
            const res = await fetch(`/api/workspace/roles/${activeRole.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    permissions: selectedPerms,
                }),
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Permissions for '${activeRole.display_name}' saved successfully.`);
                setMatrixOpen(false);
                fetchRoles();
                invalidatePermissions();
            } else {
                toast.error(data.message || "Failed to update permissions.");
            }
        } catch (err) {
            toast.error("Error saving permissions.");
        } finally {
            setIsSavingMatrix(false);
        }
    };

    const handleDuplicateRole = async () => {
        if (!roleToDuplicate || !duplicateName || !token) return;
        setIsDuplicating(true);
        try {
            const res = await fetch(`/api/workspace/roles/${roleToDuplicate.id}/duplicate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    display_name: duplicateName,
                    name: duplicateName,
                }),
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Role duplicated as '${duplicateName}'.`);
                setDuplicateOpen(false);
                setRoleToDuplicate(null);
                setDuplicateName("");
                fetchRoles();
            } else {
                toast.error(data.message || "Failed to duplicate role.");
            }
        } catch (err) {
            toast.error("Failed to duplicate role.");
        } finally {
            setIsDuplicating(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete || !token) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/workspace/roles/${roleToDelete.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reassign_to: reassignTargetId ? parseInt(reassignTargetId) : null,
                }),
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Role '${roleToDelete.display_name}' deleted successfully.`);
                setDeleteOpen(false);
                setRoleToDelete(null);
                setReassignTargetId("");
                fetchRoles();
            } else {
                toast.error(data.message || "Failed to delete role.");
            }
        } catch (err) {
            toast.error("Failed to delete role.");
        } finally {
            setIsDeleting(false);
        }
    };

    const togglePermission = (key: string) => {
        if (!isEditingMatrix) return;
        setSelectedPerms((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const toggleModuleAll = (mod: ModuleDef) => {
        if (!isEditingMatrix) return;
        const allKeys = mod.permissions.map((p) => p.key);
        const hasAll = allKeys.every((k) => selectedPerms.includes(k));

        if (hasAll) {
            setSelectedPerms((prev) => prev.filter((k) => !allKeys.includes(k)));
        } else {
            setSelectedPerms((prev) => Array.from(new Set([...prev, ...allKeys])));
        }
    };

    const toggleCollapse = (modKey: string) => {
        setCollapsedModules((prev) => ({
            ...prev,
            [modKey]: !prev[modKey],
        }));
    };

    const filteredRoles = useMemo(() => {
        return roles.filter((r) => {
            const matchesSearch =
                r.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;
            if (roleFilter === "system") return r.is_system;
            if (roleFilter === "custom") return !r.is_system;
            return true;
        });
    }, [roles, searchTerm, roleFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    icon={Shield}
                    title="Roles & Permissions"
                    description="Configure access levels and role-based permissions across your workspace."
                />

                {canCreateRole && (
                    <Button
                        onClick={() => {
                            setCreateName("");
                            setCreateDesc("");
                            setCreatePerms([]);
                            setCreateOpen(true);
                        }}
                        className="bg-[#378179] hover:bg-[#2c6761] text-white text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 border-0 font-bold shadow-xs cursor-pointer self-start sm:self-center"
                    >
                        <Plus size={16} />
                        Create Role
                    </Button>
                )}
            </div>

            {/* Controls Bar: Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-xs">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
                    <button
                        onClick={() => setRoleFilter("all")}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${roleFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
                    >
                        All Roles ({roles.length})
                    </button>
                    <button
                        onClick={() => setRoleFilter("system")}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${roleFilter === "system" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
                    >
                        System Roles
                    </button>
                    <button
                        onClick={() => setRoleFilter("custom")}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${roleFilter === "custom" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
                    >
                        Custom Roles
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search roles..."
                        className="pl-9 h-9 text-xs text-slate-600 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Dynamic Role Cards Grid - EXACT MATCH to visual baseline */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-[#EAE6DF]">
                    <Loader2 className="animate-spin text-[#378179]" size={36} />
                    <p className="text-sm font-semibold text-slate-500">Loading workspace roles and permissions...</p>
                </div>
            ) : filteredRoles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#EAE6DF] p-12 text-center">
                    <Shield size={32} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No roles found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {roleFilter === "custom"
                            ? "No custom workspace roles created yet. Click '+ Create Role' to build your first tailored role."
                            : "No roles match your search filter."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRoles.map((role) => {
                        const isOwnerRole = role.name === "owner";

                        return (
                            <Card
                                key={role.id}
                                className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all"
                            >
                                <CardHeader className="border-b border-slate-100 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                    isOwnerRole
                                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                        : role.name === "admin"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                        : role.name === "manager"
                                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                        : "bg-teal-50 text-teal-700 border border-teal-200"
                                                }`}
                                            >
                                                {role.display_name}
                                            </span>

                                            {role.is_system ? (
                                                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    SYSTEM
                                                </span>
                                            ) : (
                                                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    CUSTOM
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} />
                                                {role.members_count}
                                            </span>
                                            <span>•</span>
                                            <span>{role.permissions_count} perms</span>
                                        </div>
                                    </div>

                                    <CardDescription className="text-slate-500 text-xs mt-2.5 leading-relaxed min-h-[36px]">
                                        {role.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-5 flex-1 bg-slate-50/30">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                                        Allowed Capabilities
                                    </p>
                                    <ul className="space-y-2.5">
                                        {role.capabilities && role.capabilities.length > 0 ? (
                                            role.capabilities.slice(0, 4).map((cap, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                                    <CheckCircle2 size={15} className="text-[#378179] shrink-0 mt-0.5" />
                                                    <span className="line-clamp-1">{cap}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-xs text-slate-400 italic">No explicit capabilities assigned</li>
                                        )}
                                    </ul>
                                </CardContent>

                                <CardFooter className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenMatrix(role, !role.is_system && canUpdateRole)}
                                        className="h-8 text-xs font-semibold rounded-xl text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Eye size={13} />
                                        <span>{!role.is_system && canUpdateRole ? "Edit Permissions" : "View Permissions"}</span>
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {/* Duplicate Role Button */}
                                        {canCreateRole && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setRoleToDuplicate(role);
                                                    setDuplicateName(`${role.display_name} (Copy)`);
                                                    setDuplicateOpen(true);
                                                }}
                                                className="h-8 w-8 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                                                title="Duplicate Role"
                                            >
                                                <Copy size={13} />
                                            </Button>
                                        )}

                                        {/* Delete Custom Role Button */}
                                        {!role.is_system && canDeleteRole && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setRoleToDelete(role);
                                                    setDeleteOpen(true);
                                                }}
                                                className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                title="Delete Custom Role"
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* PERMISSION MATRIX MODAL / DRAWER */}
            <Dialog open={matrixOpen} onOpenChange={setMatrixOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col rounded-3xl p-0 overflow-hidden border-slate-100 bg-white shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Shield className="text-[#378179]" size={20} />
                                    <span>{activeRole?.display_name} Permissions</span>
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 text-xs mt-1">
                                    {isEditingMatrix
                                        ? "Configure exact module-level permissions for this role."
                                        : "Inspect permitted operations for this role."}
                                </DialogDescription>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-[#378179]/10 text-[#378179]">
                                    {selectedPerms.length} Active Permissions
                                </span>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Scrollable Module Checklist */}
                    <div className="p-6 overflow-y-auto space-y-4 flex-1">
                        {modules.map((mod) => {
                            const allModKeys = mod.permissions.map((p) => p.key);
                            const activeCount = allModKeys.filter((k) => selectedPerms.includes(k)).length;
                            const isAllSelected = activeCount === allModKeys.length && allModKeys.length > 0;
                            const isCollapsed = collapsedModules[mod.module_key];

                            return (
                                <div key={mod.module_key} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                    <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                                        <div
                                            onClick={() => toggleCollapse(mod.module_key)}
                                            className="flex items-center gap-2 cursor-pointer select-none"
                                        >
                                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">{mod.module_title}</h4>
                                                <p className="text-[11px] text-slate-400">{mod.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-semibold text-slate-500">
                                                {activeCount} / {mod.permissions.length}
                                            </span>
                                            {isEditingMatrix && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModuleAll(mod)}
                                                    className="text-[11px] font-bold text-[#378179] hover:underline cursor-pointer"
                                                >
                                                    {isAllSelected ? "Deselect All" : "Select All"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {!isCollapsed && (
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {mod.permissions.map((p) => {
                                                const checked = selectedPerms.includes(p.key);
                                                return (
                                                    <label
                                                        key={p.key}
                                                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                                            checked
                                                                ? "border-[#378179]/30 bg-[#378179]/5 text-slate-900"
                                                                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                                                        } ${!isEditingMatrix ? "cursor-default" : ""}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => togglePermission(p.key)}
                                                            disabled={!isEditingMatrix}
                                                            className="mt-0.5 rounded text-[#378179] focus:ring-[#378179]"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="font-semibold">{p.label}</p>
                                                            <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{p.description}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMatrixOpen(false)}
                            className="rounded-xl h-10 px-4 text-xs font-semibold border-slate-200 cursor-pointer"
                        >
                            Close
                        </Button>
                        {isEditingMatrix && (
                            <Button
                                onClick={handleSaveMatrix}
                                disabled={isSavingMatrix}
                                className="bg-[#378179] hover:bg-[#2c6761] text-white rounded-xl h-10 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                                {isSavingMatrix ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        Save Permissions
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CREATE CUSTOM ROLE MODAL */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6 border-slate-100 bg-white shadow-xl">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="text-[#378179]" size={20} />
                            Create Custom Workspace Role
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm font-medium">
                            Define a tailored role with explicit permission access.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Role Name *</label>
                            <Input
                                placeholder="e.g. Junior Sales Agent"
                                required
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                className="h-11 rounded-xl border-slate-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Description</label>
                            <Input
                                placeholder="e.g. Handles assigned customer contacts and follow-ups"
                                value={createDesc}
                                onChange={(e) => setCreateDesc(e.target.value)}
                                className="h-11 rounded-xl border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Initial Permissions ({createPerms.length} selected)</span>
                            </label>
                            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/50">
                                {modules.map((m) => (
                                    <div key={m.module_key} className="space-y-1.5">
                                        <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">{m.module_title}</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {m.permissions.map((p) => {
                                                const checked = createPerms.includes(p.key);
                                                return (
                                                    <label key={p.key} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => {
                                                                setCreatePerms((prev) =>
                                                                    prev.includes(p.key) ? prev.filter((k) => k !== p.key) : [...prev, p.key]
                                                                );
                                                            }}
                                                            className="rounded text-[#378179] focus:ring-[#378179]"
                                                        />
                                                        <span className="truncate">{p.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                                className="rounded-xl h-11 px-4 text-xs font-bold border-slate-200 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCreating}
                                className="bg-[#378179] hover:bg-[#2c6761] text-white rounded-xl h-11 px-5 text-xs font-bold shadow-xs cursor-pointer"
                            >
                                {isCreating ? <Loader2 size={16} className="animate-spin" /> : "Create Role"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DUPLICATE ROLE MODAL */}
            <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6 border-slate-100 bg-white shadow-xl">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Copy className="text-[#378179]" size={20} />
                            Duplicate Role
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm font-medium">
                            Create a custom variant of <strong className="text-slate-800">{roleToDuplicate?.display_name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">New Role Name *</label>
                            <Input
                                value={duplicateName}
                                onChange={(e) => setDuplicateName(e.target.value)}
                                className="h-11 rounded-xl border-slate-200"
                            />
                        </div>

                        <p className="text-[11px] text-slate-500">
                            All {roleToDuplicate?.permissions_count} permissions from {roleToDuplicate?.display_name} will be copied to this new custom role.
                        </p>

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDuplicateOpen(false)}
                                className="rounded-xl h-11 px-4 text-xs font-bold border-slate-200 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDuplicateRole}
                                disabled={isDuplicating}
                                className="bg-[#378179] hover:bg-[#2c6761] text-white rounded-xl h-11 px-5 text-xs font-bold shadow-xs cursor-pointer"
                            >
                                {isDuplicating ? <Loader2 size={16} className="animate-spin" /> : "Duplicate Role"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DELETE ROLE CONFIRMATION MODAL */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-3xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-rose-50/60 border-b border-rose-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-slate-800">Delete Custom Role</DialogTitle>
                            <DialogDescription className="text-slate-500 text-[11px] mt-0.5">
                                Permanent role deletion
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <p className="text-xs text-slate-700 leading-relaxed">
                            Are you sure you want to delete <strong className="text-slate-900">{roleToDelete?.display_name}</strong>?
                        </p>

                        {roleToDelete && roleToDelete.members_count > 0 && (
                            <div className="space-y-2 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                                <p className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle size={14} className="text-amber-600" />
                                    <span>Active Members Notice</span>
                                </p>
                                <p className="text-[11px]">
                                    This role is currently assigned to <strong>{roleToDelete.members_count}</strong> member(s). Select a role to reassign them to before deleting:
                                </p>
                                <select
                                    value={reassignTargetId}
                                    onChange={(e) => setReassignTargetId(e.target.value)}
                                    className="w-full h-9 rounded-lg border border-amber-300 bg-white text-xs px-2"
                                >
                                    <option value="">Select Reassignment Role...</option>
                                    {roles
                                        .filter((r) => r.id !== roleToDelete.id && r.name !== "owner")
                                        .map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.display_name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteOpen(false)}
                                disabled={isDeleting}
                                className="text-xs rounded-xl h-10 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDeleteRole}
                                disabled={isDeleting || (Boolean(roleToDelete && roleToDelete.members_count > 0 && !reassignTargetId))}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl h-10 px-5 font-semibold border-0 cursor-pointer"
                            >
                                {isDeleting ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Deleting...</span>
                                ) : "Delete Role"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
