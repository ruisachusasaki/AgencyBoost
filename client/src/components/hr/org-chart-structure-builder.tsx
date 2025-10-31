import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GripVertical, Users, Briefcase, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type OrgNode = {
  id: string;
  name: string;
  description?: string | null;
  type: 'department' | 'position';
  departmentId?: string;
  parentDepartmentId?: string | null;
  parentPositionId?: string | null;
  orderIndex?: number;
  isActive: boolean;
  children: OrgNode[];
};

type Position = {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  isActive: boolean;
};

export default function OrgChartStructureBuilder() {
  const { toast } = useToast();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [addPositionDialogOpen, setAddPositionDialogOpen] = useState(false);

  // Fetch org structure
  const { data: orgTree = [], isLoading } = useQuery<OrgNode[]>({
    queryKey: ["/api/org-structure"],
  });

  // Fetch all positions (master list)
  const { data: allPositions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
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

  // Add position instance mutation
  const addPositionMutation = useMutation({
    mutationFn: async (templatePosition: Position) => {
      return await apiRequest("POST", "/api/positions", {
        name: templatePosition.name,
        description: templatePosition.description,
        departmentId: null, // New instances start without a department
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      setAddPositionDialogOpen(false);
      toast({
        title: "Success",
        description: "Position added to org chart. You can now drag it to place it in the hierarchy.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add position",
        variant: "destructive",
      });
    },
  });

  // Move mutation
  const moveMutation = useMutation({
    mutationFn: async ({ id, type, payload }: { 
      id: string; 
      type: 'department' | 'position';
      payload: any;
    }) => {
      if (type === 'department') {
        return await apiRequest("PATCH", `/api/departments/${id}/hierarchy`, payload);
      } else {
        return await apiRequest("PATCH", `/api/positions/${id}/hierarchy`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure"] });
      toast({
        title: "Success",
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

    const { destination, draggableId, source } = result;
    
    // Parse IDs to determine what was moved and where (using :: delimiter to avoid UUID conflicts)
    const [nodeType, nodeId] = draggableId.split('::');
    const destDroppableId = destination.droppableId;

    // Determine the destination parent type and ID
    let destParentType: 'root' | 'department' | 'position' = 'root';
    let destParentId: string | null = null;

    if (destDroppableId !== 'root') {
      const [parentType, parentId] = destDroppableId.split('::');
      destParentType = parentType as 'department' | 'position';
      destParentId = parentId;
    }

    // Find siblings at the destination to calculate proper orderIndex
    let siblings: OrgNode[] = [];
    if (destParentType === 'root') {
      siblings = orgTree || [];
    } else if (destParentType === 'department') {
      const findNode = (nodes: OrgNode[]): OrgNode | null => {
        for (const node of nodes) {
          if (node.id === destParentId) return node;
          const found = findNode(node.children);
          if (found) return found;
        }
        return null;
      };
      const parentNode = findNode(orgTree || []);
      siblings = parentNode?.children || [];
    } else if (destParentType === 'position') {
      const findNode = (nodes: OrgNode[]): OrgNode | null => {
        for (const node of nodes) {
          if (node.id === destParentId) return node;
          const found = findNode(node.children);
          if (found) return found;
        }
        return null;
      };
      const parentNode = findNode(orgTree || []);
      siblings = parentNode?.children || [];
    }

    // Filter out the item being moved from siblings
    const filteredSiblings = siblings.filter(s => s.id !== nodeId);

    // Calculate the new orderIndex based on destination.index
    let newOrderIndex = 0;
    if (destination.index === 0) {
      // Moving to first position - use orderIndex lower than the current first item
      const firstItem = filteredSiblings[0];
      newOrderIndex = firstItem ? (firstItem.orderIndex || 0) - 1 : 0;
    } else if (destination.index >= filteredSiblings.length) {
      // Moving to last position - use orderIndex higher than the current last item
      const lastItem = filteredSiblings[filteredSiblings.length - 1];
      newOrderIndex = lastItem ? (lastItem.orderIndex || 0) + 1 : filteredSiblings.length;
    } else {
      // Moving to middle position - use average of surrounding items
      const beforeItem = filteredSiblings[destination.index - 1];
      const afterItem = filteredSiblings[destination.index];
      const beforeOrder = beforeItem?.orderIndex || 0;
      const afterOrder = afterItem?.orderIndex || 0;
      newOrderIndex = Math.floor((beforeOrder + afterOrder) / 2);
      
      // If they're adjacent integers, we need to shift everything
      if (afterOrder - beforeOrder <= 1) {
        newOrderIndex = afterOrder;
      }
    }

    // Build the appropriate payload based on what's being moved and where
    let payload: any = { orderIndex: newOrderIndex };

    if (nodeType === 'department') {
      // Department being moved
      payload.parentDepartmentId = destParentType === 'department' ? destParentId : null;
    } else {
      // Position being moved
      if (destParentType === 'root') {
        // Position moved to root - clear both parent and department
        payload.parentPositionId = null;
        payload.departmentId = null;
      } else if (destParentType === 'department') {
        // Position dropped onto department - assign to department and clear parent position
        payload.departmentId = destParentId;
        payload.parentPositionId = null;
      } else if (destParentType === 'position') {
        // Position dropped onto another position - hierarchical relationship
        payload.parentPositionId = destParentId;
        // Keep the departmentId unchanged (positions in hierarchy stay in same dept if they have one)
      }
    }

    // Call the mutation
    moveMutation.mutate({
      id: nodeId,
      type: nodeType as 'department' | 'position',
      payload
    });
  };

  // Render a single node (department or position)
  const renderNode = (node: OrgNode, index: number, parentId: string | null = null): JSX.Element => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const Icon = node.type === 'department' ? Users : Briefcase;
    const droppableId = `${node.type}::${node.id}`;
    const draggableId = `${node.type}::${node.id}`;

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

              <Icon className={`h-4 w-4 ${node.type === 'department' ? 'text-primary' : 'text-orange-500'}`} />

              <div className="flex-1">
                <div className="font-medium">{node.name}</div>
                {node.description && (
                  <div className="text-xs text-muted-foreground">{node.description}</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={node.type === 'department' ? 'default' : 'secondary'}>
                  {node.type}
                </Badge>
                <Badge variant={node.isActive ? 'default' : 'outline'}>
                  {node.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground">Order: {node.orderIndex || 0}</span>
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
                    {!hasChildren && (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        Drop {node.type === 'department' ? 'departments or positions' : 'positions'} here
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
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Chart Structure
              </CardTitle>
              <CardDescription>
                Drag and drop to organize your HR organizational hierarchy. Departments (teams) can contain positions.
                These are managed in Settings {'>'} Staff {'>'} Teams. Changes here affect the HR {'>'} Org Chart display.
              </CardDescription>
            </div>
            <Dialog open={addPositionDialogOpen} onOpenChange={setAddPositionDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-position">
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
                <div className="space-y-2 mt-4">
                  {allPositions.filter(p => p.isActive).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No positions found. Create positions in Settings {'>'} Staff Management {'>'} Teams first.
                    </div>
                  ) : (
                    allPositions.filter(p => p.isActive).map(position => (
                      <Card 
                        key={position.id} 
                        className="hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => addPositionMutation.mutate(position)}
                        data-testid={`position-template-${position.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Briefcase className="h-5 w-5 text-orange-500" />
                            <div className="flex-1">
                              <div className="font-medium">{position.name}</div>
                              {position.description && (
                                <div className="text-sm text-muted-foreground">{position.description}</div>
                              )}
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {orgTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No departments or positions found. Add them in Settings {'>'} Staff {'>'} Teams first.
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
            <Users className="h-4 w-4 text-primary" />
            <span>Department (Team)</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-orange-500" />
            <span>Position</span>
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
