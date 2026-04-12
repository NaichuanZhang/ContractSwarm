"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, ScrollText, Scale } from "lucide-react";
import type { Node } from "@xyflow/react";
import { CLAUSE_TYPE_LABELS } from "@/lib/constants";

interface GraphSidebarProps {
  readonly node: Node | null;
  readonly onClose: () => void;
}

export function GraphSidebar({ node, onClose }: GraphSidebarProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 z-10 w-80 border-l border-border bg-card overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">Node Details</h3>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {node.type === "client" && (
              <>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">{node.data.label as string}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className="capitalize">{node.data.riskLevel as string ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommendation</span>
                    <span className="capitalize">
                      {(node.data.recommendation as string)?.replace("_", " ") ?? "—"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {node.type === "clause" && (
              <>
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{node.data.label as string}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span>
                      {CLAUSE_TYPE_LABELS[node.data.clauseType as string ?? ""] ?? (node.data.clauseType as string)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Section</span>
                    <span>{node.data.sectionRef as string ?? "—"}</span>
                  </div>
                </div>
                {node.data.clauseText && (
                  <div className="rounded-md bg-surface p-3">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {node.data.clauseText as string}
                    </p>
                  </div>
                )}
              </>
            )}

            {node.type === "law" && (
              <>
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">{node.data.label as string}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Citation</span>
                    <span>{node.data.citation as string ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Court</span>
                    <span>{node.data.courtName as string ?? "—"}</span>
                  </div>
                </div>
                {node.data.relevance && (
                  <div className="rounded-md bg-surface p-3">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {node.data.relevance as string}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
