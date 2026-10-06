"use client";

import { useEffect, useState } from "react";
import { UserPlus, Mail, Loader2, UserCheck, Clock, AlertCircle, CheckCircle, Search, Users, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

export default function TeamMembersPage() {
    const { token, user } = useAuth();

    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Invite Modal states
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Delete Confirmation states
    const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
    const [isDeletingMember, setIsDeletingMember] = useState(false);

    const [deleteInviteOpen, setDeleteInviteOpen] = useState(false);
    const [inviteToDelete, setInviteToDelete] = useState<Invitation | null>(null);
    const [isDeletingInvite, setIsDeletingInvite] = useState(false);

    const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";

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
            }
        } catch (err) {
            console.error("Failed to load workspace members", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [token]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Email address is required.");
            return;
        }

        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/workspace/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email, role })
            });
            const data = await res.json();
            if (data.status) {
                setSuccess("Invitation sent successfully!");
                setEmail("");
                setRole("member");
                fetchMembers(); // refresh
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess(null);
                }, 1500);
            } else {
                setError(data.message || "Failed to send invitation.");
            }
        } catch (err) {
            setError("Failed to send invitation. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete || !token) return;
        setIsDeletingMember(true);
        try {
            const res = await fetch(`/api/workspace/members/${memberToDelete.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status) {
                toast.success("Member removed successfully.");
                setDeleteMemberOpen(false);
                setMemberToDelete(null);
                fetchMembers();
            } else {
                toast.error(data.message || "Failed to remove member.");
            }
        } catch (err) {
            toast.error("Failed to delete member.");
        } finally {
            setIsDeletingMember(false);
        }
    };

    const handleDeleteInvite = async () => {
        if (!inviteToDelete || !token) return;
        setIsDeletingInvite(true);
        try {
            const res = await fetch(`/api/workspace/invite/${inviteToDelete.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status) {
                toast.success("Invitation cancelled successfully.");
                setDeleteInviteOpen(false);
                setInviteToDelete(null);
                fetchMembers();
            } else {
                toast.error(data.message || "Failed to cancel invitation.");
            }
        } catch (err) {
            toast.error("Failed to delete invitation.");
        } finally {
            setIsDeletingInvite(false);
        }
    };

    const getRoleBadgeClass = (roleName: string) => {
        const name = roleName.toLowerCase();
        if (name === "owner") return "bg-purple-50 text-purple-700 border border-purple-200";
        if (name === "admin") return "bg-blue-50 text-blue-700 border border-blue-200";
        return "bg-slate-50 text-slate-600 border border-slate-200";
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const filteredMembers = members.filter(m =>
        (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredInvitations = invitations.filter(i =>
        (i.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">

            <PageHeader
                icon={Users}
                title="Team Members"
                description="Manage who has access to your workspace and add team members."
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-[#378179]" size={36} />
                    <p className="text-sm font-medium text-slate-500">Loading your workspace team...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active Team Members Table */}
                    <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800">Active Members</CardTitle>
                                <CardDescription className="text-slate-500 text-sm mt-0.5">
                                    Users who currently have active access to this workspace.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
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
                                {isAdminOrOwner && (
                                    <Button
                                        onClick={() => {
                                            setError(null);
                                            setSuccess(null);
                                            setIsOpen(true);
                                        }}
                                        className="bg-[#378179] hover:bg-[#2c6761] text-white text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 border-0 font-semibold cursor-pointer"
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
                                        {isAdminOrOwner && <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider text-right pr-6">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isAdminOrOwner ? 5 : 4} className="h-32 text-center text-slate-500 text-xs pl-6 pr-6">
                                                No active members found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMembers.map((m) => (
                                            <TableRow key={m.id} className="hover:bg-slate-50/40 transition-colors">
                                                <TableCell className="py-3.5 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#378179] to-[#2c6f66] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                            {getInitials(m.name)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">{m.name}</p>
                                                            <p className="text-xs text-slate-400 truncate mt-0.5">{m.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadgeClass(m.role)}`}>
                                                        {m.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        {m.status || "active"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5 text-xs text-slate-500 font-medium">
                                                    {m.created_at ? new Date(m.created_at).toLocaleDateString("en-IN") : "-"}
                                                </TableCell>
                                                {isAdminOrOwner && (
                                                    <TableCell className="py-3.5 text-right pr-6">
                                                        {m.role.toLowerCase() !== "owner" && m.id !== user?.id && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setMemberToDelete(m);
                                                                    setDeleteMemberOpen(true);
                                                                }}
                                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
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
                                    Sent invitations that are waiting to be accepted.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider pl-6">Invited Email</TableHead>
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Role</TableHead>
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Status</TableHead>
                                            <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Sent Date</TableHead>
                                            {isAdminOrOwner && <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider text-right pr-6">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInvitations.map((i) => (
                                            <TableRow key={i.id} className="hover:bg-slate-50/40 transition-colors">
                                                <TableCell className="py-3.5 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                                            <Mail size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">{i.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadgeClass(i.role)}`}>
                                                        {i.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                                        {i.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5 text-xs text-slate-500 font-medium">
                                                    {i.created_at ? new Date(i.created_at).toLocaleDateString("en-IN") : "-"}
                                                </TableCell>
                                                {isAdminOrOwner && (
                                                    <TableCell className="py-3.5 text-right pr-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setInviteToDelete(i);
                                                                setDeleteInviteOpen(true);
                                                            }}
                                                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Invite Modal Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6 border-slate-100 bg-white shadow-xl">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <UserPlus className="text-[#378179]" size={20} />
                            Invite Team Member
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm font-medium">
                            Send an email invitation to join this workspace.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
                            <CheckCircle size={16} className="shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-bold text-slate-700">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 border-slate-200 focus-visible:ring-[#378179] focus-visible:border-[#378179] rounded-xl font-medium"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="role" className="text-xs font-bold text-slate-700">
                                Role
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="h-11 w-full border border-slate-200 focus:ring-[#378179] focus:border-[#378179] focus:outline-none rounded-xl bg-slate-50 font-medium px-3 text-sm text-slate-900"
                                disabled={isSubmitting}
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                className="h-11 rounded-xl font-bold border-slate-200 text-slate-600 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="h-11 bg-[#378179] hover:bg-[#2c6f66] text-white font-bold rounded-xl shadow-sm cursor-pointer"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Invitation"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE MEMBER CONFIRMATION DIALOG */}
            <Dialog open={deleteMemberOpen} onOpenChange={(open) => { setDeleteMemberOpen(open); if (!open) setMemberToDelete(null); }}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-red-50/50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-slate-800">Remove Team Member</DialogTitle>
                            <DialogDescription className="text-slate-500 text-[11px] mt-0.5">
                                This action is permanent and cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-5">
                        <p className="text-sm text-slate-700 leading-relaxed">
                            Are you sure you want to remove <strong className="text-slate-900 font-semibold">{memberToDelete?.name}</strong> ({memberToDelete?.email}) from this workspace? They will lose access to all resources instantly.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setDeleteMemberOpen(false); setMemberToDelete(null); }}
                                disabled={isDeletingMember}
                                className="text-xs rounded-xl h-9 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDeleteMember}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer"
                                disabled={isDeletingMember}
                            >
                                {isDeletingMember ? (
                                    <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Removing...</span>
                                ) : "Remove Member"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DELETE INVITE CONFIRMATION DIALOG */}
            <Dialog open={deleteInviteOpen} onOpenChange={(open) => { setDeleteInviteOpen(open); if (!open) setInviteToDelete(null); }}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-red-50/50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-slate-800">Cancel Invitation</DialogTitle>
                            <DialogDescription className="text-slate-500 text-[11px] mt-0.5">
                                This action is permanent and cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-5 space-y-5">
                        <p className="text-sm text-slate-700 leading-relaxed">
                            Are you sure you want to cancel the invitation sent to <strong className="text-slate-900 font-semibold">{inviteToDelete?.email}</strong>? The invitation token will become invalid.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setDeleteInviteOpen(false); setInviteToDelete(null); }}
                                disabled={isDeletingInvite}
                                className="text-xs rounded-xl h-9 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDeleteInvite}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer"
                                disabled={isDeletingInvite}
                            >
                                {isDeletingInvite ? (
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
