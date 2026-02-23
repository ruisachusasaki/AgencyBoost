import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Headphones, Play, Square, ChevronLeft, ChevronRight, Clock, Trash2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatElapsed(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const totalSeconds = Math.floor((now - start) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function CallCenter() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [weekOf, setWeekOf] = useState<Date>(new Date());
  const [elapsed, setElapsed] = useState("00:00:00");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: clientsData } = useQuery<any>({
    queryKey: ["/api/clients"],
  });

  const { data: statusData, isLoading: statusLoading } = useQuery<{ runningEntry: any }>({
    queryKey: ["/api/call-center/status"],
    refetchInterval: 30000,
  });

  const weekStart = startOfWeek(weekOf, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekOf, { weekStartsOn: 1 });
  const weekOfParam = format(weekStart, "yyyy-MM-dd");

  const { data: entriesData, isLoading: entriesLoading } = useQuery<{ entries: any[]; weekStart: string; weekEnd: string }>({
    queryKey: ["/api/call-center/entries", weekOfParam],
    queryFn: async () => {
      const res = await fetch(`/api/call-center/entries?weekOf=${weekOfParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch entries");
      return res.json();
    },
  });

  const runningEntry = statusData?.runningEntry;

  useEffect(() => {
    if (runningEntry?.isRunning && runningEntry?.startTime) {
      setElapsed(formatElapsed(runningEntry.startTime));
      timerRef.current = setInterval(() => {
        setElapsed(formatElapsed(runningEntry.startTime));
      }, 1000);
    } else {
      setElapsed("00:00:00");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningEntry?.isRunning, runningEntry?.startTime]);

  const clockInMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest("POST", "/api/call-center/clock-in", { clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-center/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/call-center/entries"] });
      toast({ title: "Clocked In", description: "Timer started" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to clock in", variant: "destructive" });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/call-center/clock-out", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-center/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/call-center/entries"] });
      toast({ title: "Clocked Out", description: "Timer stopped" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to clock out", variant: "destructive" });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/call-center/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-center/entries"] });
      toast({ title: "Deleted", description: "Time entry removed" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to delete entry", variant: "destructive" });
    },
  });

  const handleClockIn = () => {
    if (!selectedClientId) {
      toast({ title: "Select a Client", description: "Please select a client before clocking in", variant: "destructive" });
      return;
    }
    clockInMutation.mutate(selectedClientId);
  };

  const handleClockOut = () => {
    clockOutMutation.mutate();
  };

  const entries = entriesData?.entries || [];
  const totalMinutes = entries.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);

  const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.clients || []);

  // Group entries by date
  const entriesByDate: Record<string, any[]> = {};
  for (const entry of entries) {
    const date = format(new Date(entry.startTime), "yyyy-MM-dd");
    if (!entriesByDate[date]) entriesByDate[date] = [];
    entriesByDate[date].push(entry);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Headphones className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Center</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Clock In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {runningEntry?.isRunning ? (
            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground">Currently tracking time for</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {runningEntry.clientName || "Unknown Client"}
              </div>
              <div className="text-4xl font-mono font-bold text-primary">{elapsed}</div>
              <Button
                onClick={handleClockOut}
                disabled={clockOutMutation.isPending}
                size="lg"
                className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="h-5 w-5 mr-2" />
                {clockOutMutation.isPending ? "Stopping..." : "Clock Out"}
              </Button>
              <div className="text-xs text-muted-foreground mt-2">
                Or select a different client below to switch
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-muted-foreground mb-4">00:00:00</div>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Select Client
              </label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="bg-background text-foreground border-input">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border shadow-md z-[200]">
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={String(client.id)} className="text-popover-foreground hover:bg-accent cursor-pointer">
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleClockIn}
              disabled={!selectedClientId || clockInMutation.isPending}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Play className="h-5 w-5 mr-2" />
              {runningEntry?.isRunning ? "Switch Client" : "Clock In"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly Summary
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekOf(subWeeks(weekOf, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={() => setWeekOf(addWeeks(weekOf, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No time entries this week</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(new Date(entry.startTime), "EEE, MMM d")}
                      </TableCell>
                      <TableCell>{entry.clientName || "Unknown"}</TableCell>
                      <TableCell>{format(new Date(entry.startTime), "h:mm a")}</TableCell>
                      <TableCell>
                        {entry.isRunning ? (
                          <span className="text-primary font-medium">Running...</span>
                        ) : entry.endTime ? (
                          format(new Date(entry.endTime), "h:mm a")
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.isRunning ? (
                          <span className="text-primary">-</span>
                        ) : (
                          formatDuration(entry.duration || 0)
                        )}
                      </TableCell>
                      <TableCell>
                        {!entry.isRunning && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Total This Week</span>
                <span className="text-lg font-bold text-primary">{formatDuration(totalMinutes)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
