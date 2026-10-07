"use client";

import { useState } from "react";
import { useGetAnalyticsSummary, useGetMessageStats, useGetTopIntents } from "@workspace/api-client-react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const INTENT_COLORS = ["#2F8F83", "#45A79B", "#68BFB5", "#8FD5CD", "#236C63", "#3B82F6", "#6366F1", "#8B5CF6"];

const INTENT_LABELS: Record<string, string> = {
  price: "Price Inquiry",
  delivery: "Delivery",
  dealer: "Dealer/Agency",
  order: "Order",
  "ai-fallback": "AI Handled",
  unknown: "Unknown",
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const { data: summary, isLoading: isLoadingSummary } = useGetAnalyticsSummary();
  const { data: stats, isLoading: isLoadingStats } = useGetMessageStats(
    { period },
    { query: { queryKey: ["getMessageStats", period] } }
  );
  const { data: intents, isLoading: isLoadingIntents } = useGetTopIntents();

  const chartData = stats?.map((s) => ({
    name: period === "daily"
      ? new Date(s.period).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      : s.period,
    Inbound: s.inbound,
    Outbound: s.outbound,
    Total: s.count,
  })) ?? [];

  const pieData = intents?.map((i) => ({
    name: INTENT_LABELS[i.intent] ?? i.intent,
    value: i.count,
  })) ?? [];

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Message trends, lead pipeline, and customer engagement metrics."
        breadcrumbs={[{ label: "Analytics" }]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-slate-100" />)
        ) : (
          <>
            <SummaryCard label="Total Messages" value={summary?.totalMessages ?? 0} sub={`${summary?.totalInbound ?? 0} in / ${summary?.totalOutbound ?? 0} out`} />
            <SummaryCard label="Total Customers" value={summary?.totalCustomers ?? 0} sub={`+${summary?.newCustomersToday ?? 0} today`} />
            <SummaryCard label="Total Leads" value={summary?.totalLeads ?? 0} sub={`+${summary?.newLeadsToday ?? 0} today`} />
            <SummaryCard label="Response Rate" value={summary?.totalInbound ? Math.round((summary.totalOutbound / summary.totalInbound) * 100) : 0} sub="% messages auto-replied" suffix="%" />
          </>
        )}
      </div>

      <Card className="border border-[#E5E9EE] bg-white shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#E5E9EE] pb-4">
          <CardTitle className="text-base font-semibold text-[#172033]">Message Volume</CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as "daily" | "monthly")}>
            <SelectTrigger className="w-32 h-9 text-xs border-[#E5E9EE] text-[#172033]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily" className="text-xs">Daily</SelectItem>
              <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingStats ? (
            <Skeleton className="h-64 w-full bg-slate-100" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[#5F6B7A] text-xs">
              No message data yet. Data appears once customers start messaging.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5F6B7A" }} stroke="#E5E9EE" />
                <YAxis tick={{ fontSize: 12, fill: "#5F6B7A" }} stroke="#E5E9EE" />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E9EE",
                    borderRadius: "10px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="Inbound" fill="#2F8F83" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outbound" fill="#8FD5CD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border border-[#E5E9EE] bg-white shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E5E9EE] pb-4">
          <CardTitle className="text-base font-semibold text-[#172033]">Message Intent Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingIntents ? (
            <Skeleton className="h-64 w-full bg-slate-100" />
          ) : !pieData.length ? (
            <div className="h-64 flex items-center justify-center text-[#5F6B7A] text-xs">
              No intent data yet.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={INTENT_COLORS[index % INTENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E9EE",
                      borderRadius: "10px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 min-w-48">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: INTENT_COLORS[i % INTENT_COLORS.length] }}
                    />
                    <span className="text-[#172033] font-medium">{entry.name}</span>
                    <span className="ml-auto font-semibold text-[#5F6B7A]">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label, value, sub, suffix = "",
}: { label: string; value: number; sub: string; suffix?: string }) {
  return (
    <Card className="border border-[#E5E9EE] bg-white shadow-2xs rounded-xl">
      <CardContent className="p-5">
        <div className="text-2xl font-bold text-[#172033]">{value}{suffix}</div>
        <div className="text-xs font-semibold text-[#5F6B7A] mt-1">{label}</div>
        <div className="text-[11px] text-[#8A95A3] mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}
