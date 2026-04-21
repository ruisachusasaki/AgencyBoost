import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, AlertCircle, Clock, Timer, CalendarDays, Bug, Lightbulb, Wrench, AlertTriangle, ArrowUp, ArrowDown, Minus, CalendarIcon, Users, Trophy, User, TrendingUp, Activity, CircleDot } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from "recharts";

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  onHold: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

interface MonthlyTrendPoint {
  month: string;
  label: string;
  created: number;
  resolved: number;
}

interface MonthlyTrendResponse {
  months: MonthlyTrendPoint[];
}

const statusOrder: { key: keyof Pick<TicketSummary, "open" | "inProgress" | "onHold" | "resolved" | "closed">; label: string; color: string }[] = [
  { key: "open", label: "Open", color: "bg-amber-500" },
  { key: "inProgress", label: "In Progress", color: "bg-blue-500" },
  { key: "onHold", label: "On Hold", color: "bg-gray-400" },
  { key: "resolved", label: "Resolved", color: "bg-green-500" },
  { key: "closed", label: "Closed", color: "bg-slate-600" },
];

interface AgingBucket {
  label: string;
  count: number;
  minDays: number;
  maxDays: number;
}

interface AgingResponse {
  buckets: AgingBucket[];
}

interface ResponseTimeData {
  avgFirstResponseHours: number;
  avgResolutionHours: number;
  totalResolved: number;
  totalWithResponse: number;
}

interface UserTicketStats {
  userId: string;
  userName: string;
  totalHandled: number;
  totalResolved: number;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

interface UserBreakdownResponse {
  users: UserTicketStats[];
  topHandlers: { userId: string; userName: string; count: number }[];
}

function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "--";
  if (hours < 1) return "< 1 hour";
  if (hours > 24) return `${(hours / 24).toFixed(1)} days`;
  return `${hours.toFixed(1)} hours`;
}

const typeLabels: Record<string, string> = {
  bug: "Bug",
  feature_request: "Feature Request",
  improvement: "Improvement",
};

const typeColors: Record<string, string> = {
  bug: "bg-red-500",
  feature_request: "bg-purple-500",
  improvement: "bg-blue-500",
};

const typeIcons: Record<string, typeof Bug> = {
  bug: Bug,
  feature_request: Lightbulb,
  improvement: Wrench,
};

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const priorityIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
};

export default function TicketReports() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportView, setReportView] = useState<"overview" | "by-user">("overview");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const dateParams = `startDate=${startDate}&endDate=${endDate}`;

  const { data: summary, isLoading: summaryLoading } = useQuery<TicketSummary>({
    queryKey: ["/api/tickets/reports/summary", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/reports/summary?${dateParams}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: aging, isLoading: agingLoading } = useQuery<AgingResponse>({
    queryKey: ["/api/tickets/reports/aging"],
  });

  const { data: responseTime, isLoading: responseTimeLoading } = useQuery<ResponseTimeData>({
    queryKey: ["/api/tickets/reports/response-time", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/reports/response-time?${dateParams}`);
      if (!res.ok) throw new Error("Failed to fetch response time data");
      return res.json();
    },
  });

  const { data: userBreakdown, isLoading: userBreakdownLoading } = useQuery<UserBreakdownResponse>({
    queryKey: ["/api/tickets/reports/by-user", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/reports/by-user?${dateParams}`);
      if (!res.ok) throw new Error("Failed to fetch user breakdown");
      return res.json();
    },
  });

  const { data: monthlyTrend, isLoading: monthlyTrendLoading } = useQuery<MonthlyTrendResponse>({
    queryKey: ["/api/tickets/reports/monthly", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/reports/monthly?${dateParams}`);
      if (!res.ok) throw new Error("Failed to fetch monthly trend");
      return res.json();
    },
  });

  const statusEntries = summary
    ? statusOrder.map(s => ({ ...s, count: summary[s.key] || 0 }))
    : [];
  const maxStatusCount = statusEntries.length > 0
    ? Math.max(...statusEntries.map(s => s.count), 1)
    : 1;

  const selectedUserStats = selectedUserId !== "all" && userBreakdown?.users
    ? userBreakdown.users.find(u => u.userId === selectedUserId) : null;

  const maxAgingCount = aging?.buckets ? Math.max(...aging.buckets.map((b) => b.count), 1) : 1;

  const byTypeEntries = summary?.byType
    ? Object.entries(summary.byType).filter(([, count]) => count > 0)
    : [];
  const maxTypeCount = byTypeEntries.length > 0 ? Math.max(...byTypeEntries.map(([, c]) => c), 1) : 1;

  const byPriorityEntries = summary?.byPriority
    ? ["critical", "high", "medium", "low"]
        .map((key) => [key, summary.byPriority[key] || 0] as [string, number])
    : [];
  const maxPriorityCount = byPriorityEntries.length > 0 ? Math.max(...byPriorityEntries.map(([, c]) => c), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-sm text-gray-500 dark:text-gray-400">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[220px] px-4 text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? format(parseLocalDate(startDate), "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? parseLocalDate(startDate) : undefined}
                onSelect={(date) => { if (date) setStartDate(format(date, "yyyy-MM-dd")); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label className="text-sm text-gray-500 dark:text-gray-400">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[220px] px-4 text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                {endDate ? format(parseLocalDate(endDate), "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? parseLocalDate(endDate) : undefined}
                onSelect={(date) => { if (date) setEndDate(format(date, "yyyy-MM-dd")); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading || responseTimeLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary?.total ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Open Tickets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary?.open ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg First Response</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatHours(responseTime?.avgFirstResponseHours)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Resolution Time</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatHours(responseTime?.avgResolutionHours)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            Ticket Aging Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : aging?.buckets && aging.buckets.length > 0 ? (
            <div className="space-y-3">
              {aging.buckets.map((bucket) => (
                <div key={bucket.label} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-24 shrink-0 text-right">
                    {bucket.label}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((bucket.count / maxAgingCount) * 100, bucket.count > 0 ? 8 : 0)}%` }}
                    >
                      {bucket.count > 0 && (
                        <span className="text-xs font-medium text-white">{bucket.count}</span>
                      )}
                    </div>
                    {bucket.count === 0 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">0</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No open or in-progress tickets to analyze.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : byTypeEntries.length > 0 ? (
              <div className="space-y-3">
                {["bug", "feature_request", "improvement"].map((key) => {
                  const count = summary?.byType?.[key] || 0;
                  const IconComponent = typeIcons[key] || Bug;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{typeLabels[key] || key}</span>
                      </div>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-7 relative overflow-hidden">
                        <div
                          className={`${typeColors[key] || "bg-primary"} h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max((count / maxTypeCount) * 100, count > 0 ? 8 : 0)}%` }}
                        >
                          {count > 0 && (
                            <span className="text-xs font-medium text-white">{count}</span>
                          )}
                        </div>
                        {count === 0 && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">0</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No ticket data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : byPriorityEntries.length > 0 ? (
              <div className="space-y-3">
                {byPriorityEntries.map(([key, count]) => {
                  const IconComponent = priorityIcons[key] || Minus;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{priorityLabels[key] || key}</span>
                      </div>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-7 relative overflow-hidden">
                        <div
                          className={`${priorityColors[key] || "bg-primary"} h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max((count / maxPriorityCount) * 100, count > 0 ? 8 : 0)}%` }}
                        >
                          {count > 0 && (
                            <span className="text-xs font-medium text-white">{count}</span>
                          )}
                        </div>
                        {count === 0 && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">0</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No ticket data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CircleDot className="w-5 h-5 text-primary" />
            Tickets by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : statusEntries.length > 0 ? (
            <div className="space-y-3">
              {statusEntries.map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.label}</span>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-7 relative overflow-hidden">
                    <div
                      className={`${s.color} h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max((s.count / maxStatusCount) * 100, s.count > 0 ? 8 : 0)}%` }}
                    >
                      {s.count > 0 && (
                        <span className="text-xs font-medium text-white">{s.count}</span>
                      )}
                    </div>
                    {s.count === 0 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">0</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No ticket data available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Monthly Ticket Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrendLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : monthlyTrend?.months && monthlyTrend.months.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyTrend.months} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="created" name="Tickets Created" stroke="hsl(179, 100%, 39%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No ticket data for the selected range.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Monthly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrendLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : monthlyTrend?.months && monthlyTrend.months.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyTrend.months} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" name="Created" fill="hsl(179, 100%, 39%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No activity for the selected range.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Response Time Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responseTimeLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg First Response</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {formatHours(responseTime?.avgFirstResponseHours)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Resolution Time</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {formatHours(responseTime?.avgResolutionHours)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Resolved</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {responseTime?.totalResolved ?? 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total With Response</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {responseTime?.totalWithResponse ?? 0}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            Top Ticket Handlers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBreakdownLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : userBreakdown?.topHandlers && userBreakdown.topHandlers.length > 0 ? (
            <div className="space-y-3">
              {userBreakdown.topHandlers.map((handler, idx) => {
                const maxHandled = userBreakdown.topHandlers[0]?.count || 1;
                return (
                  <div key={handler.userId} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-8 shrink-0">
                      <span className={cn(
                        "text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center",
                        idx === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" :
                        idx === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" :
                        idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                        "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {idx + 1}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-40 shrink-0 truncate">
                      {handler.userName}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-7 relative overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((handler.count / maxHandled) * 100, 8)}%` }}
                      >
                        <span className="text-xs font-medium text-white">{handler.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No ticket handling data for this period.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Individual Rep Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBreakdownLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : userBreakdown?.users && userBreakdown.users.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="text-sm text-gray-500 dark:text-gray-400">Select Rep:</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a rep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reps</SelectItem>
                    {userBreakdown.users.map(u => (
                      <SelectItem key={u.userId} value={u.userId}>{u.userName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUserId === "all" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Rep</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Handled</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Resolved</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Avg Response</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Avg Resolution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBreakdown.users.map(u => (
                        <tr key={u.userId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelectedUserId(u.userId)}>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{u.userName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300">{u.totalHandled}</td>
                          <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300">{u.totalResolved}</td>
                          <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300">{formatHours(u.avgFirstResponseHours)}</td>
                          <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300">{formatHours(u.avgResolutionHours)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedUserStats ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedUserStats.userName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Individual Performance</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tickets Handled</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{selectedUserStats.totalHandled}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tickets Resolved</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{selectedUserStats.totalResolved}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg First Response</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{formatHours(selectedUserStats.avgFirstResponseHours)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg Resolution Time</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{formatHours(selectedUserStats.avgResolutionHours)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">By Type</h4>
                      <div className="space-y-2">
                        {["bug", "feature_request", "improvement"].map(key => {
                          const count = selectedUserStats.byType[key] || 0;
                          const maxC = Math.max(...Object.values(selectedUserStats.byType), 1);
                          const IconComp = typeIcons[key] || Bug;
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <div className="flex items-center gap-2 w-32 shrink-0">
                                <IconComp className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs text-gray-700 dark:text-gray-300">{typeLabels[key]}</span>
                              </div>
                              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 relative overflow-hidden">
                                <div
                                  className={`${typeColors[key]} h-full rounded-full transition-all duration-300 flex items-center justify-end pr-1.5`}
                                  style={{ width: `${Math.max((count / maxC) * 100, count > 0 ? 10 : 0)}%` }}
                                >
                                  {count > 0 && <span className="text-[10px] font-medium text-white">{count}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">By Priority</h4>
                      <div className="space-y-2">
                        {["critical", "high", "medium", "low"].map(key => {
                          const count = selectedUserStats.byPriority[key] || 0;
                          const maxC = Math.max(...Object.values(selectedUserStats.byPriority), 1);
                          const IconComp = priorityIcons[key] || Minus;
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <div className="flex items-center gap-2 w-24 shrink-0">
                                <IconComp className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs text-gray-700 dark:text-gray-300">{priorityLabels[key]}</span>
                              </div>
                              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 relative overflow-hidden">
                                <div
                                  className={`${priorityColors[key]} h-full rounded-full transition-all duration-300 flex items-center justify-end pr-1.5`}
                                  style={{ width: `${Math.max((count / maxC) * 100, count > 0 ? 10 : 0)}%` }}
                                >
                                  {count > 0 && <span className="text-[10px] font-medium text-white">{count}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No ticket handling data for this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
