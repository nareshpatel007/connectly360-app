"use client";

import React, { useState } from "react";
import {
    CheckSquare,
    Plus,
    Search,
    Calendar,
    UserCheck,
    Clock,
    AlertCircle,
    CheckCircle2,
    GitBranch,
    MessageSquare,
    Filter,
    ChevronDown,
    MoreVertical
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface TaskItem {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    relatedContact?: string;
    relatedLead?: string;
    dueDate: string;
    priority: "high" | "medium" | "low";
    status: "pending" | "completed";
    category: "today" | "upcoming" | "overdue" | "completed";
}

const INITIAL_TASKS: TaskItem[] = [
    {
        id: "task_1",
        title: "Send WhatsApp proposal quote to Apex Logistics",
        description: "Follow up on custom enterprise plan quote details.",
        assignedTo: "Sarah Jenkins",
        relatedContact: "John Doe (+1 555-0192)",
        relatedLead: "Apex Logistics - Enterprise Plan",
        dueDate: "Today, 4:00 PM",
        priority: "high",
        status: "pending",
        category: "today"
    },
    {
        id: "task_2",
        title: "Schedule onboarding call with Global Tech team",
        description: "Walkthrough WABA number migration and Meta verification.",
        assignedTo: "Alex Smith",
        relatedContact: "Maria Garcia",
        dueDate: "Tomorrow, 11:30 AM",
        priority: "medium",
        status: "pending",
        category: "upcoming"
    },
    {
        id: "task_3",
        title: "Resolve stuck conversation AI handoff issue",
        description: "Check trigger conditions for intent escalation.",
        assignedTo: "Dev Support",
        relatedContact: "Robert Chen",
        dueDate: "Yesterday, 2:00 PM",
        priority: "high",
        status: "pending",
        category: "overdue"
    },
    {
        id: "task_4",
        title: "Confirm Razorpay payment receipt for Credit Topup",
        description: "Verified auto-recharge invoice PDF generation.",
        assignedTo: "Billing Team",
        dueDate: "2 days ago",
        priority: "low",
        status: "completed",
        category: "completed"
    }
];

export default function TasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
    const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming" | "overdue" | "completed">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

    const handleToggleTask = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === id) {
                    const nextStatus = t.status === "pending" ? "completed" : "pending";
                    toast.success(
                        nextStatus === "completed"
                            ? "Task marked as completed!"
                            : "Task marked as pending"
                    );
                    return { ...t, status: nextStatus };
                }
                return t;
            })
        );
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Please enter a task title");
            return;
        }

        const newTask: TaskItem = {
            id: `task_${Date.now()}`,
            title,
            description,
            assignedTo: user?.name || "Assigned User",
            dueDate: dueDate ? new Date(dueDate).toLocaleString() : "Today, 5:00 PM",
            priority,
            status: "pending",
            category: "today"
        };

        setTasks([newTask, ...tasks]);
        setIsCreateModalOpen(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        toast.success("Task created successfully!");
    };

    const filteredTasks = tasks.filter((t) => {
        const matchesTab =
            activeTab === "all"
                ? true
                : activeTab === "completed"
                ? t.status === "completed"
                : t.category === activeTab && t.status !== "completed";
        const matchesQuery =
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.relatedContact && t.relatedContact.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTab && matchesQuery;
    });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
            {/* Header */}
            <PageHeader
                icon={CheckSquare}
                title="Workspace Tasks & Follow-ups"
                description="Track sales follow-ups, customer service action items, and team assignments."
                breadcrumbs={[{ label: "Tasks" }]}
                actions={
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs transition-colors cursor-pointer gap-2"
                    >
                        <Plus size={16} />
                        New Task
                    </Button>
                }
            />

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto scrollbar-none">
                    {(["all", "today", "upcoming", "overdue", "completed"] as const).map((tab) => {
                        const count = tasks.filter((t) =>
                            tab === "all"
                                ? true
                                : tab === "completed"
                                ? t.status === "completed"
                                : t.category === tab && t.status !== "completed"
                        ).length;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                                    activeTab === tab
                                        ? "bg-white text-slate-900 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {tab} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full md:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search tasks or contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-slate-200 text-xs font-semibold"
                    />
                </div>
            </div>

            {/* Tasks List */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <CheckSquare className="mx-auto h-10 w-10 text-slate-300" />
                        <h3 className="text-sm font-bold text-slate-900">No tasks found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            No follow-up items under this filter. Create one to organize customer touchpoints.
                        </p>
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const isDone = task.status === "completed";
                        return (
                            <div
                                key={task.id}
                                className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors ${
                                    isDone ? "opacity-60 bg-slate-50/40" : ""
                                }`}
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <button
                                        onClick={() => handleToggleTask(task.id)}
                                        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                            isDone
                                                ? "bg-[#35877D] border-[#35877D] text-white"
                                                : "border-slate-300 hover:border-[#35877D] bg-white"
                                        }`}
                                    >
                                        {isDone && <CheckCircle2 size={14} className="stroke-[3]" />}
                                    </button>

                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`text-sm font-bold text-slate-900 ${
                                                    isDone ? "line-through text-slate-500" : ""
                                                }`}
                                            >
                                                {task.title}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    task.priority === "high"
                                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                        : task.priority === "medium"
                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {task.priority}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>

                                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1 flex-wrap">
                                            <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                                <UserCheck size={12} className="text-[#35877D]" />
                                                {task.assignedTo}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {task.dueDate}
                                            </span>
                                            {task.relatedContact && (
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <MessageSquare size={12} />
                                                    {task.relatedContact}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </Card>

            {/* Dialog for New Task */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border border-slate-200">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <CheckSquare size={18} className="text-[#35877D]" />
                            Create Workspace Follow-up Task
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Schedule a customer action item or team assignment.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Task Title</Label>
                            <Input
                                required
                                placeholder="e.g. Follow up on WhatsApp quotation"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Details</Label>
                            <Textarea
                                rows={2}
                                placeholder="Add specifics or context..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-xl border-slate-200 text-xs font-semibold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Due Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Priority</Label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                                >
                                    <option value="high">High Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="low">Low Priority</option>
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-9"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl h-9 px-4 shadow-xs"
                            >
                                Create Task
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
