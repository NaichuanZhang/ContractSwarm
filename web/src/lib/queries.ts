import { db } from "./db";
import {
  assessments,
  contracts,
  agentRooms,
  agentMessages,
  clauses,
  legalRefs,
  violations,
} from "./schema";
import { eq, desc, gt, and, sql } from "drizzle-orm";

export function getAssessment(id: string) {
  return db.select().from(assessments).where(eq(assessments.id, id)).get();
}

export function listAssessments() {
  return db.select().from(assessments).orderBy(desc(assessments.createdAt)).all();
}

export function getContractsForAssessment(assessmentId: string) {
  return db
    .select()
    .from(contracts)
    .where(eq(contracts.assessmentId, assessmentId))
    .orderBy(contracts.clientName)
    .all();
}

export function getRoomsForAssessment(assessmentId: string) {
  return db
    .select({
      room: agentRooms,
      contract: contracts,
    })
    .from(agentRooms)
    .innerJoin(contracts, eq(agentRooms.contractId, contracts.id))
    .where(eq(contracts.assessmentId, assessmentId))
    .all();
}

export function getMessagesForAssessment(assessmentId: string, since?: string) {
  const roomIds = db
    .select({ id: agentRooms.id })
    .from(agentRooms)
    .innerJoin(contracts, eq(agentRooms.contractId, contracts.id))
    .where(eq(contracts.assessmentId, assessmentId))
    .all()
    .map((r) => r.id);

  if (roomIds.length === 0) return [];

  const placeholders = roomIds.map(() => "?").join(",");
  const params: unknown[] = [...roomIds];

  let query = `SELECT * FROM agent_messages WHERE room_id IN (${placeholders})`;
  if (since) {
    query += " AND created_at > ?";
    params.push(since);
  }
  query += " ORDER BY created_at ASC";

  const stmt = db.$client.prepare(query);
  return stmt.all(...params) as Array<{
    id: string;
    room_id: string;
    agent_name: string;
    message_type: string;
    content: string;
    metadata: string | null;
    created_at: string;
  }>;
}

function categorizeRef(citation: string, caseName: string): string {
  const text = (citation + " " + caseName).toUpperCase();
  if (text.includes("HIPAA") || text.includes("45 CFR 164") || text.includes("164.5")) return "HIPAA";
  if (text.includes("CCPA") || text.includes("1798.") || text.includes("CALIFORNIA CONSUMER PRIVACY")) return "CCPA";
  if (text.includes("SOX") || text.includes("SARBANES") || text.includes("PCAOB") || text.includes("AICPA") || text.includes("AT-C")) return "SOX";
  if (text.includes("FTC") || text.includes("15 U.S.C")) return "FTC";
  if (text.includes("GLBA") || text.includes("GRAMM")) return "GLBA";
  if (text.includes("UCC") || text.includes("UNIFORM COMMERCIAL")) return "UCC";
  return "Other";
}

export function getGraphData(assessmentId: string) {
  const contractRows = db
    .select()
    .from(contracts)
    .where(eq(contracts.assessmentId, assessmentId))
    .all();

  const nodes: Array<{ id: string; type: string; data: Record<string, unknown> }> = [];
  const edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: Record<string, unknown>;
  }> = [];

  const categoryNodeIds = new Set<string>();

  for (const contract of contractRows) {
    const clientNodeId = `client-${contract.id}`;
    nodes.push({
      id: clientNodeId,
      type: "client",
      data: {
        label: contract.clientName,
        riskScore: contract.riskScore,
        recommendation: contract.recommendation,
        fileName: contract.fileName,
      },
    });

    const clauseRows = db
      .select()
      .from(clauses)
      .where(eq(clauses.contractId, contract.id))
      .all();

    for (const clause of clauseRows) {
      const clauseNodeId = `clause-${clause.id}`;
      nodes.push({
        id: clauseNodeId,
        type: "clause",
        data: {
          label: clause.clauseType,
          sectionRef: clause.sectionRef,
          riskLevel: clause.riskLevel,
          text: clause.clauseText.slice(0, 200),
        },
      });
      edges.push({
        id: `e-${clientNodeId}-${clauseNodeId}`,
        source: clientNodeId,
        target: clauseNodeId,
      });

      const violationRows = db
        .select({
          violation: violations,
          legalRef: legalRefs,
        })
        .from(violations)
        .leftJoin(legalRefs, eq(violations.legalRefId, legalRefs.id))
        .where(eq(violations.clauseId, clause.id))
        .all();

      for (const { violation, legalRef } of violationRows) {
        if (legalRef) {
          const category = categorizeRef(legalRef.citation, legalRef.caseName);
          const categoryNodeId = `category-${category}`;

          if (!categoryNodeIds.has(categoryNodeId)) {
            categoryNodeIds.add(categoryNodeId);
            nodes.push({
              id: categoryNodeId,
              type: "category",
              data: {
                label: category,
                category,
              },
            });
          }

          const lawNodeId = `law-${legalRef.id}`;
          if (!nodes.find((n) => n.id === lawNodeId)) {
            nodes.push({
              id: lawNodeId,
              type: "law",
              data: {
                label: legalRef.caseName,
                citation: legalRef.citation,
                courtName: legalRef.courtName,
                category,
              },
            });
          }

          edges.push({
            id: `e-${clauseNodeId}-${categoryNodeId}-${violation.id}`,
            source: clauseNodeId,
            target: categoryNodeId,
            data: { severity: violation.severity },
          });

          if (!edges.find((e) => e.id === `e-${categoryNodeId}-${lawNodeId}`)) {
            edges.push({
              id: `e-${categoryNodeId}-${lawNodeId}`,
              source: categoryNodeId,
              target: lawNodeId,
            });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

export function getReportData(assessmentId: string) {
  const contractRows = db
    .select()
    .from(contracts)
    .where(eq(contracts.assessmentId, assessmentId))
    .orderBy(contracts.clientName)
    .all();

  return contractRows.map((contract) => {
    const clauseRows = db
      .select()
      .from(clauses)
      .where(eq(clauses.contractId, contract.id))
      .all();

    const clausesWithViolations = clauseRows.map((clause) => {
      const violationRows = db
        .select({
          violation: violations,
          legalRef: legalRefs,
        })
        .from(violations)
        .leftJoin(legalRefs, eq(violations.legalRefId, legalRefs.id))
        .where(eq(violations.clauseId, clause.id))
        .all();

      return {
        ...clause,
        violations: violationRows.map((v) => ({
          ...v.violation,
          legalRef: v.legalRef,
        })),
      };
    });

    return {
      ...contract,
      clauses: clausesWithViolations,
    };
  });
}
