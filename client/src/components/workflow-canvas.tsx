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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Settings, Mail, Plus, Check, X } from "lucide-react";

// Custom Node Components
const TriggerNode = ({ data }: { data: any }) => (
  <Card className="w-64 border-2 border-blue-500 bg-blue-50 shadow-lg hover:shadow-xl transition-shadow cursor-move">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
          TRIGGER
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="font-medium text-blue-900">{data.label}</div>
      <div className="text-xs text-blue-700 mt-1">{data.description}</div>
    </CardContent>
  </Card>
);

const ActionNode = ({ data }: { data: any }) => (
  <Card className="w-64 border-2 border-green-500 bg-green-50 shadow-lg hover:shadow-xl transition-shadow cursor-move">
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
      <div className="text-xs text-green-700 mt-1">{data.description}</div>
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
  <Button
    variant="outline"
    size="sm"
    className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 hover:border-primary hover:bg-primary/10"
    onClick={data.onAdd}
  >
    <Plus className="h-4 w-4" />
  </Button>
);

interface WorkflowCanvasProps {
  workflowData: {
    trigger: { type: string; name?: string };
    actions: any[];
  };
  onAddTrigger: () => void;
  onAddAction: () => void;
  onAddCondition: () => void;
}

export default function WorkflowCanvas({ 
  workflowData, 
  onAddTrigger, 
  onAddAction, 
  onAddCondition 
}: WorkflowCanvasProps) {
  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    triggerNode: TriggerNode,
    actionNode: ActionNode,
    conditionalNode: ConditionalNode,
    addButtonNode: AddButtonNode,
  }), []);

  // Generate initial nodes from workflow data
  const generateInitialNodes = (): Node[] => {
    const nodes: Node[] = [];
    let yPosition = 100;
    const xPosition = 400;

    // Add trigger node
    if (workflowData.trigger && workflowData.trigger.name) {
      nodes.push({
        id: 'trigger-1',
        type: 'triggerNode',
        position: { x: xPosition, y: yPosition },
        data: {
          label: workflowData.trigger.name,
          description: 'Workflow trigger',
        },
      });
      yPosition += 150;
    }

    // Add action nodes
    workflowData.actions.forEach((action, index) => {
      nodes.push({
        id: `action-${index + 1}`,
        type: 'actionNode',
        position: { x: xPosition, y: yPosition },
        data: {
          label: action.name,
          description: 'Workflow action',
        },
      });
      yPosition += 150;
    });

    // Add "add new" button at the end
    nodes.push({
      id: 'add-button',
      type: 'addButtonNode',
      position: { x: xPosition + 110, y: yPosition },
      data: {
        onAdd: onAddAction,
      },
    });

    return nodes;
  };

  // Generate initial edges
  const generateInitialEdges = (): Edge[] => {
    const edges: Edge[] = [];
    let previousNodeId = 'trigger-1';

    workflowData.actions.forEach((_, index) => {
      const currentNodeId = `action-${index + 1}`;
      edges.push({
        id: `edge-${previousNodeId}-${currentNodeId}`,
        source: previousNodeId,
        target: currentNodeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow,
        },
        style: {
          strokeWidth: 2,
          stroke: '#46a1a0',
        },
      });
      previousNodeId = currentNodeId;
    });

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