"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAssessment } from "@/hooks/use-assessment";
import { ClientNode, ClauseNode, CategoryNode, LawNode } from "@/components/graph-nodes";
import { GraphSidebar } from "@/components/graph-sidebar";

const RISK_COLORS: Record<string, string> = {
  low: "#4A9E6E",
  medium: "#D4A843",
  high: "#E85D4A",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#E85D4A",
  major: "#D4A843",
  minor: "#4A9E6E",
};

const nodeTypes: NodeTypes = {
  client: ClientNode,
  clause: ClauseNode,
  category: CategoryNode,
  law: LawNode,
};

function getConnectedNodeIds(nodeId: string, edgeList: Edge[]): Set<string> {
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edgeList) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) queue.push(neighbor);
    }
  }
  return visited;
}

function layoutNodes(
  rawNodes: Array<{ id: string; type: string; data: Record<string, unknown> }>,
  rawEdges: Array<{ id: string; source: string; target: string; data?: Record<string, unknown> }>
): { nodes: Node[]; edges: Edge[] } {
  const clients = rawNodes.filter((n) => n.type === "client");
  const clauseNodes = rawNodes.filter((n) => n.type === "clause");
  const categories = rawNodes.filter((n) => n.type === "category");
  const laws = rawNodes.filter((n) => n.type === "law");

  const nodes: Node[] = [];
  const ySpacing = 140;
  const xColumns = [0, 350, 700, 1080];

  // Clients on left column
  clients.forEach((n, i) => {
    nodes.push({ ...n, position: { x: xColumns[0], y: i * ySpacing } });
  });

  // Clauses in second column — positioned near their parent client
  clauseNodes.forEach((n, i) => {
    const parentEdge = rawEdges.find((e) => e.target === n.id);
    const parentNode = parentEdge
      ? nodes.find((nd) => nd.id === parentEdge.source)
      : null;
    const siblings = clauseNodes.filter((c) => {
      const pe = rawEdges.find((e) => e.target === c.id);
      return pe?.source === parentEdge?.source;
    });
    const siblingIndex = siblings.indexOf(n);
    const baseY = parentNode ? parentNode.position.y : i * 80;

    nodes.push({
      ...n,
      position: { x: xColumns[1], y: baseY + siblingIndex * 60 },
    });
  });

  // Category nodes in third column
  categories.forEach((n, i) => {
    nodes.push({ ...n, position: { x: xColumns[2], y: i * ySpacing } });
  });

  // Laws on right column — group under their category
  laws.forEach((n, i) => {
    const parentEdge = rawEdges.find((e) => e.target === n.id);
    const parentNode = parentEdge
      ? nodes.find((nd) => nd.id === parentEdge.source)
      : null;
    const siblings = laws.filter((l) => {
      const pe = rawEdges.find((e) => e.target === l.id);
      return pe?.source === parentEdge?.source;
    });
    const siblingIndex = siblings.indexOf(n);
    const baseY = parentNode ? parentNode.position.y : i * 100;

    nodes.push({
      ...n,
      position: { x: xColumns[3], y: baseY + siblingIndex * 80 },
    });
  });

  const edges: Edge[] = rawEdges.map((e) => {
    const severity = (e.data?.severity as string) ?? null;
    const color = severity ? SEVERITY_COLORS[severity] ?? "#C5C0BB" : "#C5C0BB";
    return {
      ...e,
      style: { stroke: color, strokeWidth: severity ? 2 : 1 },
      animated: severity === "critical",
    };
  });

  return { nodes, edges };
}

export default function GraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  useAssessment(id);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetch(`/api/assessments/${id}/graph`)
      .then((res) => res.json())
      .then((data) => {
        if (data.nodes?.length) {
          const { nodes: laid, edges: edg } = layoutNodes(data.nodes, data.edges);
          setNodes(laid);
          setEdges(edg);
        }
      })
      .finally(() => setLoading(false));
  }, [id, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      const connected = getConnectedNodeIds(node.id, edges);
      setHighlightedIds(connected);
    },
    [edges]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setHighlightedIds(null);
  }, []);

  const styledNodes = useMemo(() => {
    if (!highlightedIds) return nodes;
    return nodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: highlightedIds.has(n.id) ? 1 : 0.2,
        transition: "opacity 0.2s ease",
      },
    }));
  }, [nodes, highlightedIds]);

  const styledEdges = useMemo(() => {
    if (!highlightedIds) return edges;
    return edges.map((e) => {
      const isHighlighted =
        highlightedIds.has(e.source) && highlightedIds.has(e.target);
      return {
        ...e,
        style: {
          ...e.style,
          opacity: isHighlighted ? 1 : 0.08,
          strokeWidth: isHighlighted ? 2.5 : 1,
          transition: "opacity 0.2s ease",
        },
        animated: isHighlighted,
      };
    });
  }, [edges, highlightedIds]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Compliance Graph
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Client contracts, clauses, and applicable case law — connected by risk
        </p>
      </div>

      <div className="relative h-[600px] rounded-lg border border-border bg-background overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading graph data...
          </div>
        ) : nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No graph data yet. Wait for the swarm to complete analysis.
          </div>
        ) : (
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background gap={24} size={1} color="#E5E0DB" />
            <Controls
              showInteractive={false}
              className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!fill-foreground [&>button:hover]:!bg-surface"
            />
          </ReactFlow>
        )}

        <GraphSidebar
          node={selectedNode}
          nodes={nodes}
          edges={edges}
          onClose={() => {
            setSelectedNode(null);
            setHighlightedIds(null);
          }}
        />

        {/* Legend */}
        {nodes.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 rounded-md bg-card/90 backdrop-blur-sm border border-border px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-full bg-risk-high" />
              <span className="text-[10px] text-muted-foreground">High Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-full bg-risk-medium" />
              <span className="text-[10px] text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-full bg-risk-low" />
              <span className="text-[10px] text-muted-foreground">Low</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
