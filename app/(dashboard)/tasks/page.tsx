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

    // Create Task Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

    const handleToggleComplete = (taskId: string) => {
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === taskId) {
                    const nextStatus = t.status === "pending" ? "completed" : "pending";
                    toast.success(nextStatus === "completed" ? "Task completed!" : "Task reopened");
                    return {
                        ...t,
                        status: nextStatus,
                        category: nextStatus === "completed" ? "completed" : "today"
                    };
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <CheckSquare className="h-6 w-6 text-[#35877D]" />
                        Workspace Tasks & Follow-ups
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track sales follow-ups, customer service action items, and team assignments.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={16} />
                    New Task
                </button>
            </div>

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
                    <input
                        type="text"
                        placeholder="Search tasks or contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#35877D]"
                    />
                </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <CheckSquare className="mx-auto h-10 w-10 text-slate-300" />
                        <h3 className="text-sm font-bold text-slate-900">No tasks found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            All caught up! Create a new task or adjust your filters to view scheduled follow-ups.
                        </p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`p-4 transition-colors flex items-start gap-3.5 ${
                                task.status === "completed" ? "bg-slate-50/70" : "hover:bg-slate-50/50"
                            }`}
                        >
                            <button
                                onClick={() => handleToggleComplete(task.id)}
                                className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                    task.status === "completed"
                                        ? "bg-[#35877D] border-[#35877D] text-white"
                                        : "border-slate-300 hover:border-[#35877D] text-transparent"
                                }`}
                            >
                                <CheckCircle2 size={14} className="stroke-[3]" />
                            </button>

                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4
                                        className={`text-xs font-bold text-slate-900 ${
                                            task.status === "completed" ? "line-through text-slate-400" : ""
                                        }`}
                                    >
                                        {task.title}
                                    </h4>
                                    <span
                                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${
                                            task.priority === "high"
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : task.priority === "medium"
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}
                                    >
                                        {task.priority}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">{task.description}</p>

                                <div className="flex flex-wrap items-center gap-4 pt-1.5 text-[11px] text-slate-500">
                                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                                        <UserCheck size={13} className="text-[#35877D]" />
                                        {task.assignedTo}
                                    </div>
                                    <div className="flex items-center gap-1 font-semibold text-slate-600">
                                        <Clock size={13} className={task.category === "overdue" ? "text-rose-500" : ""} />
                                        {task.dueDate}
                                    </div>
                                    {task.relatedContact && (
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <MessageSquare size={13} className="text-slate-400" />
                                            {task.relatedContact}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 font-sans">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <CheckSquare size={18} className="text-[#35877D]" />
                                Create Follow-up Task
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Follow up on WhatsApp quotation"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Details</label>
                                <textarea
                                    rows={2}
                                    placeholder="Add specifics or context..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                                    <input
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#35877D]"
                                    >
                                        <option value="high">High Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="low">Low Priority</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
