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
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAssessment } from "@/hooks/use-assessment";

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  major: "#f97316",
  minor: "#eab308",
};

function ClientNode({ data }: { data: Record<string, unknown> }) {
  const risk = data.riskScore as string | null;
  const borderColor = risk ? RISK_COLORS[risk] ?? "#71717a" : "#71717a";

  return (
    <div
      className="rounded-lg border-2 bg-card p-3 shadow-md min-w-[140px]"
      style={{ borderColor }}
    >
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
      <p className="text-xs font-semibold text-foreground">{data.label as string}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{data.fileName as string}</p>
      {typeof data.recommendation === "string" && (
        <Badge
          variant="outline"
          className="mt-1.5 text-[10px]"
          style={{ borderColor, color: borderColor }}
        >
          {data.recommendation}
        </Badge>
      )}
    </div>
  );
}

function ClauseNode({ data }: { data: Record<string, unknown> }) {
  const risk = data.riskLevel as string | null;
  const borderColor = risk ? RISK_COLORS[risk] ?? "#71717a" : "#71717a";

  return (
    <div
      className="rounded-md border bg-card/80 p-2 shadow-sm min-w-[120px] max-w-[180px]"
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
      <p className="text-[10px] font-medium text-foreground">
        {(data.label as string).replace(/_/g, " ")}
      </p>
      {typeof data.sectionRef === "string" && (
        <p className="text-[9px] text-muted-foreground">{data.sectionRef}</p>
      )}
    </div>
  );
}

function LawNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-md border border-purple-500/50 bg-purple-500/10 p-2 shadow-sm min-w-[120px] max-w-[200px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-400" />
      <p className="text-[10px] font-medium text-purple-300">{data.label as string}</p>
      {typeof data.citation === "string" && (
        <p className="text-[9px] text-purple-400/70 font-mono">{data.citation}</p>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  client: ClientNode,
  clause: ClauseNode,
  law: LawNode,
};

function layoutNodes(
  rawNodes: Array<{ id: string; type: string; data: Record<string, unknown> }>,
  rawEdges: Array<{ id: string; source: string; target: string; data?: Record<string, unknown> }>
): { nodes: Node[]; edges: Edge[] } {
  // Simple layered layout: clients at top, clauses in middle, laws at bottom
  const clients = rawNodes.filter((n) => n.type === "client");
  const clauseNodes = rawNodes.filter((n) => n.type === "clause");
  const laws = rawNodes.filter((n) => n.type === "law");

  const nodes: Node[] = [];
  const xSpacing = 220;
  const yLayers = [0, 180, 360];

  clients.forEach((n, i) => {
    nodes.push({
      ...n,
      position: { x: i * xSpacing, y: yLayers[0] },
    });
  });

  clauseNodes.forEach((n, i) => {
    // Position clauses under their parent client
    const parentEdge = rawEdges.find((e) => e.target === n.id);
    const parentNode = parentEdge
      ? nodes.find((nd) => nd.id === parentEdge.source)
      : null;
    const baseX = parentNode ? parentNode.position.x : i * 150;
    const childIndex = clauseNodes
      .filter((c) => {
        const pe = rawEdges.find((e) => e.target === c.id);
        return pe?.source === parentEdge?.source;
      })
      .indexOf(n);

    nodes.push({
      ...n,
      position: { x: baseX + childIndex * 160 - 40, y: yLayers[1] },
    });
  });

  laws.forEach((n, i) => {
    nodes.push({
      ...n,
      position: { x: i * xSpacing + 40, y: yLayers[2] },
    });
  });

  const edges: Edge[] = rawEdges.map((e) => {
    const severity = (e.data?.severity as string) ?? null;
    const color = severity ? SEVERITY_COLORS[severity] ?? "#71717a" : "#71717a";
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
  const { data: assessment } = useAssessment(id);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Compliance Graph</h1>
        <p className="text-sm text-muted-foreground">
          Interactive view of clients, contract clauses, and legal references
        </p>
      </div>

      {/* Legend */}
      <div className="px-6 pb-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Low Risk
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium Risk
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> High Risk
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Legal Reference
        </span>
      </div>

      <div className="flex-1 m-4 rounded-lg border border-border overflow-hidden">
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
            fitView
            className="bg-background"
          >
            <Background color="#333" gap={20} />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
