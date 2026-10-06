"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
    CheckSquare,
    Plus,
    Search,
    Calendar,
    UserCheck,
    Clock,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Filter,
    Edit3,
    Trash2,
    GitBranch,
    RefreshCw,
    RotateCcw
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { TaskListSkeleton } from "@/components/tasks/task-skeleton";

interface TaskItem {
    id: number | string;
    title: string;
    description?: string;
    priority: "urgent" | "high" | "medium" | "low";
    status: "open" | "in_progress" | "completed" | "cancelled";
    task_type?: string;
    source?: string;
    due_at?: string;
    completed_at?: string;
    assigned_to?: number;
    assignee?: { id: number; name: string; email: string };
    contact?: { id: number; name: string; phone: string; stage?: string };
    lead?: { id: number; customer_name: string; phone?: string; status?: string };
    created_at?: string;
}

interface SummaryCounts {
    all: number;
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
}

function TasksContent() {
    const { token } = useAuth();
    const searchParams = useSearchParams();

    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [summary, setSummary] = useState<SummaryCounts>({
        all: 0,
        today: 0,
        upcoming: 0,
        overdue: 0,
        completed: 0
    });
    const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming" | "overdue" | "completed">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
    const [inspectingTask, setInspectingTask] = useState<TaskItem | null>(null);

    // Initial pre-fill from query params (e.g. from Quick Create or Contact CRM)
    const initialContactId = searchParams.get("contact_id") ? parseInt(searchParams.get("contact_id")!) : null;
    const initialContactName = searchParams.get("contact_name") || null;
    const initialLeadId = searchParams.get("lead_id") ? parseInt(searchParams.get("lead_id")!) : null;
    const initialLeadName = searchParams.get("lead_name") || null;

    useEffect(() => {
        if (searchParams.get("action") === "new") {
            setIsCreateModalOpen(true);
        }
    }, [searchParams]);

    // Fetch tasks from real backend API
    const fetchTasks = useCallback(async (isBackground = false) => {
        if (!token) return;
        if (!isBackground) setIsLoading(true);

        try {
            const params = new URLSearchParams({
                tab: activeTab,
                page: String(page),
                per_page: "25",
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
            });

            if (searchQuery.trim()) params.append("search", searchQuery.trim());
            if (priorityFilter !== "all") params.append("priority", priorityFilter);

            const res = await fetch(`/api/tasks?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.status) {
                setTasks(data.data || []);
                if (data.summary) {
                    setSummary(data.summary);
                }
                if (data.pagination) {
                    setTotalPages(data.pagination.last_page || 1);
                }
            }
        } catch (err) {
            console.error("Error loading tasks:", err);
            toast.error("Unable to load tasks from server");
        } finally {
            setIsLoading(false);
        }
    }, [token, activeTab, searchQuery, priorityFilter, page]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Format humanized due date matching screenshot style
    const formatDueDisplay = (task: TaskItem) => {
        if (!task.due_at) return "No deadline";

        const due = new Date(task.due_at);
        const now = new Date();
        const isDone = task.status === "completed";

        // Check if today
        const isToday =
            due.getDate() === now.getDate() &&
            due.getMonth() === now.getMonth() &&
            due.getFullYear() === now.getFullYear();

        // Check if tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow =
            due.getDate() === tomorrow.getDate() &&
            due.getMonth() === tomorrow.getMonth() &&
            due.getFullYear() === tomorrow.getFullYear();

        // Check if yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday =
            due.getDate() === yesterday.getDate() &&
            due.getMonth() === yesterday.getMonth() &&
            due.getFullYear() === yesterday.getFullYear();

        const timeStr = due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

        if (isToday) return `Today, ${timeStr}`;
        if (isTomorrow) return `Tomorrow, ${timeStr}`;
        if (isYesterday) return `Yesterday, ${timeStr}`;

        const diffDays = Math.round((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 0 && diffDays <= 7) return `${diffDays} days ago`;

        return `${due.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    };

    // Optimistic complete / reopen toggle
    const handleToggleTask = async (task: TaskItem) => {
        const isCurrentlyCompleted = task.status === "completed";
        const newStatus = isCurrentlyCompleted ? "open" : "completed";

        // Optimistic UI update
        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );

        setSummary((prev) => ({
            ...prev,
            completed: isCurrentlyCompleted ? Math.max(0, prev.completed - 1) : prev.completed + 1
        }));

        try {
            const endpoint = isCurrentlyCompleted
                ? `/api/tasks/${task.id}/reopen`
                : `/api/tasks/${task.id}/complete`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.status) {
                toast.success(
                    isCurrentlyCompleted ? "Task reopened" : "Task marked as completed!"
                );
            } else {
                // Rollback
                setTasks((prev) =>
                    prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
                );
                toast.error(data.message || "Failed to update task");
            }
        } catch {
            // Rollback
            setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
            );
            toast.error("Network error updating task");
        }
    };

    const handleDeleteTask = async (id: number | string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                setTasks((prev) => prev.filter((t) => t.id !== id));
                if (inspectingTask?.id === id) setInspectingTask(null);
                toast.success("Task deleted successfully");
                fetchTasks(true);
            } else {
                toast.error(data.message || "Failed to delete task");
            }
        } catch {
            toast.error("Network error deleting task");
        }
    };

    const handleSaveSuccess = (savedTask: TaskItem) => {
        fetchTasks(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                icon={CheckSquare}
                title="Workspace Tasks & Follow-ups"
                description="Track sales follow-ups, customer service action items, and team assignments."
                breadcrumbs={[{ label: "Tasks" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTasks(false)}
                            className="rounded-xl border-slate-200 text-slate-700 h-9 px-3 cursor-pointer"
                            title="Refresh Tasks"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin text-[#35877D]" : ""} />
                        </Button>
                        <Button
                            onClick={() => {
                                setEditingTask(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs transition-colors cursor-pointer gap-2"
                        >
                            <Plus size={16} />
                            New Task
                        </Button>
                    </div>
                }
            />

            {/* Filter Tabs & Search Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto scrollbar-none">
                    {(["all", "today", "upcoming", "overdue", "completed"] as const).map((tab) => {
                        const count = summary[tab] ?? 0;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setPage(1);
                                }}
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

                {/* Search & Priority Filter */}
                <div className="flex items-center gap-2">
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#35877D]"
                    >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search tasks or contacts..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10 h-10 rounded-xl border-slate-200 text-xs font-semibold"
                        />
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            {isLoading && tasks.length === 0 ? (
                <TaskListSkeleton />
            ) : tasks.length === 0 ? (
                <Card className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-xs">
                    <CheckSquare className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="text-sm font-bold text-slate-900">
                        {activeTab === "all"
                            ? "No tasks yet"
                            : activeTab === "today"
                            ? "No tasks due today"
                            : activeTab === "overdue"
                            ? "You're all caught up!"
                            : activeTab === "completed"
                            ? "No completed tasks yet"
                            : "No upcoming tasks"}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {activeTab === "all"
                            ? "Create a task to keep your team on top of sales follow-ups and action items."
                            : "No follow-up items under this filter. Create one to organize customer touchpoints."}
                    </p>
                    <div className="pt-2">
                        <Button
                            onClick={() => {
                                setEditingTask(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5"
                        >
                            <Plus size={15} />
                            New Task
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
                    {tasks.map((task) => {
                        const isDone = task.status === "completed";
                        const isOverdue =
                            !isDone &&
                            task.due_at &&
                            new Date(task.due_at).getTime() < Date.now();

                        return (
                            <div
                                key={task.id}
                                className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors group cursor-pointer ${
                                    isDone ? "opacity-60 bg-slate-50/40" : ""
                                }`}
                                onClick={() => setInspectingTask(task)}
                            >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    {/* Completion Checkbox */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleTask(task);
                                        }}
                                        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                            isDone
                                                ? "bg-[#35877D] border-[#35877D] text-white"
                                                : "border-slate-300 hover:border-[#35877D] bg-white"
                                        }`}
                                        title={isDone ? "Mark Pending" : "Mark Completed"}
                                    >
                                        {isDone && <CheckCircle2 size={14} className="stroke-[3]" />}
                                    </button>

                                    {/* Task Information */}
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`text-sm font-bold text-slate-900 hover:text-[#35877D] transition-colors ${
                                                    isDone ? "line-through text-slate-500" : ""
                                                }`}
                                            >
                                                {task.title}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    task.priority === "high" || task.priority === "urgent"
                                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                        : task.priority === "medium"
                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {task.priority}
                                            </span>
                                        </div>

                                        {task.description && (
                                            <p className="text-xs text-slate-500 line-clamp-1">
                                                {task.description}
                                            </p>
                                        )}

                                        {/* Meta Items */}
                                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1 flex-wrap">
                                            <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                                <UserCheck size={12} className="text-[#35877D]" />
                                                {task.assignee?.name || "Unassigned"}
                                            </span>

                                            <span
                                                className={`flex items-center gap-1 font-semibold ${
                                                    isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                                                }`}
                                            >
                                                <Clock size={12} className={isOverdue ? "text-rose-500" : ""} />
                                                {formatDueDisplay(task)}
                                            </span>

                                            {task.contact && (
                                                <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                                    <MessageSquare size={12} className="text-[#35877D]" />
                                                    {task.contact.name}
                                                    {task.contact.phone && ` (${task.contact.phone})`}
                                                </span>
                                            )}

                                            {task.lead && (
                                                <span className="flex items-center gap-1 text-purple-700 font-semibold">
                                                    <GitBranch size={12} />
                                                    {task.lead.customer_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Action Buttons */}
                                <div
                                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingTask(task);
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Task"
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTask(task.id, task.title)}
                                        className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Task"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </Card>
            )}

            {/* Pagination if multiple pages */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 font-medium">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl border-slate-200 h-8 text-xs font-bold"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="rounded-xl border-slate-200 h-8 text-xs font-bold"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Create / Edit Task Modal */}
            <TaskModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                token={token}
                editingTask={editingTask}
                initialContactId={initialContactId}
                initialContactName={initialContactName}
                initialLeadId={initialLeadId}
                initialLeadName={initialLeadName}
                onSaveSuccess={handleSaveSuccess}
            />

            {/* Task Detail Dialog */}
            <TaskDetailDialog
                open={!!inspectingTask}
                onOpenChange={(open) => {
                    if (!open) setInspectingTask(null);
                }}
                task={inspectingTask}
                onToggleComplete={(t) => {
                    handleToggleTask(t);
                    setInspectingTask((prev) =>
                        prev ? { ...prev, status: prev.status === "completed" ? "open" : "completed" } : null
                    );
                }}
                onEdit={(t) => {
                    setInspectingTask(null);
                    setEditingTask(t);
                    setIsCreateModalOpen(true);
                }}
                onDelete={(id, title) => handleDeleteTask(id, title)}
            />
        </div>
    );
}

export default function TasksPage() {
    return (
        <Suspense fallback={<TaskListSkeleton />}>
            <TasksContent />
        </Suspense>
    );
}
