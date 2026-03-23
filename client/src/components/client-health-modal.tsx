import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentWeekRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { inputClientHealthScoreSchema, type InputClientHealthScore } from "@shared/schema";

interface ClientHealthModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ClientHealthModal({ 
  clientId, 
  isOpen, 
  onClose, 
  onSuccess 
}: ClientHealthModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current week range for auto-population
  const { weekStart, weekEnd, displayRange } = getCurrentWeekRange();

  const form = useForm<InputClientHealthScore>({
    resolver: zodResolver(inputClientHealthScoreSchema),
    defaultValues: {
      clientId,
      weekStartDate: weekStart.toISOString().split('T')[0], // Format as YYYY-MM-DD
      weekEndDate: weekEnd.toISOString().split('T')[0],
      weeklyRecap: "",
      opportunities: "",
      solutions: "",
      goals: "On Track",
      fulfillment: "On Time", 
      relationship: "Engaged",
      clientActions: "Up to Date",
      paymentStatus: "Current",
    },
  });

  const createHealthScoreMutation = useMutation({
    mutationFn: async (data: InputClientHealthScore) => {
      return await apiRequest("POST", `/api/clients/${clientId}/health-scores`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "health-scores"] });
      toast({
        title: "Health Score Saved",
        variant: "default",
        description: "Client health score has been successfully recorded.",
      });
      form.reset();
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error("Health score creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save health score. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: InputClientHealthScore) => {
    setIsSubmitting(true);
    createHealthScoreMutation.mutate(data);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  // Scoring options
  const goalOptions = [
    { value: "Above", label: "Above" },
    { value: "On Track", label: "On Track" },
    { value: "Below", label: "Below" },
  ];

  const fulfillmentOptions = [
    { value: "Early", label: "Early" },
    { value: "On Time", label: "On Time" },
    { value: "Behind", label: "Behind" },
  ];

  const relationshipOptions = [
    { value: "Engaged", label: "Engaged" },
    { value: "Passive", label: "Passive" },
    { value: "Disengaged", label: "Disengaged" },
  ];

  const clientActionsOptions = [
    { value: "Early", label: "Early" },
    { value: "Up to Date", label: "Up to Date" },
    { value: "Late", label: "Late" },
  ];

  const paymentStatusOptions = [
    { value: "Current", label: "Current" },
    { value: "Past Due", label: "Past Due" },
    { value: "HOLD", label: "HOLD" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-client-health">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Client Health Scoring
          </DialogTitle>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                Date Range:
              </span>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="weekStartDate"
                  render={({ field }) => (
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-8 px-3 text-xs font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(parseISO(field.value), "MMM d, yyyy") : "Start date"}
                          <CalendarIcon className="ml-2 h-3.5 w-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]" align="start" style={{ pointerEvents: 'auto' }}>
                        <CalendarPicker
                          mode="single"
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, "yyyy-MM-dd"));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                <span className="text-sm text-muted-foreground">to</span>
                <FormField
                  control={form.control}
                  name="weekEndDate"
                  render={({ field }) => (
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-8 px-3 text-xs font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(parseISO(field.value), "MMM d, yyyy") : "End date"}
                          <CalendarIcon className="ml-2 h-3.5 w-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]" align="start" style={{ pointerEvents: 'auto' }}>
                        <CalendarPicker
                          mode="single"
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, "yyyy-MM-dd"));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>
          </div>
        </DialogHeader>
            <div className="grid gap-6">
              {/* Text Area Fields */}
              <div className="space-y-6">
                <div className="grid gap-4">
                  <h3 className="text-lg font-medium text-foreground border-b pb-2">
                    Weekly Summary
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="weeklyRecap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Weekly Recap
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Summarize the key activities, milestones, and outcomes for this week..."
                            className="min-h-[100px] resize-y"
                            data-testid="textarea-weekly-recap"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="opportunities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Opportunities
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Identify areas for improvement, growth opportunities, or potential optimizations..."
                            className="min-h-[100px] resize-y"
                            data-testid="textarea-opportunities"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="solutions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Solutions
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Outline proposed solutions, action plans, and next steps to address challenges..."
                            className="min-h-[100px] resize-y"
                            data-testid="textarea-solutions"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Scoring Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">
                  Health Metrics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Goals <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          data-testid="select-goals"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select goal progress" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {goalOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fulfillment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Fulfillment <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          data-testid="select-fulfillment"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fulfillment status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fulfillmentOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Relationship <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          data-testid="select-relationship"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relationshipOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientActions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Client Actions <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          data-testid="select-client-actions"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client action status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientActionsOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Payment Status <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          data-testid="select-payment-status"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-save-health-score"
                className="min-w-[120px]"
              >
                {isSubmitting ? "Saving..." : "Save Health Score"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}