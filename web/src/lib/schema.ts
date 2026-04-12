import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  vendorName: text("vendor_name").notNull(),
  vendorDescription: text("vendor_description").notNull(),
  status: text("status").notNull().default("pending"),
  eligibleCount: integer("eligible_count"),
  totalCount: integer("total_count"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const contracts = sqliteTable("contracts", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  rawText: text("raw_text"),
  riskScore: text("risk_score"),
  recommendation: text("recommendation"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

export const agentRooms = sqliteTable("agent_rooms", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  thenvoiChatId: text("thenvoi_chat_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

export const agentMessages = sqliteTable(
  "agent_messages",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => agentRooms.id, { onDelete: "cascade" }),
    agentName: text("agent_name").notNull(),
    messageType: text("message_type").notNull(),
    content: text("content").notNull(),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_agent_messages_room_time").on(table.roomId, table.createdAt)]
);

export const clauses = sqliteTable("clauses", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  clauseType: text("clause_type").notNull(),
  sectionRef: text("section_ref"),
  clauseText: text("clause_text").notNull(),
  riskLevel: text("risk_level"),
  createdAt: text("created_at").notNull(),
});

export const legalRefs = sqliteTable("legal_refs", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  citation: text("citation").notNull(),
  caseName: text("case_name").notNull(),
  courtName: text("court_name"),
  opinionId: text("opinion_id"),
  relevance: text("relevance"),
  createdAt: text("created_at").notNull(),
});

export const violations = sqliteTable("violations", {
  id: text("id").primaryKey(),
  clauseId: text("clause_id")
    .notNull()
    .references(() => clauses.id, { onDelete: "cascade" }),
  legalRefId: text("legal_ref_id").references(() => legalRefs.id),
  severity: text("severity").notNull(),
  explanation: text("explanation").notNull(),
  originalLanguage: text("original_language"),
  proposedAmendment: text("proposed_amendment"),
  legalJustification: text("legal_justification"),
  additionalDocs: text("additional_docs"),
  createdAt: text("created_at").notNull(),
});
