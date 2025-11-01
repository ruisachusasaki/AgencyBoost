import { useCallback, useMemo, useState, useEffect } from 'react';
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

  // Convert to ReactFlow nodes and edges with proper tree layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (hierarchyData.topLevelLeaders.length === 0) {
      return { nodes, edges };
    }

    // Layout parameters
    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 180;
    const HORIZONTAL_SPACING = 60;
    const VERTICAL_SPACING = 220;

    interface TreeNode {
      staff: Staff;
      children: TreeNode[];
      x: number;
      y: number;
      width: number;
    }

    // Build tree structure for each top-level leader
    const buildTree = (staff: Staff, level: number = 0): TreeNode => {
      const isCollapsed = collapsedNodes.has(staff.id);
      const directReports = hierarchyData.reportsByManager[staff.id] || [];
      const visibleChildren = isCollapsed ? [] : directReports;
      
      const children = visibleChildren.map(child => buildTree(child, level + 1));
      
      return {
        staff,
        children,
        x: 0,
        y: level * VERTICAL_SPACING,
        width: 0,
      };
    };

    // Calculate subtree widths (post-order traversal)
    const calculateWidths = (node: TreeNode): number => {
      if (node.children.length === 0) {
        node.width = NODE_WIDTH;
        return NODE_WIDTH;
      }

      let childrenWidth = 0;
      node.children.forEach(child => {
        childrenWidth += calculateWidths(child);
      });
      childrenWidth += (node.children.length - 1) * HORIZONTAL_SPACING;

      node.width = Math.max(NODE_WIDTH, childrenWidth);
      return node.width;
    };

    // Position nodes (pre-order traversal)
    const positionNodes = (node: TreeNode, x: number) => {
      if (node.children.length === 0) {
        // Leaf node - center it in its allocated space
        node.x = x + (node.width - NODE_WIDTH) / 2;
      } else {
        // Parent node - position children first, then center parent above them
        let childX = x;
        node.children.forEach(child => {
          positionNodes(child, childX);
          childX += child.width + HORIZONTAL_SPACING;
        });

        // Center parent over children
        const firstChildCenter = node.children[0].x + NODE_WIDTH / 2;
        const lastChildCenter = node.children[node.children.length - 1].x + NODE_WIDTH / 2;
        node.x = (firstChildCenter + lastChildCenter) / 2 - NODE_WIDTH / 2;
      }
    };

    // Flatten tree to array
    const flattenTree = (node: TreeNode, result: TreeNode[] = []): TreeNode[] => {
      result.push(node);
      node.children.forEach(child => flattenTree(child, result));
      return result;
    };

    // Build and layout trees for all top-level leaders
    const trees = hierarchyData.topLevelLeaders.map(leader => buildTree(leader));
    
    // Calculate widths for all trees
    trees.forEach(tree => calculateWidths(tree));

    // Position trees side by side
    let currentX = 0;
    trees.forEach((tree, index) => {
      positionNodes(tree, currentX);
      currentX += tree.width + HORIZONTAL_SPACING * 3; // Extra space between top-level leaders
    });

    // Flatten all trees into a single array
    const allNodes = trees.flatMap(tree => flattenTree(tree));

    // Center the entire layout
    if (allNodes.length > 0) {
      const minX = Math.min(...allNodes.map(n => n.x));
      const maxX = Math.max(...allNodes.map(n => n.x + NODE_WIDTH));
      const totalWidth = maxX - minX;
      const offset = -totalWidth / 2;
      
      allNodes.forEach(node => {
        node.x += offset;
      });
    }

    // Create ReactFlow nodes
    allNodes.forEach(({ staff, x, y }) => {
      const firstName = staff.firstName || '';
      const lastName = staff.lastName || '';
      const initials = firstName && lastName 
        ? `${firstName[0]}${lastName[0]}`.toUpperCase() 
        : firstName 
          ? firstName.substring(0, 2).toUpperCase() 
          : 'NA';
      
      nodes.push({
        id: staff.id,
        type: 'custom',
        position: { x, y },
        data: {
          id: staff.id,
          name: `${firstName} ${lastName}`.trim() || 'Unknown',
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

    // Create edges for manager-employee relationships
    allNodes.forEach(({ staff }) => {
      if (staff.managerId) {
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

  // Update nodes and edges when data changes - using useEffect instead of useMemo for state updates
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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
