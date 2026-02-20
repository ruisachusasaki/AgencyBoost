import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Ticket, AlertCircle, Clock, Timer, CalendarDays, Bug, Lightbulb, Wrench, AlertTriangle, ArrowUp, ArrowDown, Minus, CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  onHold: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

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

  const { data: summary, isLoading: summaryLoading } = useQuery<TicketSummary>({
    queryKey: ["/api/tickets/reports/summary"],
  });

  const { data: aging, isLoading: agingLoading } = useQuery<AgingResponse>({
    queryKey: ["/api/tickets/reports/aging"],
  });

  const responseTimeQueryString = `startDate=${startDate}&endDate=${endDate}`;
  const { data: responseTime, isLoading: responseTimeLoading } = useQuery<ResponseTimeData>({
    queryKey: ["/api/tickets/reports/response-time", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/reports/response-time?${responseTimeQueryString}`);
      if (!res.ok) throw new Error("Failed to fetch response time data");
      return res.json();
    },
  });

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
                  "w-[200px] pl-3 text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? format(new Date(startDate), "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? new Date(startDate) : undefined}
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
                  "w-[200px] pl-3 text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                {endDate ? format(new Date(endDate), "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
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
    </div>
  );
}
