import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TeamPosition = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function OrgChartStructureBuilder() {
  const { toast } = useToast();

  // Fetch all team positions
  const { data: positions = [], isLoading } = useQuery<TeamPosition[]>({
    queryKey: ["/api/team-positions"],
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedPositions: TeamPosition[]) => {
      // Update each position with new order
      const promises = reorderedPositions.map((position, index) =>
        apiRequest("PUT", `/api/team-positions/${position.id}`, { order: index + 1 })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-positions"] });
      toast({
        title: "Success",
        description: "Position order updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update position order",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(positions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for all items
    const reorderedPositions = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    // Optimistically update UI
    queryClient.setQueryData(["/api/team-positions"], reorderedPositions);

    // Persist to backend
    reorderMutation.mutate(reorderedPositions);
  };

  // Sort positions by order
  const sortedPositions = [...positions].sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Chart Position Order
          </CardTitle>
          <CardDescription>
            Drag and drop to reorder how positions appear in the HR {'>'} Org Chart view. 
            These positions are managed in Settings {'>'} Staff {'>'} Teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No team positions found. Add positions in Settings {'>'} Staff {'>'} Teams first.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="positions-list">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-2 min-h-[100px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                      snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  >
                    {sortedPositions.map((position, index) => (
                      <Draggable key={position.id} draggableId={position.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              data-testid={`drag-handle-${position.id}`}
                            >
                              <GripVertical className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium" data-testid={`position-label-${position.id}`}>
                                  {position.label}
                                </span>
                                {!position.isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              {position.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {position.description}
                                </p>
                              )}
                            </div>

                            <div className="text-sm text-muted-foreground">
                              Order: <span className="font-medium">{index + 1}</span>
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
          )}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> To add, edit, or remove positions, go to{' '}
              <span className="font-medium text-foreground">Settings {'>'} Staff {'>'} Teams</span>.
              This page only controls the display order in the Org Chart.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
