import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Network,
  ChevronRight,
  ChevronDown,
  Users,
  UserPlus,
  X,
  GripVertical,
  MoveVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

// Types based on schema
type OrgChartStructure = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type OrgChartNode = {
  id: string;
  structureId: string;
  parentNodeId: string | null;
  positionTitle: string;
  department: string | null;
  description: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

type OrgChartNodeAssignment = {
  id: string;
  nodeId: string;
  staffId: string;
  assignmentType: 'primary' | 'backup' | 'interim';
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string | null;
  department: string | null;
  photoUrl: string | null;
};

// Schemas
const structureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const nodeSchema = z.object({
  positionTitle: z.string().min(1, "Position title is required"),
  department: z.string().optional(),
  description: z.string().optional(),
});

const assignmentSchema = z.object({
  staffId: z.string().min(1, "Staff member is required"),
  assignmentType: z.enum(['primary', 'backup', 'interim']).default('primary'),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
});

export default function OrgChartStructureBuilder() {
  const { toast } = useToast();
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<OrgChartStructure | null>(null);
  const [editingNode, setEditingNode] = useState<OrgChartNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [dragParentContext, setDragParentContext] = useState<string | null>(null);

  // Fetch structures
  const { data: structures = [] } = useQuery<OrgChartStructure[]>({
    queryKey: ["/api/org-chart/structures"],
  });

  // Fetch nodes for selected structure
  const { data: nodes = [] } = useQuery<OrgChartNode[]>({
    queryKey: ["/api/org-chart/structures", selectedStructureId, "nodes"],
    enabled: !!selectedStructureId,
  });

  // Fetch assignments for selected structure
  const { data: assignments = [] } = useQuery<OrgChartNodeAssignment[]>({
    queryKey: ["/api/org-chart/structures", selectedStructureId, "assignments"],
    enabled: !!selectedStructureId,
  });

  // Fetch staff
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Forms
  const structureForm = useForm({
    resolver: zodResolver(structureSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const nodeForm = useForm({
    resolver: zodResolver(nodeSchema),
    defaultValues: {
      positionTitle: "",
      department: "",
      description: "",
    },
  });

  const assignmentForm = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      staffId: "",
      assignmentType: "primary" as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
    },
  });

  // Mutations
  const createStructureMutation = useMutation({
    mutationFn: async (data: z.infer<typeof structureSchema>) => {
      return await apiRequest("POST", "/api/org-chart/structures", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures"] });
      toast({ title: "Success", description: "Structure created successfully" });
      setIsStructureDialogOpen(false);
      structureForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create structure", variant: "destructive" });
    },
  });

  const updateStructureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof structureSchema>> }) => {
      return await apiRequest("PUT", `/api/org-chart/structures/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures"] });
      toast({ title: "Success", description: "Structure updated successfully" });
      setIsStructureDialogOpen(false);
      setEditingStructure(null);
      structureForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update structure", variant: "destructive" });
    },
  });

  const deleteStructureMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/org-chart/structures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures"] });
      toast({ title: "Success", description: "Structure deleted successfully" });
      if (selectedStructureId === arguments[0]) {
        setSelectedStructureId(null);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete structure", variant: "destructive" });
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof nodeSchema> & { structureId: string; parentNodeId: string | null }) => {
      return await apiRequest("POST", "/api/org-chart/nodes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures", selectedStructureId, "nodes"] });
      toast({ title: "Success", description: "Position created successfully" });
      setIsNodeDialogOpen(false);
      nodeForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create position", variant: "destructive" });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrgChartNode> }) => {
      return await apiRequest("PUT", `/api/org-chart/nodes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures", selectedStructureId, "nodes"] });
      toast({ title: "Success", description: "Position updated successfully" });
      setIsNodeDialogOpen(false);
      setEditingNode(null);
      nodeForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update position", variant: "destructive" });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/org-chart/nodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures", selectedStructureId, "nodes"] });
      toast({ title: "Success", description: "Position deleted successfully" });
      if (selectedNodeId === arguments[0]) {
        setSelectedNodeId(null);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete position", variant: "destructive" });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignmentSchema> & { nodeId: string }) => {
      return await apiRequest("POST", "/api/org-chart/assignments", {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures", selectedStructureId, "assignments"] });
      toast({ title: "Success", description: "Staff assigned successfully" });
      setIsAssignmentDialogOpen(false);
      assignmentForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to assign staff", variant: "destructive" });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/org-chart/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart/structures", selectedStructureId, "assignments"] });
      toast({ title: "Success", description: "Assignment removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove assignment", variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateStructure = () => {
    setEditingStructure(null);
    structureForm.reset();
    setIsStructureDialogOpen(true);
  };

  const handleEditStructure = (structure: OrgChartStructure) => {
    setEditingStructure(structure);
    structureForm.reset({
      name: structure.name,
      description: structure.description || "",
      isActive: structure.isActive,
    });
    setIsStructureDialogOpen(true);
  };

  const handleStructureSubmit = (data: z.infer<typeof structureSchema>) => {
    if (editingStructure) {
      updateStructureMutation.mutate({ id: editingStructure.id, data });
    } else {
      createStructureMutation.mutate(data);
    }
  };

  const handleCreateNode = (parentNodeId: string | null = null) => {
    if (!selectedStructureId) return;
    setEditingNode(null);
    setDragParentContext(parentNodeId);
    nodeForm.reset({
      positionTitle: "",
      department: "",
      description: "",
    });
    setIsNodeDialogOpen(true);
  };

  const handleEditNode = (node: OrgChartNode) => {
    setEditingNode(node);
    setDragParentContext(node.parentNodeId);
    nodeForm.reset({
      positionTitle: node.positionTitle,
      department: node.department || "",
      description: node.description || "",
    });
    setIsNodeDialogOpen(true);
  };

  const handleNodeSubmit = (data: z.infer<typeof nodeSchema>) => {
    if (!selectedStructureId) return;
    if (editingNode) {
      updateNodeMutation.mutate({ id: editingNode.id, data });
    } else {
      createNodeMutation.mutate({ ...data, structureId: selectedStructureId, parentNodeId: dragParentContext });
    }
  };

  const handleAssignStaff = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    assignmentForm.reset({
      staffId: "",
      assignmentType: "primary",
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
    });
    setIsAssignmentDialogOpen(true);
  };

  const handleAssignmentSubmit = (data: z.infer<typeof assignmentSchema>) => {
    if (!selectedNodeId) return;
    createAssignmentMutation.mutate({ ...data, nodeId: selectedNodeId });
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Build tree structure
  const buildTree = (parentId: string | null = null): OrgChartNode[] => {
    return nodes
      .filter(node => node.parentNodeId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const getNodeAssignments = (nodeId: string) => {
    return assignments.filter(a => a.nodeId === nodeId);
  };

  const getStaffName = (staffId: string) => {
    const person = staff.find(s => s.id === staffId);
    return person ? `${person.firstName} ${person.lastName}` : "Unknown";
  };

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Parse the IDs
    const draggedNodeId = draggableId;
    const sourceParentId = source.droppableId === 'root' ? null : source.droppableId;
    const destParentId = destination.droppableId === 'root' ? null : destination.droppableId;

    // Get the dragged node
    const draggedNode = nodes.find(n => n.id === draggedNodeId);
    if (!draggedNode) return;

    // Prevent dropping a parent into its own child
    const isDescendant = (nodeId: string, potentialAncestorId: string): boolean => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || node.parentNodeId === null) return false;
      if (node.parentNodeId === potentialAncestorId) return true;
      return isDescendant(node.parentNodeId, potentialAncestorId);
    };

    if (destParentId && isDescendant(destParentId, draggedNodeId)) {
      toast({
        title: "Invalid Move",
        description: "Cannot move a position into its own descendant",
        variant: "destructive",
      });
      return;
    }

    // Get siblings at destination (excluding the dragged node if same parent)
    const destSiblings = nodes
      .filter(n => n.parentNodeId === destParentId && n.id !== draggedNodeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    // Calculate new order index
    let newOrderIndex = 0;
    if (destSiblings.length === 0) {
      // No other siblings, use orderIndex 0
      newOrderIndex = 0;
    } else if (destination.index === 0) {
      // Inserting at the beginning
      newOrderIndex = destSiblings[0].orderIndex - 1;
    } else if (destination.index >= destSiblings.length) {
      // Inserting at the end
      newOrderIndex = destSiblings[destSiblings.length - 1].orderIndex + 1;
    } else {
      // Inserting between two siblings
      const before = destSiblings[destination.index - 1];
      const after = destSiblings[destination.index];
      newOrderIndex = (before.orderIndex + after.orderIndex) / 2;
    }

    // Update the node
    try {
      await updateNodeMutation.mutateAsync({
        id: draggedNodeId,
        data: {
          parentNodeId: destParentId,
          orderIndex: newOrderIndex,
        },
      });
      
      toast({
        title: "Success",
        description: "Position moved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move position",
        variant: "destructive",
      });
    }
  };

  const renderDraggableNode = (node: OrgChartNode, index: number, level: number) => {
    const children = buildTree(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const nodeAssignments = getNodeAssignments(node.id);

    return (
      <Draggable key={node.id} draggableId={node.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
          >
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border bg-white ${
                selectedNodeId === node.id ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50"
              } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
              style={{ marginLeft: `${level * 24}px` }}
            >
              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>

              {hasChildren && (
                <button
                  onClick={() => toggleNodeExpansion(node.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                  data-testid={`button-toggle-${node.id}`}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}

              <div className="flex-1 cursor-pointer" onClick={() => setSelectedNodeId(node.id)}>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{node.positionTitle}</h4>
                  {node.department && (
                    <Badge variant="outline" className="text-xs">{node.department}</Badge>
                  )}
                  {nodeAssignments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {nodeAssignments.length}
                    </Badge>
                  )}
                </div>
                {node.description && (
                  <p className="text-xs text-muted-foreground mt-1">{node.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNode(node.id);
                  }}
                  data-testid={`button-add-child-${node.id}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditNode(node);
                  }}
                  data-testid={`button-edit-node-${node.id}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNodeMutation.mutate(node.id);
                  }}
                  className="text-destructive hover:text-destructive"
                  data-testid={`button-delete-node-${node.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Nested droppable zone for this node's children */}
            {isExpanded && (
              <div style={{ marginLeft: `${(level + 1) * 24}px` }}>
                <Droppable droppableId={node.id} type="NODE">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[40px] ${snapshot.isDraggingOver ? 'bg-primary/5 rounded-lg border-2 border-dashed border-primary' : ''}`}
                    >
                      {children.map((child, childIndex) => renderDraggableNode(child, childIndex, level + 1))}
                      {provided.placeholder}
                      {children.length === 0 && snapshot.isDraggingOver && (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                          Drop here to make this a child position
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedNodeAssignments = selectedNodeId ? getNodeAssignments(selectedNodeId) : [];

  return (
    <div className="space-y-6">
      {/* Structure Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            value={selectedStructureId || ""}
            onValueChange={setSelectedStructureId}
          >
            <SelectTrigger data-testid="select-structure">
              <SelectValue placeholder="Select a structure" />
            </SelectTrigger>
            <SelectContent>
              {structures.map((structure) => (
                <SelectItem key={structure.id} value={structure.id}>
                  {structure.name}
                  {!structure.isActive && " (Inactive)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreateStructure} data-testid="button-create-structure">
          <Plus className="h-4 w-4 mr-2" />
          New Structure
        </Button>
        {selectedStructureId && (
          <Button
            variant="outline"
            onClick={() => {
              const structure = structures.find(s => s.id === selectedStructureId);
              if (structure) handleEditStructure(structure);
            }}
            data-testid="button-edit-structure"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Main Content */}
      {selectedStructureId ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Drag-and-Drop Tree Builder */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Organization Structure
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop to reorganize positions
                    </p>
                  </div>
                  <Button onClick={() => handleCreateNode(null)} size="sm" data-testid="button-add-root-node">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Top Position
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="root" type="NODE">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] ${snapshot.isDraggingOver ? 'bg-primary/5 rounded-lg' : ''}`}
                      >
                        {buildTree(null).map((node, index) => renderDraggableNode(node, index, 0))}
                        {provided.placeholder}
                        {buildTree(null).length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            <MoveVertical className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium mb-2">No positions defined yet</p>
                            <p className="text-sm">Click "Add Top Position" to start building your org chart</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </div>

          {/* Node Detail Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Position Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">{selectedNode.positionTitle}</h4>
                      {selectedNode.department && (
                        <Badge variant="outline" className="mb-2">{selectedNode.department}</Badge>
                      )}
                      {selectedNode.description && (
                        <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium">Staff Assignments</h5>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignStaff(selectedNode.id)}
                          data-testid="button-assign-staff"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      </div>

                      {selectedNodeAssignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No staff assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedNodeAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                            >
                              <div>
                                <p className="text-sm font-medium">{getStaffName(assignment.staffId)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {assignment.assignmentType}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(assignment.startDate).toLocaleDateString()}
                                    {assignment.endDate && ` - ${new Date(assignment.endDate).toLocaleDateString()}`}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                                data-testid={`button-remove-assignment-${assignment.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">Select a position to view details and assign staff</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No Structure Selected</p>
              <p className="text-sm">Select a structure or create a new one to get started</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Structure Dialog */}
      <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStructure ? "Edit Structure" : "Create Structure"}</DialogTitle>
            <DialogDescription>
              {editingStructure ? "Update the structure details" : "Create a new organizational chart structure"}
            </DialogDescription>
          </DialogHeader>
          <Form {...structureForm}>
            <form onSubmit={structureForm.handleSubmit(handleStructureSubmit)} className="space-y-4">
              <FormField
                control={structureForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Structure Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Organization" data-testid="input-structure-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={structureForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Structure description" data-testid="input-structure-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsStructureDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-structure">
                  {editingStructure ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Node Dialog */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNode ? "Edit Position" : "Create Position"}</DialogTitle>
            <DialogDescription>
              {editingNode ? "Update the position details" : "Create a new position in the org chart"}
            </DialogDescription>
          </DialogHeader>
          <Form {...nodeForm}>
            <form onSubmit={nodeForm.handleSubmit(handleNodeSubmit)} className="space-y-4">
              <FormField
                control={nodeForm.control}
                name="positionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chief Executive Officer" data-testid="input-position-title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={nodeForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Executive" data-testid="input-department" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={nodeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Position description" data-testid="input-node-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsNodeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-node">
                  {editingNode ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
            <DialogDescription>
              Assign a staff member to this position
            </DialogDescription>
          </DialogHeader>
          <Form {...assignmentForm}>
            <form onSubmit={assignmentForm.handleSubmit(handleAssignmentSubmit)} className="space-y-4">
              <FormField
                control={assignmentForm.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-staff">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName} {person.position && `- ${person.position}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="assignmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                        <SelectItem value="interim">Interim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-start-date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignmentForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-end-date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-assignment">
                  Assign
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
