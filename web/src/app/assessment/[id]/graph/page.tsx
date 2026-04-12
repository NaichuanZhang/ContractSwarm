"use client";

import { use, useCallback, useEffect, useState } from "react";
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
import { ClientNode, ClauseNode, LawNode } from "@/components/graph-nodes";
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
  law: LawNode,
};

function layoutNodes(
  rawNodes: Array<{ id: string; type: string; data: Record<string, unknown> }>,
  rawEdges: Array<{ id: string; source: string; target: string; data?: Record<string, unknown> }>
): { nodes: Node[]; edges: Edge[] } {
  const clients = rawNodes.filter((n) => n.type === "client");
  const clauseNodes = rawNodes.filter((n) => n.type === "clause");
  const laws = rawNodes.filter((n) => n.type === "law");

  const nodes: Node[] = [];
  const ySpacing = 140;
  const xColumns = [0, 380, 780];

  // Clients on left column
  clients.forEach((n, i) => {
    nodes.push({ ...n, position: { x: xColumns[0], y: i * ySpacing } });
  });

  // Clauses in middle column — positioned near their parent client
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

  // Laws on right column
  laws.forEach((n, i) => {
    nodes.push({ ...n, position: { x: xColumns[2], y: i * ySpacing } });
  });

  const edges: Edge[] = rawEdges.map((e) => {
    const severity = (e.data?.severity as string) ?? null;
    const color = severity ? SEVERITY_COLORS[severity] ?? "#2A2724" : "#2A2724";
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
    },
    []
  );

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
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background gap={24} size={1} color="#1C1C1C" />
            <Controls
              showInteractive={false}
              className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!fill-foreground [&>button:hover]:!bg-surface"
            />
          </ReactFlow>
        )}

        <GraphSidebar
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
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
