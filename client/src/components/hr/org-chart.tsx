import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Handle,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  Position,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { Staff } from '@shared/schema';
import dagre from 'dagre';

interface OrgChartProps {
  staffData: Staff[];
  clientTeamAssignments?: any[];
}

// Department color mapping
const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Sales': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Marketing': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Engineering': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Product': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Operations': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Finance': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'HR': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'Customer Success': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Executive': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'default': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const getDepartmentColor = (department: string | null) => {
  if (!department) return DEPARTMENT_COLORS.default;
  return DEPARTMENT_COLORS[department] || DEPARTMENT_COLORS.default;
};

// Custom node component
const CustomNode = ({ data }: any) => {
  const colors = getDepartmentColor(data.department);
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = data.childCount > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    if (data.onToggle) {
      data.onToggle(data.id, !isExpanded);
    }
  };

  return (
    <>
      {/* Connection handles for edges */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      
      <Card className={`p-4 min-w-[240px] shadow-lg ${colors.bg} ${colors.border} border-2`}>
        <div className="flex flex-col items-center gap-3">
          {/* Avatar */}
          <Avatar className="h-16 w-16">
            <AvatarImage src={data.profileImagePath || undefined} alt={data.name} />
            <AvatarFallback className={`${colors.bg} ${colors.text} text-lg font-semibold`}>
              {data.initials}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <div className="text-center">
            <h3 className="font-semibold text-base text-gray-900">{data.name}</h3>
            {data.position && (
              <p className="text-sm text-gray-600 mt-1">{data.position}</p>
            )}
            {data.department && (
              <Badge
                variant="outline"
                className={`mt-2 ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {data.department}
              </Badge>
            )}
          </div>

          {/* Client count (if available) */}
          {data.clientCount > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {data.clientCount} {data.clientCount === 1 ? 'client' : 'clients'}
            </div>
          )}

          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={handleToggle}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mt-2 px-2 py-1 rounded hover:bg-white/50"
              data-testid={`toggle-${data.id}`}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Collapse ({data.childCount})
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3" />
                  Expand ({data.childCount})
                </>
              )}
            </button>
          )}
        </div>
      </Card>
    </>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Inner component that has access to useReactFlow
function OrgChartInner({ staffData, clientTeamAssignments = [] }: OrgChartProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const { fitView, setCenter, getZoom } = useReactFlow();

  // Group client assignments by staff member
  const clientCountByStaff = useMemo(() => {
    const counts: Record<string, number> = {};
    clientTeamAssignments.forEach((assignment) => {
      const staffId = assignment.staffId;
      counts[staffId] = (counts[staffId] || 0) + 1;
    });
    return counts;
  }, [clientTeamAssignments]);

  // Build hierarchy tree
  const hierarchyData = useMemo(() => {
    // Find all top-level leaders (people with no manager)
    const topLevelLeaders = staffData.filter(s => !s.managerId && s.isActive);
    
    // Build a map of manager -> direct reports
    const reportsByManager: Record<string, Staff[]> = {};
    staffData.forEach(staff => {
      if (staff.isActive && staff.managerId) {
        if (!reportsByManager[staff.managerId]) {
          reportsByManager[staff.managerId] = [];
        }
        reportsByManager[staff.managerId].push(staff);
      }
    });

    // Count children for each staff member
    const childCounts: Record<string, number> = {};
    const countChildren = (staffId: string): number => {
      if (childCounts[staffId] !== undefined) return childCounts[staffId];
      const directReports = reportsByManager[staffId] || [];
      childCounts[staffId] = directReports.length;
      return directReports.length;
    };

    staffData.forEach(s => {
      if (s.isActive) countChildren(s.id);
    });

    return { topLevelLeaders, reportsByManager, childCounts };
  }, [staffData]);

  // Convert to ReactFlow nodes and edges with Dagre hierarchical layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (hierarchyData.topLevelLeaders.length === 0) {
      return { nodes, edges };
    }

    // Create Dagre graph for hierarchical layout
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'TB', // Top to Bottom
      nodesep: 80, // Horizontal space between nodes
      ranksep: 120, // Vertical space between levels
      marginx: 50,
      marginy: 50,
    });

    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 200;

    // Collect all visible staff (not under collapsed nodes)
    const visibleStaff = new Set<string>();
    const queue = [...hierarchyData.topLevelLeaders.map(s => s.id)];
    
    while (queue.length > 0) {
      const staffId = queue.shift()!;
      visibleStaff.add(staffId);
      
      if (!collapsedNodes.has(staffId)) {
        const children = hierarchyData.reportsByManager[staffId] || [];
        children.forEach(child => queue.push(child.id));
      }
    }

    // Create node data for all visible staff
    const staffById = new Map(staffData.map(s => [s.id, s]));
    
    visibleStaff.forEach(staffId => {
      const staff = staffById.get(staffId);
      if (!staff) return;

      const firstName = staff.firstName || '';
      const lastName = staff.lastName || '';
      const initials = firstName && lastName
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : firstName
          ? firstName.substring(0, 2).toUpperCase()
          : 'NA';

      // Add node to Dagre graph
      dagreGraph.setNode(staffId, {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      // Prepare node data for ReactFlow
      nodes.push({
        id: staffId,
        type: 'custom',
        position: { x: 0, y: 0 }, // Will be set by Dagre
        data: {
          id: staffId,
          name: `${firstName} ${lastName}`.trim() || 'Unknown',
          position: staff.position,
          department: staff.department,
          profileImagePath: staff.profileImagePath,
          initials,
          childCount: hierarchyData.childCounts[staffId] || 0,
          clientCount: clientCountByStaff[staffId] || 0,
          onToggle: (id: string, expanded: boolean) => {
            setCollapsedNodes(prev => {
              const newSet = new Set(prev);
              if (expanded) {
                newSet.delete(id);
              } else {
                newSet.add(id);
              }
              return newSet;
            });
          },
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    // Create edges for visible manager-employee relationships
    staffData.forEach(staff => {
      if (staff.managerId && visibleStaff.has(staff.id) && visibleStaff.has(staff.managerId)) {
        dagreGraph.setEdge(staff.managerId, staff.id);
        
        edges.push({
          id: `${staff.managerId}-${staff.id}`,
          source: staff.managerId,
          target: staff.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: {
            type: 'arrowclosed',
            color: '#94a3b8',
          },
        });
      }
    });

    // Run Dagre layout algorithm
    dagre.layout(dagreGraph);

    // Apply Dagre positions to ReactFlow nodes
    nodes.forEach(node => {
      const dagreNode = dagreGraph.node(node.id);
      if (dagreNode) {
        // Dagre returns center position, adjust for node size
        node.position = {
          x: dagreNode.x - NODE_WIDTH / 2,
          y: dagreNode.y - NODE_HEIGHT / 2,
        };
      }
    });

    return { nodes, edges };
  }, [staffData, hierarchyData, collapsedNodes, clientCountByStaff]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes - using useEffect instead of useMemo for state updates
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return staffData
      .filter(staff => {
        const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
        const position = (staff.position || '').toLowerCase();
        const department = (staff.department || '').toLowerCase();
        return fullName.includes(query) || position.includes(query) || department.includes(query);
      })
      .slice(0, 5); // Limit to 5 results
  }, [searchQuery, staffData]);

  // Focus on a specific node
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setHighlightedNode(nodeId);
      setCenter(node.position.x + 140, node.position.y + 90, { zoom: 1.2, duration: 800 });
      
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedNode(null), 3000);
    }
  }, [nodes, setCenter]);

  // Update node styling based on highlight
  useEffect(() => {
    if (highlightedNode) {
      setNodes(nds =>
        nds.map(node => ({
          ...node,
          style: {
            ...node.style,
            opacity: node.id === highlightedNode ? 1 : 0.3,
          },
        }))
      );
    } else {
      setNodes(nds =>
        nds.map(node => ({
          ...node,
          style: {
            ...node.style,
            opacity: 1,
          },
        }))
      );
    }
  }, [highlightedNode, setNodes]);

  if (hierarchyData.topLevelLeaders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No organizational hierarchy found</p>
          <p className="text-sm">
            Make sure staff members have managers assigned in Settings → Staff Members
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, position, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            data-testid="org-chart-search"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setSearchQuery('')}
              data-testid="clear-search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((staff) => (
              <button
                key={staff.id}
                onClick={() => {
                  focusNode(staff.id);
                  setSearchQuery('');
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                data-testid={`search-result-${staff.id}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={staff.profileImagePath || undefined} />
                  <AvatarFallback>
                    {staff.firstName?.[0]}{staff.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {staff.firstName} {staff.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {staff.position} {staff.department && `• ${staff.department}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {searchQuery && searchResults.length === 0 && (
          <div className="mt-2 p-4 text-sm text-gray-500 text-center border rounded-md bg-white">
            No staff members found matching "{searchQuery}"
          </div>
        )}
      </Card>

      {/* Org Chart */}
      <div className="h-[800px] w-full border rounded-lg bg-gray-50" data-testid="org-chart-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 1.2,
          }}
          attributionPosition="bottom-left"
          minZoom={0.3}
          maxZoom={2}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const colors = getDepartmentColor(node.data.department);
              return colors.border.includes('blue') ? '#3b82f6' :
                     colors.border.includes('purple') ? '#a855f7' :
                     colors.border.includes('green') ? '#22c55e' :
                     colors.border.includes('orange') ? '#f97316' :
                     colors.border.includes('yellow') ? '#eab308' :
                     colors.border.includes('emerald') ? '#10b981' :
                     colors.border.includes('pink') ? '#ec4899' :
                     colors.border.includes('cyan') ? '#06b6d4' :
                     colors.border.includes('indigo') ? '#6366f1' : '#9ca3af';
            }}
            pannable
            zoomable
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export default function OrgChart(props: OrgChartProps) {
  return (
    <ReactFlowProvider>
      <OrgChartInner {...props} />
    </ReactFlowProvider>
  );
}
