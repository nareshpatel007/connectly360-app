"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Users,
    UserPlus,
    Mail,
    Loader2,
    Search,
    Shield,
    Trash2,
    RotateCw,
    Ban,
    CheckCircle,
    AlertTriangle,
    Clock,
    Sparkles,
    CheckCircle2,
    XCircle,
    UserCheck,
    ChevronDown,
    MoreVertical
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

interface Member {
    id: number;
    user_id: number;
    name: string;
    email: string;
    role: string;
    role_display: string;
    is_owner: boolean;
    status: string;
    joined_at: string;
    last_active_at?: string;
    created_at: string;
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    role_display: string;
    status: string;
    expires_at: string;
    created_at: string;
    invited_by?: {
        name: string;
    };
}

interface AvailableRole {
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_system: boolean;
    capabilities?: string[];
}

export default function TeamMembersPage() {
    const { token, user } = useAuth();
    const { can, isOwner } = usePermissions();

    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
    const [counts, setCounts] = useState({ active: 0, suspended: 0, pending: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

    // Invite Modal
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("sales_agent");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Change Role Modal
    const [roleChangeOpen, setRoleChangeOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [newRole, setNewRole] = useState<string>("");
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    // Suspend / Reactivate Modal
    const [suspendOpen, setSuspendOpen] = useState(false);
    const [memberToSuspend, setMemberToSuspend] = useState<Member | null>(null);
    const [isSuspending, setIsSuspending] = useState(false);

    // Remove Member Modal
    const [removeOpen, setRemoveOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // Cancel Invite Modal
    const [cancelInviteOpen, setCancelInviteOpen] = useState(false);
    const [inviteToCancel, setInviteToCancel] = useState<Invitation | null>(null);
    const [isCancellingInvite, setIsCancellingInvite] = useState(false);

    // Resend Invite State
    const [resendingInviteId, setResendingInviteId] = useState<number | null>(null);

    const canInvite = isOwner || can("workspace.members.invite");
    const canChangeRole = isOwner || can("workspace.roles.assign");
    const canUpdateMember = isOwner || can("workspace.members.update");
    const canRemoveMember = isOwner || can("workspace.members.remove");

    // Fetch members and pending invitations
    const fetchMembers = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/workspace/members", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status) {
                setMembers(data.members || []);
                setInvitations(data.invitations || []);
                if (data.counts) {
                    setCounts(data.counts);
                }
            }
        } catch (err) {
            console.error("Failed to load workspace members", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch available roles from Spatie RBAC
    const fetchRoles = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/workspace/roles", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.status && json.data) {
                setAvailableRoles(json.data);
                // Set default invite role to first non-owner role
                const nonOwner = json.data.find((r: AvailableRole) => r.name !== "owner");
                if (nonOwner) {
                    setInviteRole(nonOwner.name);
                }
            }
        } catch (err) {
            console.error("Failed to fetch available roles", err);
        }
    };

    useEffect(() => {
        fetchMembers();
        fetchRoles();
    }, [token]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) {
            setInviteError("Email address is required.");
            return;
        }

        setInviteError(null);
        setIsInviting(true);

        try {
            const res = await fetch("/api/workspace/members/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            const data = await res.json();
            if (data.status) {
                toast.success("Invitation sent successfully!");
                setInviteEmail("");
                setInviteOpen(false);
                fetchMembers();
            } else {
                setInviteError(data.message || data.error?.message || "Failed to send invitation.");
            }
        } catch (err) {
            setInviteError("Network error while sending invitation. Please try again.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedMember || !newRole || !token) return;
        setIsUpdatingRole(true);
        try {
            const res = await fetch(`/api/workspace/members/${selectedMember.user_id}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Role updated to ${data.data?.role_display || newRole} successfully.`);
                setRoleChangeOpen(false);
                setSelectedMember(null);
                fetchMembers();
            } else {
                toast.error(data.message || "Failed to update member role.");
            }
        } catch (err) {
            toast.error("Failed to update role.");
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const handleToggleSuspend = async () => {
        if (!memberToSuspend || !token) return;
        setIsSuspending(true);
        const isCurrentlySuspended = memberToSuspend.status === "suspended";
        const endpoint = isCurrentlySuspended
            ? `/api/workspace/members/${memberToSuspend.user_id}/reactivate`
            : `/api/workspace/members/${memberToSuspend.user_id}/suspend`;

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                toast.success(isCurrentlySuspended ? "Member access reactivated." : "Member access suspended.");
                setSuspendOpen(false);
                setMemberToSuspend(null);
                fetchMembers();
            } else {
                toast.error(data.message || "Operation failed.");
            }
        } catch (err) {
            toast.error("Network error while updating member status.");
        } finally {
            setIsSuspending(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove || !token) return;
        setIsRemoving(true);
        try {
            const res = await fetch(`/api/workspace/members/${memberToRemove.user_id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                toast.success("Member removed from workspace successfully.");
                setRemoveOpen(false);
                setMemberToRemove(null);
                fetchMembers();
            } else {
                toast.error(data.message || "Failed to remove member.");
            }
        } catch (err) {
            toast.error("Failed to remove member.");
        } finally {
            setIsRemoving(false);
        }
    };

    const handleResendInvite = async (invite: Invitation) => {
        if (!token) return;
        setResendingInviteId(invite.id);
        try {
            const res = await fetch(`/api/workspace/invitations/${invite.id}/resend`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Invitation resent to ${invite.email}`);
                fetchMembers();
            } else {
                toast.error(data.message || "Failed to resend invitation.");
            }
        } catch (err) {
            toast.error("Failed to resend invitation.");
        } finally {
            setResendingInviteId(null);
        }
    };

    const handleCancelInvite = async () => {
        if (!inviteToCancel || !token) return;
        setIsCancellingInvite(true);
        try {
            const res = await fetch(`/api/workspace/invitations/${inviteToCancel.id}/cancel`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                toast.success("Invitation cancelled successfully.");
                setCancelInviteOpen(false);
                setInviteToCancel(null);
                fetchMembers();
            } else {
                toast.error(data.message || "Failed to cancel invitation.");
            }
        } catch (err) {
            toast.error("Failed to cancel invitation.");
        } finally {
            setIsCancellingInvite(false);
        }
    };

    const getRoleBadgeClass = (roleName: string) => {
        const name = roleName.toLowerCase();
        if (name === "owner") return "bg-purple-50 text-purple-700 border border-purple-200";
        if (name === "admin") return "bg-blue-50 text-blue-700 border border-blue-200";
        if (name === "manager") return "bg-indigo-50 text-indigo-700 border border-indigo-200";
        if (name === "sales_agent") return "bg-teal-50 text-teal-700 border border-teal-200";
        if (name === "support_agent") return "bg-sky-50 text-sky-700 border border-sky-200";
        if (name === "marketing_manager") return "bg-amber-50 text-amber-700 border border-amber-200";
        if (name === "finance") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        return "bg-slate-50 text-slate-600 border border-slate-200";
    };

    const getInitials = (name: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    // Filter members by search term and status
    const filteredMembers = useMemo(() => {
        return members.filter((m) => {
            const matchesSearch =
                (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.email || "").toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;
            if (statusFilter === "active") return m.status === "active";
            if (statusFilter === "suspended") return m.status === "suspended";
            return true;
        });
    }, [members, searchTerm, statusFilter]);

    // Filter invitations by search term
    const filteredInvitations = useMemo(() => {
        return invitations.filter((i) =>
            (i.email || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [invitations, searchTerm]);

    // Find currently selected role in invite modal for preview
    const selectedInviteRoleObj = availableRoles.find((r) => r.name === inviteRole);

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Users}
                title="Team Members"
                description="Manage who has access to your workspace and add team members."
            />

            {/* Summary Count Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-[#EAE6DF] p-4 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Members</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{counts.active || members.filter(m => m.status === 'active').length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <UserCheck size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE6DF] p-4 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invites</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">{counts.pending || invitations.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Mail size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE6DF] p-4 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suspended</p>
                        <p className="text-2xl font-black text-slate-700 mt-1">{counts.suspended || members.filter(m => m.status === 'suspended').length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                        <Ban size={20} />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-[#EAE6DF]">
                    <Loader2 className="animate-spin text-[#378179]" size={36} />
                    <p className="text-sm font-semibold text-slate-500">Loading workspace team members...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active Team Members Card */}
                    <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800">Active Members</CardTitle>
                                <CardDescription className="text-slate-500 text-sm mt-0.5">
                                    Users who currently have active access to this workspace.
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Status Filter Tabs */}
                                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
                                    <button
                                        onClick={() => setStatusFilter("all")}
                                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("active")}
                                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === "active" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("suspended")}
                                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${statusFilter === "suspended" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
                                    >
                                        Suspended
                                    </button>
                                </div>

                                {/* Search Input */}
                                <div className="relative w-44 sm:w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search members..."
                                        className="pl-9 h-9 text-xs text-slate-600 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Invite Member Button */}
                                {canInvite && (
                                    <Button
                                        onClick={() => {
                                            setInviteError(null);
                                            setInviteOpen(true);
                                        }}
                                        className="bg-[#378179] hover:bg-[#2c6761] text-white text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 border-0 font-semibold cursor-pointer shadow-xs"
                                    >
                                        <UserPlus size={14} />
                                        Invite Member
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider pl-6">Member</TableHead>
                                        <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Role</TableHead>
                                        <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Joined</TableHead>
                                        <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-500 text-xs pl-6 pr-6">
                                                No team members found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMembers.map((m) => {
                                            const isCurrentUser = m.user_id === user?.id;
                                            const isWorkspaceOwner = m.is_owner || m.role.toLowerCase() === "owner";

                                            return (
                                                <TableRow key={m.id} className="hover:bg-slate-50/40 transition-colors">
                                                    <TableCell className="py-3.5 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#378179] to-[#2c6f66] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                                                {getInitials(m.name)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5">
                                                                    <span>{m.name}</span>
                                                                    {isCurrentUser && (
                                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                                                                            You
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-slate-400 truncate mt-0.5">{m.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3.5">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadgeClass(m.role)}`}>
                                                            {m.role_display}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="py-3.5">
                                                        {m.status === "suspended" ? (
                                                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                                                Suspended
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                Active
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="py-3.5 text-xs text-slate-500 font-medium">
                                                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString("en-IN") : "-"}
                                                    </TableCell>

                                                    <TableCell className="py-3.5 text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Change Role Button */}
                                                            {canChangeRole && !isWorkspaceOwner && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedMember(m);
                                                                        setNewRole(m.role);
                                                                        setRoleChangeOpen(true);
                                                                    }}
                                                                    className="h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                                                                >
                                                                    Change Role
                                                                </Button>
                                                            )}

                                                            {/* Suspend / Reactivate */}
                                                            {canUpdateMember && !isWorkspaceOwner && !isCurrentUser && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setMemberToSuspend(m);
                                                                        setSuspendOpen(true);
                                                                    }}
                                                                    className={`h-8 text-xs font-medium rounded-lg cursor-pointer ${
                                                                        m.status === "suspended"
                                                                            ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                            : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                    }`}
                                                                >
                                                                    {m.status === "suspended" ? "Reactivate" : "Suspend"}
                                                                </Button>
                                                            )}

                                                            {/* Remove Member */}
                                                            {canRemoveMember && !isWorkspaceOwner && !isCurrentUser && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setMemberToRemove(m);
                                                                        setRemoveOpen(true);
                                                                    }}
                                                                    className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                                    title="Remove from workspace"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pending Invitations Section */}
                    {filteredInvitations.length > 0 && (
                        <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-base font-bold text-slate-800">Pending Invitations</CardTitle>
                                <CardDescription className="text-slate-500 text-sm mt-0.5">
                                    Invitations sent that are waiting for acceptance.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider pl-6">Invited Email</TableHead>
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Role</TableHead>
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Status</TableHead>
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Expires</TableHead>
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInvitations.map((i) => (
                                            <TableRow key={i.id} className="hover:bg-slate-50/40 transition-colors">
                                                <TableCell className="py-3.5 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 font-bold">
                                                            <Mail size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">{i.email}</p>
                                                            {i.invited_by && (
                                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                                    Invited by {i.invited_by.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3.5">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadgeClass(i.role)}`}>
                                                        {i.role_display}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="py-3.5">
                                                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                                        Pending
                                                    </span>
                                                </TableCell>

                                                <TableCell className="py-3.5 text-xs text-slate-500 font-medium">
                                                    {i.expires_at ? new Date(i.expires_at).toLocaleDateString("en-IN") : "In 7 days"}
                                                </TableCell>

                                                <TableCell className="py-3.5 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {canInvite && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleResendInvite(i)}
                                                                disabled={resendingInviteId === i.id}
                                                                className="h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium cursor-pointer flex items-center gap-1"
                                                            >
                                                                <RotateCw size={12} className={resendingInviteId === i.id ? "animate-spin" : ""} />
                                                                Resend
                                                            </Button>
                                                        )}

                                                        {canInvite && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setInviteToCancel(i);
                                                                    setCancelInviteOpen(true);
                                                                }}
                                                                className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                                title="Cancel Invitation"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* INVITE MEMBER MODAL */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6 border-slate-100 bg-white shadow-xl">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <UserPlus className="text-[#378179]" size={20} />
                            Invite Team Member
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm font-medium">
                            Send a secure invitation to collaborate on this workspace.
                        </DialogDescription>
                    </DialogHeader>

                    {inviteError && (
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span>{inviteError}</span>
                        </div>
                    )}

                    <form onSubmit={handleInvite} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-bold text-slate-700">
                                Email Address *
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@company.com"
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="h-11 border-slate-200 focus-visible:ring-[#378179] focus-visible:border-[#378179] rounded-xl font-medium"
                                disabled={isInviting}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="role" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Assign Workspace Role *</span>
                                <span className="text-[11px] text-slate-400 font-normal">Spatie RBAC</span>
                            </label>

                            <select
                                id="role"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="h-11 w-full border border-slate-200 focus:ring-[#378179] focus:border-[#378179] focus:outline-none rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900"
                                disabled={isInviting}
                            >
                                {availableRoles
                                    .filter((r) => r.name !== "owner")
                                    .map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {r.display_name} {r.is_system ? "(System)" : "(Custom)"}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Role Capability Preview */}
                        {selectedInviteRoleObj && (
                            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-2">
                                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                                    <Shield size={14} className="text-[#378179]" />
                                    <span>{selectedInviteRoleObj.display_name} Capabilities:</span>
                                </p>
                                <p className="text-slate-500 text-[11px] leading-relaxed">
                                    {selectedInviteRoleObj.description}
                                </p>
                                {selectedInviteRoleObj.capabilities && selectedInviteRoleObj.capabilities.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                        {selectedInviteRoleObj.capabilities.slice(0, 4).map((cap, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-700">
                                                <CheckCircle2 size={12} className="text-[#378179] shrink-0" />
                                                <span className="truncate">{cap}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setInviteOpen(false)}
                                className="h-11 rounded-xl font-bold border-slate-200 text-slate-600 cursor-pointer"
                                disabled={isInviting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="h-11 bg-[#378179] hover:bg-[#2c6f66] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                                disabled={isInviting}
                            >
                                {isInviting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        Sending Invite...
                                    </>
                                ) : (
                                    "Send Invitation"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* CHANGE ROLE DIALOG */}
            <Dialog open={roleChangeOpen} onOpenChange={setRoleChangeOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6 border-slate-100 bg-white shadow-xl">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="text-[#378179]" size={20} />
                            Change Member Role
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm font-medium">
                            Update access permissions for <strong className="text-slate-800">{selectedMember?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                            <span className="text-slate-500">Current Role:</span>
                            <span className="font-bold text-slate-800">{selectedMember?.role_display}</span>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="newRole" className="text-xs font-bold text-slate-700">
                                Select New Role
                            </label>
                            <select
                                id="newRole"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="h-11 w-full border border-slate-200 focus:ring-[#378179] focus:border-[#378179] focus:outline-none rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900"
                                disabled={isUpdatingRole}
                            >
                                {availableRoles
                                    .filter((r) => r.name !== "owner")
                                    .map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {r.display_name} {r.is_system ? "(System)" : "(Custom)"}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <p className="text-[11px] text-slate-400">
                            Changing their role will update their effective permissions immediately without requiring a logout.
                        </p>

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRoleChangeOpen(false)}
                                className="h-11 rounded-xl font-bold border-slate-200 text-slate-600 cursor-pointer"
                                disabled={isUpdatingRole}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateRole}
                                className="h-11 bg-[#378179] hover:bg-[#2c6f66] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                                disabled={isUpdatingRole}
                            >
                                {isUpdatingRole ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Role"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* SUSPEND / REACTIVATE CONFIRMATION DIALOG */}
            <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-3xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-amber-50/60 border-b border-amber-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Ban size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-slate-800">
                                {memberToSuspend?.status === "suspended" ? "Reactivate Member Access" : "Suspend Member Access"}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 text-[11px] mt-0.5">
                                Workspace access control
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <p className="text-xs text-slate-700 leading-relaxed">
                            {memberToSuspend?.status === "suspended" ? (
                                <>
                                    Reactivate workspace access for <strong className="text-slate-900">{memberToSuspend?.name}</strong>? They will be able to access all assigned resources immediately.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to suspend <strong className="text-slate-900">{memberToSuspend?.name}</strong>? Suspended members cannot call workspace APIs or view workspace data.
                                </>
                            )}
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSuspendOpen(false)}
                                disabled={isSuspending}
                                className="text-xs rounded-xl h-10 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleToggleSuspend}
                                className={`text-white text-xs rounded-xl h-10 px-5 font-semibold border-0 cursor-pointer ${
                                    memberToSuspend?.status === "suspended"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-amber-600 hover:bg-amber-700"
                                }`}
                                disabled={isSuspending}
                            >
                                {isSuspending ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Processing...</span>
                                ) : memberToSuspend?.status === "suspended" ? "Reactivate Access" : "Suspend Member"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* REMOVE MEMBER CONFIRMATION DIALOG */}
            <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-3xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-rose-50/60 border-b border-rose-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-slate-800">Remove from Workspace</DialogTitle>
                            <DialogDescription className="text-slate-500 text-[11px] mt-0.5">
                                Membership revocation
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <p className="text-xs text-slate-700 leading-relaxed">
                            Are you sure you want to remove <strong className="text-slate-900">{memberToRemove?.name}</strong> ({memberToRemove?.email}) from this workspace? Their workspace membership and role will be revoked, but their global account will not be deleted.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRemoveOpen(false)}
                                disabled={isRemoving}
                                className="text-xs rounded-xl h-10 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleRemoveMember}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl h-10 px-5 font-semibold border-0 cursor-pointer"
                                disabled={isRemoving}
                            >
                                {isRemoving ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Removing...</span>
                                ) : "Remove Member"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CANCEL INVITATION CONFIRMATION DIALOG */}
            <Dialog open={cancelInviteOpen} onOpenChange={setCancelInviteOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-3xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-rose-50/60 border-b border-rose-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-slate-800">Cancel Invitation</DialogTitle>
                            <DialogDescription className="text-slate-500 text-[11px] mt-0.5">
                                Invalidate pending invitation token
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <p className="text-xs text-slate-700 leading-relaxed">
                            Are you sure you want to cancel the invitation sent to <strong className="text-slate-900">{inviteToCancel?.email}</strong>? The invitation token will be cancelled.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCancelInviteOpen(false)}
                                disabled={isCancellingInvite}
                                className="text-xs rounded-xl h-10 px-4 font-semibold cursor-pointer"
                            >
                                Keep Invite
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCancelInvite}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl h-10 px-5 font-semibold border-0 cursor-pointer"
                                disabled={isCancellingInvite}
                            >
                                {isCancellingInvite ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Cancelling...</span>
                                ) : "Cancel Invitation"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
