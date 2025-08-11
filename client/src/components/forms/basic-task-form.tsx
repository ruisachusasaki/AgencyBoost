import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BasicTaskFormProps {
  onSuccess?: () => void;
}

export default function BasicTaskForm({ onSuccess }: BasicTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      await apiRequest("POST", "/api/tasks", {
        title: data.title,
        description: data.description,
        status: "pending",
        priority: "medium"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "The task has been successfully created.",
      });
      setTitle("");
      setDescription("");
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Task creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required.",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate({ title: title.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Task Title *
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={createTaskMutation.isPending}>
          {createTaskMutation.isPending ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </form>
  );
}