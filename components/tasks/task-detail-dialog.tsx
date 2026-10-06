"use client";

import React from "react";
import {
    CheckSquare,
    Clock,
    UserCheck,
    MessageSquare,
    GitBranch,
    Calendar,
    CheckCircle2,
    RotateCcw,
    Edit3,
    Trash2,
    Phone,
    MapPin,
    AlertCircle,
    ArrowUpRight,
    Send
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
import Link from "next/link";

interface TaskDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: any | null;
    onToggleComplete: (task: any) => void;
    onEdit: (task: any) => void;
    onDelete: (id: string | number, title: string) => void;
}

export function TaskDetailDialog({
    open,
    onOpenChange,
    task,
    onToggleComplete,
    onEdit,
    onDelete
}: TaskDetailDialogProps) {
    if (!task) return null;

    const isCompleted = task.status === "completed";
    const isOverdue =
        !isCompleted &&
        task.due_at &&
        new Date(task.due_at).getTime() < Date.now();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white border border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    isCompleted
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : isOverdue
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : "bg-teal-50 text-[#35877D] border border-teal-100"
                                }`}
                            >
                                {isCompleted ? "Completed" : isOverdue ? "Overdue" : task.status || "Open"}
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
                                {task.priority} Priority
                            </span>
                            {task.task_type && (
                                <span className="text-[10px] font-bold text-slate-400 capitalize">
                                    • {task.task_type.replace("_", " ")}
                                </span>
                            )}
                        </div>
                    </div>

                    <DialogTitle className="text-base font-bold text-slate-900 pt-2">
                        <span className={isCompleted ? "line-through text-slate-500" : ""}>
                            {task.title}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                    {/* Description */}
                    {task.description && (
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Details & Context
                            </h4>
                            <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {task.description}
                            </p>
                        </div>
                    )}

                    {/* Schedule & Timing */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                <Clock size={11} /> Due Date
                            </span>
                            <p className={`font-bold ${isOverdue ? "text-rose-600" : "text-slate-800"}`}>
                                {task.due_at
                                    ? new Date(task.due_at).toLocaleString()
                                    : "No deadline specified"}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                <UserCheck size={11} /> Assignee
                            </span>
                            <p className="font-bold text-slate-800">
                                {task.assignee?.name || task.assignedTo || "Unassigned"}
                            </p>
                            {task.assignee?.email && (
                                <p className="text-[10px] text-slate-400">{task.assignee.email}</p>
                            )}
                        </div>
                    </div>

                    {/* Related Contact */}
                    {task.contact && (
                        <div className="p-3 rounded-xl border border-teal-100 bg-teal-50/40 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-[#35877D] flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <MessageSquare size={11} /> Linked Contact
                                </span>
                                {task.contact.stage && (
                                    <span className="px-1.5 py-0.2 rounded bg-white text-slate-700 uppercase font-mono text-[9px] border border-teal-200">
                                        {task.contact.stage}
                                    </span>
                                )}
                            </span>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-900 text-xs">{task.contact.name}</p>
                                    <p className="text-slate-500 font-mono text-[11px]">{task.contact.phone}</p>
                                </div>
                                <Link
                                    href={`/conversations?contact_id=${task.contact.id}`}
                                    className="px-2.5 py-1 text-[11px] font-bold text-[#35877D] hover:bg-teal-100/60 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    Chat <ArrowUpRight size={11} />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Related Lead */}
                    {task.lead && (
                        <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-purple-700 flex items-center gap-1">
                                <GitBranch size={11} /> Linked Deal / Lead
                            </span>
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-900 text-xs">{task.lead.customer_name}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-purple-700 border border-purple-200 uppercase">
                                    {task.lead.status}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Completion Info if Done */}
                    {isCompleted && task.completed_at && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>
                                Completed on {new Date(task.completed_at).toLocaleString()}
                                {task.completedByUser?.name && ` by ${task.completedByUser.name}`}
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(task.id, task.title)}
                        className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 h-9 font-bold text-xs gap-1 cursor-pointer"
                    >
                        <Trash2 size={13} />
                        Delete
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(task)}
                            className="rounded-xl border-slate-200 text-slate-700 h-9 font-bold text-xs gap-1 cursor-pointer"
                        >
                            <Edit3 size={13} />
                            Edit
                        </Button>
                        <Button
                            type="button"
                            onClick={() => onToggleComplete(task)}
                            className={`font-bold text-xs rounded-xl h-9 px-4 gap-1.5 cursor-pointer text-white ${
                                isCompleted
                                    ? "bg-slate-700 hover:bg-slate-800"
                                    : "bg-[#35877D] hover:bg-[#2c6e66]"
                            }`}
                        >
                            {isCompleted ? (
                                <>
                                    <RotateCcw size={13} />
                                    Reopen Task
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={13} />
                                    Mark Completed
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
