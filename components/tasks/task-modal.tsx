"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    CheckSquare,
    Users,
    GitBranch,
    Calendar,
    Clock,
    AlertCircle,
    Loader2,
    X,
    Search,
    MessageSquare,
    Bell
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface TaskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: string | null;
    editingTask?: any | null;
    initialContactId?: number | null;
    initialContactName?: string | null;
    initialLeadId?: number | null;
    initialLeadName?: string | null;
    initialConversationId?: number | null;
    onSaveSuccess: (task: any) => void;
}

export function TaskModal({
    open,
    onOpenChange,
    token,
    editingTask,
    initialContactId,
    initialContactName,
    initialLeadId,
    initialLeadName,
    initialConversationId,
    onSaveSuccess
}: TaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<string>("medium");
    const [taskType, setTaskType] = useState<string>("follow_up");
    const [dueDate, setDueDate] = useState<string>("");
    const [assignedTo, setAssignedTo] = useState<string>("");
    const [reminderOffset, setReminderOffset] = useState<string>("30");

    // Workspace Members
    const [members, setMembers] = useState<any[]>([]);
    const [isMembersLoading, setIsMembersLoading] = useState(false);

    // Selected Relations
    const [selectedContact, setSelectedContact] = useState<{ id: number; name: string; phone: string } | null>(null);
    const [selectedLead, setSelectedLead] = useState<{ id: number; name: string } | null>(null);

    // Contact Search State
    const [contactSearch, setContactSearch] = useState("");
    const [contactResults, setContactResults] = useState<any[]>([]);
    const [isSearchingContacts, setIsSearchingContacts] = useState(false);
    const [showContactDropdown, setShowContactDropdown] = useState(false);

    // Lead Search State
    const [leadSearch, setLeadSearch] = useState("");
    const [leadResults, setLeadResults] = useState<any[]>([]);
    const [isSearchingLeads, setIsSearchingLeads] = useState(false);
    const [showLeadDropdown, setShowLeadDropdown] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch workspace members for assignment
    useEffect(() => {
        if (open && token) {
            setIsMembersLoading(true);
            fetch("/api/workspace/members", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.status && Array.isArray(data.members)) {
                        setMembers(data.members);
                    }
                })
                .catch(() => {})
                .finally(() => setIsMembersLoading(false));
        }
    }, [open, token]);

    // Initialize or reset form state
    useEffect(() => {
        if (open) {
            if (editingTask) {
                setTitle(editingTask.title || "");
                setDescription(editingTask.description || "");
                setPriority(editingTask.priority || "medium");
                setTaskType(editingTask.task_type || "follow_up");
                setAssignedTo(editingTask.assigned_to ? String(editingTask.assigned_to) : "");
                setDueDate(
                    editingTask.due_at
                        ? new Date(editingTask.due_at).toISOString().slice(0, 16)
                        : ""
                );
                if (editingTask.contact) {
                    setSelectedContact({
                        id: editingTask.contact.id,
                        name: editingTask.contact.name || "Unnamed Contact",
                        phone: editingTask.contact.phone
                    });
                } else {
                    setSelectedContact(null);
                }
                if (editingTask.lead) {
                    setSelectedLead({
                        id: editingTask.lead.id,
                        name: editingTask.lead.customer_name || "Lead"
                    });
                } else {
                    setSelectedLead(null);
                }
            } else {
                setTitle(initialContactName ? `Follow up with ${initialContactName}` : "");
                setDescription("");
                setPriority("medium");
                setTaskType("follow_up");
                setAssignedTo("");
                // Default due date to today at 5:00 PM if none
                const defaultDue = new Date();
                defaultDue.setHours(17, 0, 0, 0);
                setDueDate(defaultDue.toISOString().slice(0, 16));

                if (initialContactId) {
                    setSelectedContact({
                        id: initialContactId,
                        name: initialContactName || "Contact",
                        phone: ""
                    });
                } else {
                    setSelectedContact(null);
                }

                if (initialLeadId) {
                    setSelectedLead({
                        id: initialLeadId,
                        name: initialLeadName || "Lead"
                    });
                } else {
                    setSelectedLead(null);
                }
            }
        }
    }, [open, editingTask, initialContactId, initialContactName, initialLeadId, initialLeadName]);

    // Debounced Contact Search
    useEffect(() => {
        if (!open || !contactSearch.trim() || !token) {
            setContactResults([]);
            return;
        }
        const timer = setTimeout(() => {
            setIsSearchingContacts(true);
            fetch(`/api/tasks/search-contacts?search=${encodeURIComponent(contactSearch)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((r) => r.json())
                .then((res) => {
                    if (res.status && Array.isArray(res.data)) {
                        setContactResults(res.data);
                        setShowContactDropdown(true);
                    }
                })
                .catch(() => {})
                .finally(() => setIsSearchingContacts(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [contactSearch, open, token]);

    // Debounced Lead Search
    useEffect(() => {
        if (!open || !leadSearch.trim() || !token) {
            setLeadResults([]);
            return;
        }
        const timer = setTimeout(() => {
            setIsSearchingLeads(true);
            fetch(`/api/tasks/search-leads?search=${encodeURIComponent(leadSearch)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((r) => r.json())
                .then((res) => {
                    if (res.status && Array.isArray(res.data)) {
                        setLeadResults(res.data);
                        setShowLeadDropdown(true);
                    }
                })
                .catch(() => {})
                .finally(() => setIsSearchingLeads(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [leadSearch, open, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Please enter a task title");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                priority,
                task_type: taskType,
                due_at: dueDate ? new Date(dueDate).toISOString() : null,
                reminder_offset: reminderOffset ? parseInt(reminderOffset) : null,
                assigned_to: assignedTo ? parseInt(assignedTo) : null,
                contact_id: selectedContact ? selectedContact.id : null,
                lead_id: selectedLead ? selectedLead.id : null,
                conversation_id: initialConversationId || (editingTask ? editingTask.conversation_id : null),
                source: selectedContact ? "contact" : selectedLead ? "lead" : "manual"
            };

            const url = editingTask?.id ? `/api/tasks/${editingTask.id}` : "/api/tasks";
            const method = editingTask?.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.status) {
                toast.success(editingTask ? "Task updated successfully!" : "Task created successfully!");
                onSaveSuccess(data.data);
                onOpenChange(false);
            } else {
                toast.error(data.message || "Failed to save task");
            }
        } catch {
            toast.error("Network error saving task");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white border border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-[#35877D]/10 text-[#35877D] flex items-center justify-center">
                            <CheckSquare size={16} />
                        </div>
                        {editingTask ? "Edit Workspace Task" : "Create Workspace Follow-up Task"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Schedule an actionable customer follow-up, call, or team assignment.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Task Title *</Label>
                        <Input
                            required
                            placeholder="e.g. Send WhatsApp proposal quote to Apex Logistics"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                        />
                    </div>

                    {/* Details / Description */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Details / Notes</Label>
                        <Textarea
                            rows={2}
                            placeholder="Add specific context, questions to ask, or instructions..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="rounded-xl border-slate-200 text-xs font-semibold"
                        />
                    </div>

                    {/* Task Type & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Task Type</Label>
                            <select
                                value={taskType}
                                onChange={(e) => setTaskType(e.target.value)}
                                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                            >
                                <option value="follow_up">Sales Follow-up</option>
                                <option value="call">Phone Call</option>
                                <option value="meeting">Meeting / Demo</option>
                                <option value="whatsapp">WhatsApp Message</option>
                                <option value="email">Email</option>
                                <option value="support">Customer Support</option>
                                <option value="payment">Payment / Invoice</option>
                                <option value="general">General Task</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Priority</Label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                            >
                                <option value="urgent">Urgent</option>
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date & Assignee */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Due Date & Time</Label>
                            <Input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Assignee</Label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                            >
                                <option value="">Unassigned</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name || m.email} ({m.role || "Member"})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Reminder Option */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Bell size={13} className="text-[#35877D]" />
                            <span>In-App Reminder</span>
                        </Label>
                        <select
                            value={reminderOffset}
                            onChange={(e) => setReminderOffset(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                        >
                            <option value="">No reminder</option>
                            <option value="0">At due time</option>
                            <option value="15">15 minutes before</option>
                            <option value="30">30 minutes before</option>
                            <option value="60">1 hour before</option>
                            <option value="1440">1 day before</option>
                        </select>
                    </div>

                    {/* Related Contact Picker */}
                    <div className="space-y-1.5 relative">
                        <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Users size={13} className="text-[#35877D]" />
                                Related Contact
                            </span>
                            {selectedContact && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedContact(null)}
                                    className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </Label>

                        {selectedContact ? (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-slate-800">
                                <span className="flex items-center gap-2">
                                    <span className="font-bold">{selectedContact.name}</span>
                                    {selectedContact.phone && (
                                        <span className="text-slate-500 font-mono text-[11px]">
                                            ({selectedContact.phone})
                                        </span>
                                    )}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedContact(null)}
                                    className="h-5 w-5 rounded-md hover:bg-teal-100 flex items-center justify-center text-slate-500"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search contact by name or phone..."
                                    value={contactSearch}
                                    onChange={(e) => setContactSearch(e.target.value)}
                                    onFocus={() => {
                                        if (contactResults.length > 0) setShowContactDropdown(true);
                                    }}
                                    className="pl-9 h-9 rounded-xl border-slate-200 text-xs font-semibold"
                                />
                                {isSearchingContacts && (
                                    <Loader2 size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#35877D]" />
                                )}

                                {showContactDropdown && contactResults.length > 0 && (
                                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                                        {contactResults.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedContact({
                                                        id: c.id,
                                                        name: c.name || "Contact",
                                                        phone: c.phone
                                                    });
                                                    setShowContactDropdown(false);
                                                    setContactSearch("");
                                                }}
                                                className="w-full text-left p-2 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer"
                                            >
                                                <span className="font-bold text-slate-800">{c.name || "Unnamed"}</span>
                                                <span className="font-mono text-slate-500 text-[11px]">{c.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Related Lead Picker */}
                    <div className="space-y-1.5 relative">
                        <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <GitBranch size={13} className="text-[#35877D]" />
                                Related Lead
                            </span>
                            {selectedLead && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedLead(null)}
                                    className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </Label>

                        {selectedLead ? (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-slate-800">
                                <span className="font-bold">{selectedLead.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedLead(null)}
                                    className="h-5 w-5 rounded-md hover:bg-purple-100 flex items-center justify-center text-slate-500"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search lead by name or deal..."
                                    value={leadSearch}
                                    onChange={(e) => setLeadSearch(e.target.value)}
                                    onFocus={() => {
                                        if (leadResults.length > 0) setShowLeadDropdown(true);
                                    }}
                                    className="pl-9 h-9 rounded-xl border-slate-200 text-xs font-semibold"
                                />
                                {isSearchingLeads && (
                                    <Loader2 size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#35877D]" />
                                )}

                                {showLeadDropdown && leadResults.length > 0 && (
                                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                                        {leadResults.map((l) => (
                                            <button
                                                key={l.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedLead({
                                                        id: l.id,
                                                        name: l.customer_name || "Lead"
                                                    });
                                                    setShowLeadDropdown(false);
                                                    setLeadSearch("");
                                                }}
                                                className="w-full text-left p-2 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer"
                                            >
                                                <span className="font-bold text-slate-800">{l.customer_name}</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">{l.status}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl h-9 px-5 shadow-xs gap-1.5"
                        >
                            {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                            {editingTask ? "Update Task" : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
