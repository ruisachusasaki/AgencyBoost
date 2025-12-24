import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Settings, Edit2, Trash2, GripVertical, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { LeadPipelineStage } from "@shared/schema";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface PipelineStageManagerProps {
  onClose?: () => void;
}

const predefinedColors = [
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
];

export default function PipelineStageManager({ onClose }: PipelineStageManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadPipelineStage | null>(null);

  const { data: stages = [], isLoading } = useQuery<LeadPipelineStage[]>({
    queryKey: ["/api/lead-pipeline-stages"],
  });

  const createStageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/lead-pipeline-stages", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-pipeline-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Stage Created",
        variant: "success",
        description: "Pipeline stage has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pipeline stage",
        variant: "destructive",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/lead-pipeline-stages/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-pipeline-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsEditDialogOpen(false);
      setEditingStage(null);
      toast({
        title: "Stage Updated",
        variant: "success",
        description: "Pipeline stage has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pipeline stage",
        variant: "destructive",
      });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/lead-pipeline-stages/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-pipeline-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Stage Deleted",
        variant: "success",
        description: "Pipeline stage has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pipeline stage",
        variant: "destructive",
      });
    },
  });

  const reorderStagesMutation = useMutation({
    mutationFn: (stageOrders: Array<{ id: string; order: number }>) => 
      apiRequest("/api/lead-pipeline-stages/reorder", "PUT", { stageOrders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-pipeline-stages"] });
    },
  });

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
    };

    createStageMutation.mutate(data);
  };

  const handleEditStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;

    const formData = new FormData(e.target as HTMLFormElement);
    
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
    };

    updateStageMutation.mutate({ id: editingStage.id, data });
  };

  const openEditStage = (stage: LeadPipelineStage) => {
    setEditingStage(stage);
    setIsEditDialogOpen(true);
  };

  const handleDeleteStage = (id: string) => {
    deleteStageMutation.mutate(id);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers based on new positions
    const stageOrders = items.map((stage, index) => ({
      id: stage.id,
      order: index + 1
    }));

    reorderStagesMutation.mutate(stageOrders);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading pipeline stages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pipeline Stage Management</h2>
          <p className="text-muted-foreground">
            Customize your lead pipeline stages and their order
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#46a1a0] hover:bg-[#3a8b8a]">
                <Plus className="w-4 h-4 mr-2" />
                Add Stage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Pipeline Stage</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateStage} className="space-y-4">
                <div>
                  <Label htmlFor="name">Stage Name</Label>
                  <Input id="name" name="name" required placeholder="e.g., New Lead, Qualified, Proposal" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Optional description" />
                </div>
                <div>
                  <Label htmlFor="color">Stage Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {predefinedColors.map((color) => (
                      <label
                        key={color.value}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="color"
                          value={color.value}
                          className="sr-only"
                          defaultChecked={color.value === "#6b7280"}
                        />
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400"
                          style={{ backgroundColor: color.value }}
                        >
                          <input
                            type="radio"
                            name="color"
                            value={color.value}
                            className="w-4 h-4 opacity-0"
                            defaultChecked={color.value === "#6b7280"}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStageMutation.isPending}>
                    {createStageMutation.isPending ? "Creating..." : "Create Stage"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pipeline Stages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stages">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {stages.map((stage, index) => (
                    <Draggable key={stage.id} draggableId={stage.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 border rounded-lg bg-white shadow-sm transition-shadow ${
                            snapshot.isDragging ? "shadow-lg" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-move text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <div>
                                <h3 className="font-medium">{stage.name}</h3>
                                {stage.description && (
                                  <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {stage.isDefault && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditStage(stage)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Pipeline Stage</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{stage.name}"? This action cannot be undone.
                                      Any leads in this stage will need to be moved to another stage first.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStage(stage.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {stages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No pipeline stages created yet. Add your first stage to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Stage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pipeline Stage</DialogTitle>
          </DialogHeader>
          {editingStage && (
            <form onSubmit={handleEditStage} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Stage Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={editingStage.name}
                  placeholder="e.g., New Lead, Qualified, Proposal"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingStage.description || ""}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Stage Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {predefinedColors.map((color) => (
                    <label
                      key={color.value}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="color"
                        value={color.value}
                        className="sr-only"
                        defaultChecked={color.value === editingStage.color}
                      />
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400"
                        style={{ backgroundColor: color.value }}
                      >
                        <input
                          type="radio"
                          name="color"
                          value={color.value}
                          className="w-4 h-4 opacity-0"
                          defaultChecked={color.value === editingStage.color}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingStage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStageMutation.isPending}>
                  {updateStageMutation.isPending ? "Updating..." : "Update Stage"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}