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

const INTENT_COLORS = ["#C57B2A", "#E09A45", "#F5B86C", "#F5D4A0", "#D4A060", "#B87333", "#8B5A2B", "#6B3A1F"];

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
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Message trends, lead pipeline, and customer engagement metrics."
        breadcrumbs={[{ label: "Analytics" }]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <SummaryCard label="Total Messages" value={summary?.totalMessages ?? 0} sub={`${summary?.totalInbound ?? 0} in / ${summary?.totalOutbound ?? 0} out`} />
            <SummaryCard label="Total Customers" value={summary?.totalCustomers ?? 0} sub={`+${summary?.newCustomersToday ?? 0} today`} />
            <SummaryCard label="Total Leads" value={summary?.totalLeads ?? 0} sub={`+${summary?.newLeadsToday ?? 0} today`} />
            <SummaryCard label="Response Rate" value={summary?.totalInbound ? Math.round((summary.totalOutbound / summary.totalInbound) * 100) : 0} sub="% messages auto-replied" suffix="%" />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Message Volume</CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as "daily" | "monthly")}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No message data yet. Data appears once customers start messaging.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="Inbound" fill="#C57B2A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Outbound" fill="#F5B86C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Intent Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingIntents ? (
            <Skeleton className="h-64 w-full" />
          ) : !pieData.length ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
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
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 min-w-48">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: INTENT_COLORS[i % INTENT_COLORS.length] }}
                    />
                    <span className="text-foreground">{entry.name}</span>
                    <span className="ml-auto font-semibold text-muted-foreground">{entry.value}</span>
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
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">{value}{suffix}</div>
        <div className="text-sm font-medium text-foreground mt-1">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}
