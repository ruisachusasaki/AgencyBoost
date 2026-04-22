import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GripVertical, Users, Briefcase, ChevronRight, ChevronDown, Plus, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
type OrgNode = {
  id: string;
  name: string;
  description?: string | null;
  type: 'position';
  departmentId?: string;
  parentPositionId?: string | null;
  orderIndex?: number;
  isActive: boolean;
  children: OrgNode[];
};

type TeamPosition = {
  id: string;
  key: string;
  label: string; // This is the display name
  description: string | null;
  isActive: boolean;
  inOrgChart: boolean;
  parentPositionId: string | null;
  orgChartOrder: number;
};

export default function OrgChartStructureBuilder() {
  const { toast } = useToast();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [addPositionDialogOpen, setAddPositionDialogOpen] = useState(false);
  const [positionSearchQuery, setPositionSearchQuery] = useState("");
  const [parentNodeContext, setParentNodeContext] = useState<{ type: 'position', id: string } | null>(null);

  // Fetch org structure
  const { data: orgTree = [], isLoading } = useQuery<OrgNode[]>({
    queryKey: ["/api/org-structure"],
  });

  // Fetch all team positions (from Settings > Staff > Teams)
  const { data: allPositions = [] } = useQuery<TeamPosition[]>({
    queryKey: ["/api/team-positions"],
  });

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Remove position from org chart mutation
  const removeFromOrgChartMutation = useMutation({
    mutationFn: async (positionId: string) => {
      return await apiRequest("PATCH", `/api/team-positions/${positionId}/org-chart`, {
        inOrgChart: false,
        parentPositionId: null, // Clear parent when removing from chart
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-positions"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Position removed from org chart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove position from org chart",
        variant: "destructive",
      });
    },
  });

  // Add position to org chart mutation - updates existing team position instead of creating duplicate
  const addPositionMutation = useMutation({
    mutationFn: async (teamPosition: TeamPosition) => {
      // Update existing team position to add it to org chart
      const payload: any = {
        inOrgChart: true, // Mark as part of org chart
      };

      // Set parent based on context
      if (parentNodeContext) {
        payload.parentPositionId = parentNodeContext.id;
      } else {
        // No context - add to root
        payload.parentPositionId = null;
      }

      return await apiRequest("PATCH", `/api/team-positions/${teamPosition.id}/org-chart`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-positions"] });
      setAddPositionDialogOpen(false);
      setParentNodeContext(null); // Clear context
      const contextMessage = parentNodeContext 
        ? "Position added successfully."
        : "Position added to org chart. You can now drag it to place it in the hierarchy.";
      toast({
        title: "Success",
        variant: "default",
        description: contextMessage,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add position to org chart",
        variant: "destructive",
      });
    },
  });

  // Move mutation (positions only) - uses team-positions org chart endpoint
  const moveMutation = useMutation({
    mutationFn: async ({ id, payload }: { 
      id: string; 
      payload: any;
    }) => {
      return await apiRequest("PATCH", `/api/team-positions/${id}/org-chart`, {
        parentPositionId: payload.parentPositionId,
        orgChartOrder: payload.destinationIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-positions"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Org structure updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update org structure",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { destination, draggableId } = result;
    
    // Parse IDs (using :: delimiter to avoid UUID conflicts)
    const [, nodeId] = draggableId.split('::');
    const destDroppableId = destination.droppableId;

    // Determine the destination parent
    let destParentType: 'root' | 'position' = 'root';
    let destParentId: string | null = null;

    if (destDroppableId !== 'root') {
      const [, parentId] = destDroppableId.split('::');
      destParentType = 'position';
      destParentId = parentId;
    }

    // Build payload for position move - backend will handle sibling reindexing
    const payload: any = { 
      destinationIndex: destination.index,
      parentPositionId: destParentType === 'position' ? destParentId : null,
      departmentId: null // Not used in position-based org chart
    };

    // Call the mutation
    moveMutation.mutate({
      id: nodeId,
      payload
    });
  };

  // Render a single position node
  const renderNode = (node: OrgNode, index: number, parentId: string | null = null): JSX.Element => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const Icon = Briefcase;
    const droppableId = `position::${node.id}`;
    const draggableId = `position::${node.id}`;

    return (
      <Draggable key={node.id} draggableId={draggableId} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-2"
          >
            <div
              className={`flex items-center gap-2 rounded-lg border bg-card p-3 shadow-sm transition-all ${
                snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
              }`}
            >
              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>

              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleNode(node.id)}
                  data-testid={`toggle-${draggableId}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}

              <Icon className="h-4 w-4 text-orange-500" />

              <div className="flex-1">
                <div className="font-medium">{node.name}</div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={node.isActive ? 'default' : 'outline'}>
                  {node.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground">Order: {node.orderIndex || 0}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromOrgChartMutation.mutate(node.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  data-testid={`button-remove-${node.id}`}
                  title="Remove from org chart"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Nested droppable zone - always render for drag-and-drop, show children only when expanded */}
            <div className="ml-8 mt-2">
              <Droppable droppableId={droppableId} type="NODE">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`rounded-lg border-2 border-dashed p-2 min-h-[50px] transition-colors ${
                      snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border'
                    } ${!isExpanded && hasChildren ? 'hidden' : ''}`}
                  >
                    {isExpanded && hasChildren && node.children.map((child, idx) => renderNode(child, idx, node.id))}
                    {(!hasChildren || isExpanded) && (
                      <div className="text-xs text-center py-2 space-y-2 mt-2">
                        {!hasChildren && (
                          <div className="text-muted-foreground">
                            Drop positions here
                          </div>
                        )}
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setParentNodeContext({ type: 'position', id: node.id });
                              setAddPositionDialogOpen(true);
                            }}
                            className="text-primary hover:text-primary"
                            data-testid={`button-add-position-inline-${node.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Position
                          </Button>
                        </div>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading org structure...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="pr-6">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Organization Chart Structure
              </CardTitle>
              <CardDescription className="mt-2">
                Drag and drop to organize your people-based organizational hierarchy. Build position-to-position reporting structures (e.g., CEO → VP → Manager).
                Position templates are managed in Settings {'>'} Staff {'>'} Teams. Changes here affect the HR {'>'} Org Chart display.
              </CardDescription>
            </div>
            <Dialog open={addPositionDialogOpen} onOpenChange={setAddPositionDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="button-add-position"
                  onClick={() => setParentNodeContext(null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Position
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Position to Org Chart</DialogTitle>
                  <DialogDescription>
                    Select a position from your master list to add to the org chart. You can add the same position multiple times.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search positions..."
                      value={positionSearchQuery}
                      onChange={(e) => setPositionSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-positions"
                    />
                  </div>

                  {/* Position List - shows ALL active positions from Settings > Staff > Teams */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {(() => {
                      const query = positionSearchQuery.toLowerCase();
                      const filteredPositions = allPositions
                        .filter(p => p.isActive && p.label.toLowerCase().includes(query))
                        .sort((a, b) => {
                          if (!!a.inOrgChart === !!b.inOrgChart) {
                            return a.label.localeCompare(b.label);
                          }
                          return a.inOrgChart ? 1 : -1;
                        });

                      if (filteredPositions.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            {positionSearchQuery 
                              ? "No positions match your search."
                              : "No positions found. Create positions in Settings > Staff Management > Teams first."}
                          </div>
                        );
                      }

                      return filteredPositions.map(position => {
                        const alreadyInChart = !!position.inOrgChart;
                        return (
                          <Card 
                            key={position.id} 
                            className={
                              alreadyInChart
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:bg-accent cursor-pointer transition-colors"
                            }
                            onClick={() => {
                              if (!alreadyInChart) addPositionMutation.mutate(position);
                            }}
                            data-testid={`position-template-${position.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Briefcase className="h-5 w-5 text-orange-500" />
                                <div className="flex-1">
                                  <div className="font-medium">{position.label}</div>
                                </div>
                                {alreadyInChart ? (
                                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    In Chart
                                  </span>
                                ) : (
                                  <Plus className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {orgTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No positions found. Click "Add Position" above to start building your org chart.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="root" type="NODE">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-2 min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                      snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  >
                    {orgTree.map((node, index) => renderNode(node, index))}
                    {provided.placeholder}
                    
                    {/* Add Position button at root level */}
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setParentNodeContext(null); // Root level - no parent
                          setAddPositionDialogOpen(true);
                        }}
                        className="text-primary hover:text-primary"
                        data-testid="button-add-position-root"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Position
                      </Button>
                    </div>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-orange-500" />
            <span>Position (Person)</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span>Drag handle</span>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span>Expand/Collapse</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
