"use client";

import { useEffect, useState } from "react";
import {
    useBusinessHoursConfig,
    useUpdateBusinessHoursConfig,
    useBusinessHoursStatus,
    useTestBusinessHoursSimulation,
    BusinessHoursDaySchedule,
    BusinessHoursWeeklySchedule,
    BusinessHoursHoliday,
    BusinessHoursSimulationResult,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import {
    Clock,
    Calendar,
    Globe,
    MessageSquare,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Plus,
    Trash2,
    Sparkles,
    Send,
    Play,
    Timer,
    Info,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const DAYS_OF_WEEK: Array<{ key: keyof BusinessHoursWeeklySchedule; label: string }> = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
];

const COMMON_TIMEZONES = [
    { value: "Asia/Kolkata", label: "Asia/Kolkata (IST - UTC+05:30)" },
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "America/New_York (EST/EDT - UTC-05:00)" },
    { value: "America/Chicago", label: "America/Chicago (CST/CDT - UTC-06:00)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT - UTC-08:00)" },
    { value: "Europe/London", label: "Europe/London (GMT/BST - UTC+00:00)" },
    { value: "Europe/Paris", label: "Europe/Paris (CET/CEST - UTC+01:00)" },
    { value: "Asia/Dubai", label: "Asia/Dubai (GST - UTC+04:00)" },
    { value: "Asia/Singapore", label: "Asia/Singapore (SGT - UTC+08:00)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (JST - UTC+09:00)" },
    { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT - UTC+10:00)" },
];

const DEFAULT_SCHEDULE: BusinessHoursWeeklySchedule = {
    monday: { is_open: true, open: "09:00", close: "18:00" },
    tuesday: { is_open: true, open: "09:00", close: "18:00" },
    wednesday: { is_open: true, open: "09:00", close: "18:00" },
    thursday: { is_open: true, open: "09:00", close: "18:00" },
    friday: { is_open: true, open: "09:00", close: "18:00" },
    saturday: { is_open: false, open: "09:00", close: "18:00" },
    sunday: { is_open: false, open: "09:00", close: "18:00" },
};

export default function BusinessHoursPage() {
    const { toast } = useToast();
    const { data: configData, isLoading } = useBusinessHoursConfig();
    const { data: statusData, refetch: refetchStatus } = useBusinessHoursStatus();
    const updateMutation = useUpdateBusinessHoursConfig();
    const simulateMutation = useTestBusinessHoursSimulation();

    // Form State
    const [isEnabled, setIsEnabled] = useState(true);
    const [timezone, setTimezone] = useState("Asia/Kolkata");
    const [schedule, setSchedule] = useState<BusinessHoursWeeklySchedule>(DEFAULT_SCHEDULE);
    const [holidays, setHolidays] = useState<BusinessHoursHoliday[]>([]);
    const [outsideAction, setOutsideAction] = useState<"auto_reply" | "none">("auto_reply");
    const [outsideMessage, setOutsideMessage] = useState("");
    const [cooldownMinutes, setCooldownMinutes] = useState(1440);

    // Holiday Input State
    const [newHolidayDate, setNewHolidayDate] = useState("");
    const [newHolidayName, setNewHolidayName] = useState("");

    // Simulation State
    const [simDatetime, setSimDatetime] = useState("");
    const [simulationResult, setSimulationResult] = useState<BusinessHoursSimulationResult | null>(null);

    // Populate from fetched config
    useEffect(() => {
        if (configData?.config) {
            const cfg = configData.config;
            setIsEnabled(cfg.is_enabled ?? true);
            setTimezone(cfg.timezone || "Asia/Kolkata");
            setSchedule(cfg.weekly_schedule ? { ...DEFAULT_SCHEDULE, ...cfg.weekly_schedule } : DEFAULT_SCHEDULE);
            setHolidays(cfg.holidays || []);
            setOutsideAction(cfg.outside_hours_action || "auto_reply");
            setOutsideMessage(cfg.outside_hours_message || "");
            setCooldownMinutes(cfg.cooldown_minutes ?? 1440);
        }
    }, [configData]);

    const handleDayToggle = (day: keyof BusinessHoursWeeklySchedule, isOpen: boolean) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                is_open: isOpen,
            },
        }));
    };

    const handleTimeChange = (
        day: keyof BusinessHoursWeeklySchedule,
        field: "open" | "close",
        value: string
    ) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value,
            },
        }));
    };

    const applyPreset = (preset: "standard" | "always_open" | "mon_sat") => {
        if (preset === "standard") {
            setSchedule(DEFAULT_SCHEDULE);
            toast({ title: "Preset Applied", description: "Set schedule to Monday - Friday (9:00 AM - 6:00 PM)." });
        } else if (preset === "always_open") {
            const always: BusinessHoursWeeklySchedule = {
                monday: { is_open: true, open: "00:00", close: "23:59" },
                tuesday: { is_open: true, open: "00:00", close: "23:59" },
                wednesday: { is_open: true, open: "00:00", close: "23:59" },
                thursday: { is_open: true, open: "00:00", close: "23:59" },
                friday: { is_open: true, open: "00:00", close: "23:59" },
                saturday: { is_open: true, open: "00:00", close: "23:59" },
                sunday: { is_open: true, open: "00:00", close: "23:59" },
            };
            setSchedule(always);
            toast({ title: "Preset Applied", description: "Set schedule to 24/7 Open every day." });
        } else if (preset === "mon_sat") {
            const monSat: BusinessHoursWeeklySchedule = {
                monday: { is_open: true, open: "09:00", close: "19:00" },
                tuesday: { is_open: true, open: "09:00", close: "19:00" },
                wednesday: { is_open: true, open: "09:00", close: "19:00" },
                thursday: { is_open: true, open: "09:00", close: "19:00" },
                friday: { is_open: true, open: "09:00", close: "19:00" },
                saturday: { is_open: true, open: "09:00", close: "17:00" },
                sunday: { is_open: false, open: "09:00", close: "18:00" },
            };
            setSchedule(monSat);
            toast({ title: "Preset Applied", description: "Set schedule to Monday - Saturday." });
        }
    };

    const handleAddHoliday = () => {
        if (!newHolidayDate || !newHolidayName.trim()) {
            toast({
                title: "Invalid Holiday",
                description: "Please specify both a date and holiday name.",
                variant: "destructive",
            });
            return;
        }

        // Avoid duplicate dates
        if (holidays.some((h) => h.date === newHolidayDate)) {
            toast({
                title: "Date already exists",
                description: "A holiday is already configured for this date.",
                variant: "destructive",
            });
            return;
        }

        setHolidays((prev) => [...prev, { date: newHolidayDate, name: newHolidayName.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
        setNewHolidayDate("");
        setNewHolidayName("");
        toast({ title: "Holiday Added", description: `Added "${newHolidayName.trim()}".` });
    };

    const handleRemoveHoliday = (date: string) => {
        setHolidays((prev) => prev.filter((h) => h.date !== date));
    };

    const handleSave = () => {
        updateMutation.mutate(
            {
                is_enabled: isEnabled,
                timezone,
                weekly_schedule: schedule,
                holidays,
                outside_hours_action: outsideAction,
                outside_hours_message: outsideMessage,
                cooldown_minutes: Number(cooldownMinutes),
            },
            {
                onSuccess: () => {
                    refetchStatus();
                    toast({
                        title: "Business Hours Saved",
                        description: "Your working hours, holidays, and auto-reply rules were successfully updated.",
                    });
                },
                onError: (err: any) => {
                    toast({
                        title: "Error saving configuration",
                        description: err?.message || "An unexpected error occurred.",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    const handleRunSimulation = () => {
        simulateMutation.mutate(
            { datetime: simDatetime || undefined },
            {
                onSuccess: (data) => {
                    setSimulationResult(data.simulation);
                },
                onError: (err: any) => {
                    toast({
                        title: "Simulation failed",
                        description: err?.message || "Invalid datetime parameter.",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    const currentStatus = statusData?.status || configData?.status;

    return (
        <div className="space-y-6 w-full max-w-6xl pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href="/settings"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Settings
                        </Link>
                    </div>
                    <PageHeader
                        title="Business Hours & Out-of-Office"
                        description="Configure your operating schedule, regional holidays, and automated WhatsApp replies for after-hours customer inquiries."
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || isLoading}
                        data-testid="button-save-business-hours"
                        className="bg-[#2F8F83] hover:bg-[#267A70] text-white font-medium px-5 h-10 shadow-sm rounded-lg cursor-pointer"
                    >
                        {updateMutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Save Changes
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Live Operational Status Banner */}
            <Card className="border border-[#E5E9EE] shadow-sm rounded-xl overflow-hidden bg-gradient-to-r from-white via-slate-50/50 to-emerald-50/20">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs transition-colors ${
                                currentStatus?.is_open
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                    : currentStatus?.status === "holiday"
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                    : "bg-amber-50 border-amber-200 text-amber-600"
                            }`}
                        >
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Current Status
                                </span>
                                {currentStatus?.is_open ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Open for Business
                                    </span>
                                ) : currentStatus?.status === "holiday" ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        Holiday Closure
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        Closed (Outside Hours)
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-[#172033] mt-0.5">
                                {currentStatus?.reason || "Loading workspace status..."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                        <div>
                            <span className="block font-medium text-slate-700">Workspace Clock</span>
                            <span className="font-mono text-slate-900 font-semibold">
                                {currentStatus?.current_time ? currentStatus.current_time.slice(11, 16) : "--:--"}
                            </span>
                        </div>
                        <div>
                            <span className="block font-medium text-slate-700">Timezone</span>
                            <span className="text-slate-900 font-semibold">{timezone}</span>
                        </div>
                        {currentStatus?.next_open_at && (
                            <div>
                                <span className="block font-medium text-slate-700">Next Opening</span>
                                <span className="text-slate-900 font-semibold">
                                    {currentStatus.next_open_at.slice(5, 16)}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Main Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Schedule & Holidays */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General & Timezone Card */}
                    <Card className="border border-[#E5E9EE] shadow-sm rounded-xl">
                        <CardHeader className="pb-3 border-b border-[#F0F3F6]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-[#2F8F83]" />
                                        Workspace Timezone & Control
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                        Define your primary business location and automation toggle.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="master-toggle" className="text-xs font-medium text-[#172033]">
                                        {isEnabled ? "Enabled" : "Disabled"}
                                    </Label>
                                    <Switch
                                        id="master-toggle"
                                        checked={isEnabled}
                                        onCheckedChange={setIsEnabled}
                                        className="data-[state=checked]:bg-[#2F8F83]"
                                        data-testid="switch-business-hours-enabled"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <Label className="text-xs font-semibold text-[#172033] mb-1.5 block">
                                    Primary Operating Timezone
                                </Label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-lg border border-[#E5E9EE] bg-white focus:outline-none focus:ring-1 focus:ring-[#2F8F83] focus:border-[#2F8F83]"
                                    data-testid="select-timezone"
                                >
                                    {COMMON_TIMEZONES.map((tz) => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    All customer hours evaluation, out-of-office triggers, and shift schedules will operate relative to this timezone.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Schedule Card */}
                    <Card className="border border-[#E5E9EE] shadow-sm rounded-xl">
                        <CardHeader className="pb-3 border-b border-[#F0F3F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#2F8F83]" />
                                    Weekly Operating Hours
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Set the open and closing times for each day of the week.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyPreset("standard")}
                                    className="h-7 text-[11px] px-2.5 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer"
                                >
                                    Mon-Fri (9-6)
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyPreset("mon_sat")}
                                    className="h-7 text-[11px] px-2.5 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer"
                                >
                                    Mon-Sat (9-7)
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyPreset("always_open")}
                                    className="h-7 text-[11px] px-2.5 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer"
                                >
                                    24/7 All Days
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 divide-y divide-slate-100">
                            {DAYS_OF_WEEK.map(({ key, label }) => {
                                const dayConfig = schedule[key] || { is_open: false, open: "09:00", close: "18:00" };
                                return (
                                    <div
                                        key={key}
                                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 w-32">
                                            <Switch
                                                checked={dayConfig.is_open}
                                                onCheckedChange={(checked) => handleDayToggle(key, checked)}
                                                className="data-[state=checked]:bg-[#2F8F83]"
                                                data-testid={`switch-day-${key}`}
                                            />
                                            <span
                                                className={`text-xs font-semibold ${
                                                    dayConfig.is_open ? "text-[#172033]" : "text-muted-foreground"
                                                }`}
                                            >
                                                {label}
                                            </span>
                                        </div>

                                        {dayConfig.is_open ? (
                                            <div className="flex items-center gap-2 flex-1 sm:justify-end">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-muted-foreground">Open</span>
                                                    <Input
                                                        type="time"
                                                        value={dayConfig.open}
                                                        onChange={(e) => handleTimeChange(key, "open", e.target.value)}
                                                        className="h-8 w-28 text-xs font-mono rounded-md border-slate-200"
                                                        data-testid={`input-open-${key}`}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground font-semibold px-1">
                                                    to
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-muted-foreground">Close</span>
                                                    <Input
                                                        type="time"
                                                        value={dayConfig.close}
                                                        onChange={(e) => handleTimeChange(key, "close", e.target.value)}
                                                        className="h-8 w-28 text-xs font-mono rounded-md border-slate-200"
                                                        data-testid={`input-close-${key}`}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center sm:justify-end flex-1">
                                                <span className="text-xs text-muted-foreground italic bg-slate-50 border border-slate-200 px-3 py-1 rounded-md">
                                                    Closed all day
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Holidays List Card */}
                    <Card className="border border-[#E5E9EE] shadow-sm rounded-xl">
                        <CardHeader className="pb-3 border-b border-[#F0F3F6]">
                            <CardTitle className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#2F8F83]" />
                                Holidays & Special Closures
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Add regional holidays or planned company closures where out-of-office replies should trigger all day.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* Add Holiday Bar */}
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <Input
                                    type="date"
                                    value={newHolidayDate}
                                    onChange={(e) => setNewHolidayDate(e.target.value)}
                                    className="h-9 w-full sm:w-44 text-xs font-mono bg-white rounded-md border-slate-200"
                                    data-testid="input-holiday-date"
                                />
                                <Input
                                    type="text"
                                    placeholder="Holiday name (e.g., Christmas Day, Diwali)"
                                    value={newHolidayName}
                                    onChange={(e) => setNewHolidayName(e.target.value)}
                                    className="h-9 flex-1 text-xs bg-white rounded-md border-slate-200"
                                    data-testid="input-holiday-name"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleAddHoliday}
                                    className="h-9 px-4 text-xs font-medium bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-md w-full sm:w-auto cursor-pointer"
                                    data-testid="button-add-holiday"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add Holiday
                                </Button>
                            </div>

                            {/* Holiday List */}
                            {holidays.length === 0 ? (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    No holidays configured yet. Add upcoming company holidays above.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {holidays.map((h) => (
                                        <div
                                            key={h.date}
                                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                                                    {h.date}
                                                </span>
                                                <span className="text-xs font-medium text-[#172033]">{h.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveHoliday(h.date)}
                                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                                title="Delete Holiday"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right 1 Col: Out-of-Office Response & Simulator */}
                <div className="space-y-6">
                    {/* Out of Office Auto-Reply Card */}
                    <Card className="border border-[#E5E9EE] shadow-sm rounded-xl">
                        <CardHeader className="pb-3 border-b border-[#F0F3F6]">
                            <CardTitle className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[#2F8F83]" />
                                Outside-Hours Auto-Reply
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Automated response sent to customers who message outside business hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* Action selector */}
                            <div>
                                <Label className="text-xs font-semibold text-[#172033] mb-1.5 block">
                                    After-Hours Action
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOutsideAction("auto_reply")}
                                        className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                                            outsideAction === "auto_reply"
                                                ? "bg-emerald-50 border-[#2F8F83] text-[#2F8F83] font-semibold"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        Send Auto-Reply
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOutsideAction("none")}
                                        className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                                            outsideAction === "none"
                                                ? "bg-slate-100 border-slate-400 text-slate-900 font-semibold"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        Do Nothing
                                    </button>
                                </div>
                            </div>

                            {/* Message Textarea */}
                            {outsideAction === "auto_reply" && (
                                <>
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <Label className="text-xs font-semibold text-[#172033]">
                                                Response Message
                                            </Label>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {outsideMessage.length} / 1000
                                            </span>
                                        </div>
                                        <Textarea
                                            rows={5}
                                            value={outsideMessage}
                                            onChange={(e) => setOutsideMessage(e.target.value)}
                                            placeholder="Thank you for contacting us! We are currently closed..."
                                            className="text-xs rounded-lg border-slate-200 focus-visible:ring-1 focus-visible:ring-[#2F8F83]"
                                            data-testid="textarea-outside-message"
                                        />
                                    </div>

                                    {/* Cooldown configuration */}
                                    <div>
                                        <Label className="text-xs font-semibold text-[#172033] flex items-center gap-1.5 mb-1.5">
                                            <Timer className="w-3.5 h-3.5 text-[#2F8F83]" />
                                            Reply Cooldown Window
                                        </Label>
                                        <select
                                            value={cooldownMinutes}
                                            onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                                            className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E9EE] bg-white focus:outline-none focus:ring-1 focus:ring-[#2F8F83]"
                                            data-testid="select-cooldown"
                                        >
                                            <option value={1440}>24 Hours (1440 mins) — Recommended</option>
                                            <option value={720}>12 Hours (720 mins)</option>
                                            <option value={240}>4 Hours (240 mins)</option>
                                            <option value={60}>1 Hour (60 mins)</option>
                                            <option value={0}>No cooldown (reply every message)</option>
                                        </select>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Prevents spamming the customer if they send multiple WhatsApp messages while you are closed.
                                        </p>
                                    </div>

                                    {/* Unified Automations notice */}
                                    <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-100 flex items-start gap-2.5">
                                        <Info className="w-4 h-4 text-[#2F8F83] shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-teal-900 leading-relaxed">
                                            <strong>Unified Automations Engine:</strong> Outside-hours replies reuse your central automations system, log under rule triggers, and record timeline events automatically.
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Real-Time Simulation Studio Card */}
                    <Card className="border border-[#E5E9EE] shadow-sm rounded-xl">
                        <CardHeader className="pb-3 border-b border-[#F0F3F6]">
                            <CardTitle className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                                <Play className="w-4 h-4 text-[#2F8F83]" />
                                Schedule Simulator
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Test how your engine will evaluate any date and time.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <Label className="text-xs font-semibold text-[#172033] mb-1.5 block">
                                    Simulate Date & Time (Optional)
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={simDatetime}
                                    onChange={(e) => setSimDatetime(e.target.value)}
                                    className="h-9 text-xs font-mono rounded-md border-slate-200"
                                    data-testid="input-sim-datetime"
                                />
                                <span className="text-[10px] text-muted-foreground block mt-1">
                                    Leave blank to test with current live workspace time.
                                </span>
                            </div>

                            <Button
                                size="sm"
                                onClick={handleRunSimulation}
                                disabled={simulateMutation.isPending}
                                className="w-full h-9 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md cursor-pointer"
                                data-testid="button-run-simulation"
                            >
                                {simulateMutation.isPending ? "Evaluating..." : "Run Simulation"}
                            </Button>

                            {simulationResult && (
                                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-700">Evaluation:</span>
                                        <span
                                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                                                simulationResult.is_open
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-amber-100 text-amber-800"
                                            }`}
                                        >
                                            {simulationResult.is_open ? "OPEN" : "CLOSED"}
                                        </span>
                                    </div>
                                    <div className="text-slate-600 font-medium">
                                        {simulationResult.reason}
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                                        <span className="text-slate-500">Auto-Reply Triggered:</span>
                                        <span className="font-semibold text-slate-800">
                                            {simulationResult.would_reply ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    {simulationResult.would_reply && simulationResult.reply_message && (
                                        <div className="mt-2 p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700 italic">
                                            "{simulationResult.reply_message}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
