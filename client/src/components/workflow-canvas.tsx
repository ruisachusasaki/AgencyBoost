import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeTypes,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Settings, Mail, Plus, Check, X, Trash2 } from "lucide-react";

// Custom Node Components
const TriggerNode = ({ data }: { data: any }) => {
  const hasConditions = data.trigger?.conditions && Object.keys(data.trigger.conditions).some(
    key => data.trigger.conditions[key] !== "" && data.trigger.conditions[key] !== null && data.trigger.conditions[key] !== undefined
  );

  return (
    <Card className="w-64 border-2 border-blue-500 bg-blue-50 shadow-lg hover:shadow-xl transition-shadow cursor-pointer relative group">
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
              TRIGGER
            </Badge>
          </div>
          {hasConditions && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              ✓ Configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0" onClick={() => data.onConfigure?.()}>
        <div className="font-medium text-blue-900">{data.label}</div>
        {hasConditions && (
          <div className="text-xs text-blue-700 mt-1">
            Click to edit conditions
          </div>
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex gap-1">
          <Button size="sm" variant="outline" className="text-xs h-6" onClick={(e) => {
            e.stopPropagation(); // Prevent double click handling
            data.onConfigure?.();
          }}>
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-6 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
            e.stopPropagation(); // Prevent double click handling
            data.onDelete?.();
          }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ActionNode = ({ data }: { data: any }) => (
  <Card className="w-64 border-2 border-green-500 bg-green-50 shadow-lg hover:shadow-xl transition-shadow cursor-move relative group">
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 !bg-green-500 !border-2 !border-white"
    />
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 !bg-green-500 !border-2 !border-white"
    />
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
          ACTION
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="font-medium text-green-900">{data.label}</div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex gap-1">
        <Button size="sm" variant="outline" className="text-xs h-6" onClick={(e) => {
          e.stopPropagation();
          data.onConfigure?.();
        }}>
          <Settings className="h-3 w-3 mr-1" />
          Configure
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-6 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.();
        }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ConditionalNode = ({ data }: { data: any }) => (
  <Card className="w-64 border-2 border-purple-500 bg-purple-50">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
          CONDITION
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="font-medium text-purple-900">{data.label}</div>
      <div className="text-xs text-purple-700 mt-1">{data.description}</div>
      <div className="flex gap-2 mt-3">
        <div className="flex items-center gap-1 text-xs">
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-600">YES</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <X className="h-3 w-3 text-red-600" />
          <span className="text-red-600">NO</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AddButtonNode = ({ data }: { data: any }) => (
  <div className="relative">
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
    />
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
    />
    <Button
      variant="outline"
      size="sm"
      className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 hover:border-primary hover:bg-primary/10"
      onClick={data.onAdd}
    >
      <Plus className="h-4 w-4" />
    </Button>
  </div>
);

const AddTriggerNode = ({ data }: { data: any }) => (
  <Card className="w-64 border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
    <CardContent 
      className="pt-6 pb-6 text-center"
      onClick={data.onAdd}
    >
      <div className="flex flex-col items-center gap-2">
        <Plus className="h-6 w-6 text-blue-600" />
        <div className="font-medium text-blue-900">Add New Trigger</div>
        <div className="text-xs text-blue-700">Start your workflow</div>
      </div>
    </CardContent>
  </Card>
);

const EndNode = ({ data }: { data: any }) => (
  <Card className="w-32 border-2 border-gray-400 bg-gray-100 relative">
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
    />
    <CardContent className="pt-4 pb-4 text-center">
      <div className="font-medium text-gray-700">END</div>
    </CardContent>
  </Card>
);

interface WorkflowCanvasProps {
  workflowData: {
    triggers: Array<{ type: string; name?: string; conditions?: any }>;
    actions: any[];
  };
  onAddTrigger: () => void;
  onAddAction: () => void;
  onAddCondition: () => void;
  onConfigureTrigger?: (triggerIndex: number) => void;
  onDeleteTrigger?: (triggerIndex: number) => void;
  onDeleteAction?: (actionIndex: number) => void;
}

export default function WorkflowCanvas({ 
  workflowData, 
  onAddTrigger, 
  onAddAction, 
  onAddCondition,
  onConfigureTrigger,
  onDeleteTrigger,
  onDeleteAction
}: WorkflowCanvasProps) {
  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    triggerNode: TriggerNode,
    actionNode: ActionNode,
    conditionalNode: ConditionalNode,
    addButtonNode: AddButtonNode,
    addTriggerNode: AddTriggerNode,
    endNode: EndNode,
  }), []);

  // Generate initial nodes from workflow data
  const generateInitialNodes = (): Node[] => {
    const nodes: Node[] = [];
    let yPosition = 100;
    const xPosition = 400;

    // If no triggers, show "Add New Trigger" card
    if (!workflowData.triggers || workflowData.triggers.length === 0) {
      nodes.push({
        id: 'add-trigger',
        type: 'addTriggerNode',
        position: { x: xPosition, y: yPosition },
        data: {
          onAdd: onAddTrigger,
        },
      });
      yPosition += 150;
      
      // Add end node below for empty workflow
      nodes.push({
        id: 'end-placeholder',
        type: 'endNode',
        position: { x: xPosition + 66, y: yPosition + 50 },
        data: {},
      });
      
      return nodes;
    }

    // Add all trigger nodes
    workflowData.triggers.forEach((trigger, index) => {
      if (trigger && trigger.name) {
        nodes.push({
          id: `trigger-${index + 1}`,
          type: 'triggerNode',
          position: { x: xPosition + (index * 300), y: yPosition },
          data: {
            label: trigger.name,
            trigger: trigger,
            onConfigure: () => onConfigureTrigger?.(index),
            onDelete: () => onDeleteTrigger?.(index),
          },
        });
      }
    });
    
    // Add "Add Another Trigger" button after existing triggers
    const triggerCount = workflowData.triggers.length;
    nodes.push({
      id: 'add-another-trigger',
      type: 'addTriggerNode',
      position: { x: xPosition + (triggerCount * 300), y: yPosition },
      data: {
        onAdd: onAddTrigger,
        label: 'Add Another Trigger'
      },
    });
    
    yPosition += 150;
    
    // Add plus button after triggers for actions (centered if multiple triggers)
    const centerX = triggerCount > 1 ? xPosition + ((triggerCount - 1) * 150) : xPosition;
    
    nodes.push({
      id: 'add-action-after-triggers',
      type: 'addButtonNode',
      position: { x: centerX + 110, y: yPosition },
      data: {
        onAdd: onAddAction,
      },
    });
    yPosition += 100;

    // Add action nodes
    workflowData.actions.forEach((action, index) => {
      nodes.push({
        id: `action-${index + 1}`,
        type: 'actionNode',
        position: { x: xPosition, y: yPosition },
        data: {
          label: action.name,
          onConfigure: () => console.log('Configure action', index),
          onDelete: () => onDeleteAction?.(index),
        },
      });
      yPosition += 150;
      
      // Add plus button after each action (except the last one)
      if (index < workflowData.actions.length - 1) {
        nodes.push({
          id: `add-after-action-${index}`,
          type: 'addButtonNode',
          position: { x: xPosition + 110, y: yPosition },
          data: {
            onAdd: onAddAction,
          },
        });
        yPosition += 100;
      }
    });

    // Add final plus button and END node
    if (workflowData.actions.length > 0) {
      nodes.push({
        id: 'add-button-final',
        type: 'addButtonNode',
        position: { x: xPosition + 110, y: yPosition },
        data: {
          onAdd: onAddAction,
        },
      });
      yPosition += 100;
    }
    
    // Always add END node at the bottom
    nodes.push({
      id: 'end-node',
      type: 'endNode',
      position: { x: xPosition + 66, y: yPosition },
      data: {},
    });

    return nodes;
  };

  // Generate initial edges
  const generateInitialEdges = (): Edge[] => {
    const edges: Edge[] = [];
    
    // Only generate edges if we have triggers
    if (!workflowData.triggers || workflowData.triggers.length === 0) {
      return edges;
    }

    // Connect all triggers to the add button or first action
    if (workflowData.actions.length > 0) {
      // Connect all triggers to first action
      workflowData.triggers.forEach((trigger, index) => {
        if (trigger && trigger.name) {
          edges.push({
            id: `edge-trigger${index + 1}-action1`,
            source: `trigger-${index + 1}`,
            target: 'action-1',
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.Arrow,
            },
            style: {
              strokeWidth: 2,
              stroke: '#46a1a0',
            },
          });
        }
      });

      // Connect each action to the next action
      for (let i = 0; i < workflowData.actions.length - 1; i++) {
        edges.push({
          id: `edge-action${i + 1}-action${i + 2}`,
          source: `action-${i + 1}`,
          target: `action-${i + 2}`,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.Arrow,
          },
          style: {
            strokeWidth: 2,
            stroke: '#46a1a0',
          },
        });
      }

      // Connect last action to final add button
      edges.push({
        id: `edge-action${workflowData.actions.length}-final-add`,
        source: `action-${workflowData.actions.length}`,
        target: 'add-button-final',
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow,
        },
        style: {
          strokeWidth: 2,
          stroke: '#46a1a0',
        },
      });

      // Connect final add button to END
      edges.push({
        id: 'edge-final-add-end',
        source: 'add-button-final',
        target: 'end-node',
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow,
        },
        style: {
          strokeWidth: 2,
          stroke: '#46a1a0',
        },
      });
    } else {
      // No actions yet - connect all triggers to add button, then to END
      workflowData.triggers.forEach((trigger, index) => {
        if (trigger && trigger.name) {
          edges.push({
            id: `edge-trigger${index + 1}-add`,
            source: `trigger-${index + 1}`,
            target: 'add-action-after-triggers',
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.Arrow,
            },
            style: {
              strokeWidth: 2,
              stroke: '#46a1a0',
            },
          });
        }
      });

      edges.push({
        id: 'edge-add-end',
        source: 'add-action-after-triggers',
        target: 'end-node',
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow,
        },
        style: {
          strokeWidth: 2,
          stroke: '#46a1a0',
        },
      });
    }

    return edges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(generateInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(generateInitialEdges());

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes when workflow data changes
  useEffect(() => {
    const newNodes = generateInitialNodes();
    const newEdges = generateInitialEdges();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [workflowData]);

  return (
    <div className="h-[700px] w-full border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls 
          className="bg-white border rounded-lg shadow-lg"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap 
          className="bg-white border rounded shadow-lg"
          zoomable
          pannable
        />
        <Background 
          gap={20} 
          size={1}
          color="#e2e8f0" 
        />
      </ReactFlow>
    </div>
  );
}