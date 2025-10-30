import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Staff } from '@shared/schema';

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
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function OrgChart({ staffData, clientTeamAssignments = [] }: OrgChartProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

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
    // Find CEO (person with no manager)
    const ceo = staffData.find(s => !s.managerId && s.isActive);
    
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

    return { ceo, reportsByManager, childCounts };
  }, [staffData]);

  // Convert to ReactFlow nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!hierarchyData.ceo) {
      return { nodes, edges };
    }

    // Layout parameters
    const HORIZONTAL_SPACING = 280;
    const VERTICAL_SPACING = 200;

    interface LayoutNode {
      staff: Staff;
      x: number;
      y: number;
      level: number;
    }

    const layoutNodes: LayoutNode[] = [];
    const processedIds = new Set<string>();

    // BFS to assign positions
    const queue: Array<{ staff: Staff; level: number; parentX?: number }> = [
      { staff: hierarchyData.ceo, level: 0 }
    ];

    // Track nodes at each level for proper spacing
    const nodesByLevel: Record<number, LayoutNode[]> = {};

    while (queue.length > 0) {
      const { staff, level, parentX } = queue.shift()!;
      
      if (processedIds.has(staff.id)) continue;
      processedIds.add(staff.id);

      const directReports = hierarchyData.reportsByManager[staff.id] || [];
      const isCollapsed = collapsedNodes.has(staff.id);
      const visibleChildren = isCollapsed ? [] : directReports;

      // Calculate x position
      let x: number;
      if (level === 0) {
        // CEO at center
        x = 0;
      } else {
        // Position relative to siblings
        const levelNodes = nodesByLevel[level] || [];
        if (levelNodes.length === 0) {
          x = parentX ?? 0;
        } else {
          const lastNode = levelNodes[levelNodes.length - 1];
          x = lastNode.x + HORIZONTAL_SPACING;
        }
      }

      const y = level * VERTICAL_SPACING;

      const layoutNode: LayoutNode = { staff, x, y, level };
      layoutNodes.push(layoutNode);

      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }
      nodesByLevel[level].push(layoutNode);

      // Add children to queue
      visibleChildren.forEach(child => {
        queue.push({ staff: child, level: level + 1, parentX: x });
      });
    }

    // Center each level
    Object.values(nodesByLevel).forEach(levelNodes => {
      if (levelNodes.length === 0) return;
      
      const minX = Math.min(...levelNodes.map(n => n.x));
      const maxX = Math.max(...levelNodes.map(n => n.x));
      const offset = -(minX + maxX) / 2;
      
      levelNodes.forEach(node => {
        node.x += offset;
      });
    });

    // Create nodes
    layoutNodes.forEach(({ staff, x, y }) => {
      const initials = `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
      
      nodes.push({
        id: staff.id,
        type: 'custom',
        position: { x, y },
        data: {
          id: staff.id,
          name: `${staff.firstName} ${staff.lastName}`,
          position: staff.position,
          department: staff.department,
          profileImagePath: staff.profileImagePath,
          initials,
          childCount: hierarchyData.childCounts[staff.id] || 0,
          clientCount: clientCountByStaff[staff.id] || 0,
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

    // Create edges
    layoutNodes.forEach(({ staff }) => {
      if (staff.managerId && processedIds.has(staff.managerId)) {
        edges.push({
          id: `${staff.managerId}-${staff.id}`,
          source: staff.managerId,
          target: staff.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      }
    });

    return { nodes, edges };
  }, [staffData, hierarchyData, collapsedNodes, clientCountByStaff]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (!hierarchyData.ceo) {
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
    <div className="h-[800px] w-full border rounded-lg bg-gray-50" data-testid="org-chart-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
