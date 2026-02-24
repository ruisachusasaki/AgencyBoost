import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Mail, Smartphone, Users, MessageSquare, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertNotificationSettingsSchema, type NotificationSettings } from "@shared/schema";

// Strip userId, id, and timestamps from the schema for form validation
const notificationFormSchema = insertNotificationSettingsSchema.omit({
  userId: true,
  id: true,
  createdAt: true,
  updatedAt: true,
});

type NotificationFormData = z.infer<typeof notificationFormSchema>;

interface NotificationSettingsPanelProps {
  userId: string;
  isEditing?: boolean;
  onEditToggle?: (editing: boolean) => void;
  onSaveSuccess?: () => void;
  showSaveButton?: boolean;
}

export default function NotificationSettingsPanel({
  userId,
  isEditing = true,
  onEditToggle,
  onSaveSuccess,
  showSaveButton = true,
}: NotificationSettingsPanelProps) {
  const { toast } = useToast();

  // Query notification settings
  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: [`/api/notification-settings/${userId}`],
    enabled: !!userId,
  });

  // Form with react-hook-form + Zod validation
  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      clientAssignedInApp: true,
      clientAssignedEmail: true,
      clientAssignedSms: false,
      chatAddedInApp: true,
      chatAddedEmail: false,
      chatAddedSms: false,
      chatMessagesInApp: true,
      mentionedInApp: true,
      mentionedEmail: true,
      mentionedSms: false,
      mentionFollowUpInApp: true,
      mentionFollowUpEmail: false,
      mentionFollowUpSms: false,
      taskAssignedInApp: true,
      taskAssignedEmail: true,
      taskAssignedSms: false,
    },
  });

  // Hydrate form defaults when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        clientAssignedInApp: settings.clientAssignedInApp ?? true,
        clientAssignedEmail: settings.clientAssignedEmail ?? true,
        clientAssignedSms: settings.clientAssignedSms ?? false,
        chatAddedInApp: settings.chatAddedInApp ?? true,
        chatAddedEmail: settings.chatAddedEmail ?? false,
        chatAddedSms: settings.chatAddedSms ?? false,
        chatMessagesInApp: settings.chatMessagesInApp ?? true,
        mentionedInApp: settings.mentionedInApp ?? true,
        mentionedEmail: settings.mentionedEmail ?? true,
        mentionedSms: settings.mentionedSms ?? false,
        mentionFollowUpInApp: settings.mentionFollowUpInApp ?? true,
        mentionFollowUpEmail: settings.mentionFollowUpEmail ?? false,
        mentionFollowUpSms: settings.mentionFollowUpSms ?? false,
        taskAssignedInApp: settings.taskAssignedInApp ?? true,
        taskAssignedEmail: settings.taskAssignedEmail ?? true,
        taskAssignedSms: settings.taskAssignedSms ?? false,
      });
    }
  }, [settings, form]);

  // Mutation to update settings
  const updateMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const response = await apiRequest("PUT", `/api/notification-settings/${userId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notification-settings/${userId}`] });
      toast({
        title: "Success",
        variant: "default",
        description: "Notification settings updated successfully",
      });
      // Notify parent component of successful save
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    },
    onError: (error) => {
      console.error("Failed to update notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Assignment Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Client Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clientAssignedInApp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-client-assigned-in-app"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientAssignedEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-client-assigned-email"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientAssignedSms"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>SMS Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-client-assigned-sms"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Chat Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>Chat Added to Conversation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="chatAddedInApp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-chat-added-in-app"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chatAddedEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-chat-added-email"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chatAddedSms"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>SMS Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-chat-added-sms"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>Chat Messages</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="chatMessagesInApp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-chat-messages-in-app"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <p className="text-sm text-muted-foreground">
                Chat messages only support in-app notifications to avoid excessive alerts.
              </p>
            </CardContent>
          </Card>

          {/* Mention Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>@Mentions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="mentionedInApp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-mentioned-in-app"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mentionedEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-mentioned-email"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mentionedSms"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>SMS Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-mentioned-sms"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Mention Follow-up Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Mention Follow-ups</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="mentionFollowUpInApp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-mention-follow-up-in-app"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mentionFollowUpEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-mention-follow-up-email"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mentionFollowUpSms"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>SMS Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-mention-follow-up-sms"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Task Assignment Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Task Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="taskAssignedInApp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-task-assigned-in-app"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taskAssignedEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-task-assigned-email"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taskAssignedSms"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>SMS Notifications</span>
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing || updateMutation.isPending}
                        data-testid="switch-task-assigned-sms"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        {isEditing && showSaveButton && (
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save-notifications"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
