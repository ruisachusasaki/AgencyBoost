import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Staff } from "@shared/schema";

const adminTimeOffSchema = z.object({
  staffId: z.string({ required_error: "Please select a team member" }),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  timeOffTypeId: z.string({ required_error: "Time off category is required" }),
  reason: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

type AdminTimeOffFormData = z.infer<typeof adminTimeOffSchema>;

interface DayHours {
  date: string;
  hours: number;
}

interface AdminTimeOffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: Staff[];
}

export default function AdminTimeOffForm({ open, onOpenChange, staffList }: AdminTimeOffFormProps) {
  const [dayHours, setDayHours] = useState<DayHours[]>([]);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timeOffTypes = [], isLoading: isLoadingTypes } = useQuery<any[]>({
    queryKey: ["/api/hr/time-off-types/available"],
  });

  const form = useForm<AdminTimeOffFormData>({
    resolver: zodResolver(adminTimeOffSchema),
    defaultValues: {
      reason: "",
    },
  });

  const watchedStartDate = form.watch("startDate");
  const watchedEndDate = form.watch("endDate");

  const calculateDays = () => {
    if (!watchedStartDate || !watchedEndDate) return [];
    const days: string[] = [];
    const totalDays = differenceInDays(watchedEndDate, watchedStartDate) + 1;
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(watchedStartDate, i);
      days.push(format(date, 'yyyy-MM-dd'));
    }
    return days;
  };

  useEffect(() => {
    const days = calculateDays();
    if (days.length > 0) {
      const newDayHours = days.map(date => ({
        date,
        hours: dayHours.find(d => d.date === date)?.hours || 8,
      }));
      setDayHours(newDayHours);
    }
  }, [watchedStartDate, watchedEndDate]);

  const createMutation = useMutation({
    mutationFn: async (data: AdminTimeOffFormData & { dayHours: DayHours[] }) => {
      const totalHours = data.dayHours.reduce((sum, day) => sum + day.hours, 0);
      const totalDays = data.dayHours.length;

      const requestData = {
        staffId: data.staffId,
        timeOffTypeId: data.timeOffTypeId,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        totalDays,
        totalHours,
        reason: data.reason || null,
        status: "approved",
        dayHours: data.dayHours.map(day => ({
          date: day.date,
          hours: day.hours,
        })),
      };

      return await apiRequest("POST", "/api/hr/time-off-requests/admin", requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-off-requests"] });
      toast({
        title: "Success",
        variant: "success",
        description: "Time off record added successfully",
      });
      onOpenChange(false);
      form.reset();
      setDayHours([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add time off record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminTimeOffFormData) => {
    createMutation.mutate({ ...data, dayHours });
  };

  const updateDayHours = (date: string, hours: number) => {
    setDayHours(prev =>
      prev.map(day => day.date === date ? { ...day, hours } : day)
    );
  };

  const getTotalHours = () => dayHours.reduce((sum, day) => sum + day.hours, 0);

  const activeStaff = staffList.filter(s => s.isActive !== false).sort((a, b) => {
    const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
    const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Time Off Record</DialogTitle>
          <DialogDescription>
            Manually add time off that a team member has already taken. This will be recorded as pre-approved.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-staff-member">
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeStaff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                          {member.position ? ` - ${member.position}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>From Date</FormLabel>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-admin-start-date"
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setStartDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>To Date</FormLabel>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-admin-end-date"
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setEndDateOpen(false);
                          }}
                          disabled={(date) => watchedStartDate ? date < watchedStartDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timeOffTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Off Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingTypes}>
                    <FormControl>
                      <SelectTrigger data-testid="select-admin-time-off-type">
                        <SelectValue placeholder={isLoadingTypes ? "Loading..." : "Select a category"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeOffTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                      {timeOffTypes.length === 0 && !isLoadingTypes && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No time off types available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {dayHours.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-medium">Hours per Day</Label>
                  <div className="text-sm text-muted-foreground">
                    Total: {getTotalHours()} hours ({dayHours.length} days)
                  </div>
                </div>
                <div className="grid gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {dayHours.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <Label className="text-sm font-medium min-w-[120px]">
                        {format(parseISO(day.date), 'EEE, MMM d')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={day.hours}
                          onChange={(e) => updateDayHours(day.date, Number(e.target.value))}
                          className="w-20 text-center"
                          data-testid={`input-admin-hours-day-${index}`}
                        />
                        <span className="text-sm text-muted-foreground">hours</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes about this time off..."
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-admin-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-admin-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-admin-submit">
                {createMutation.isPending ? "Adding..." : "Add Time Off Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
