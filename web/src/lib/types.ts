export type RiskLevel = "low" | "medium" | "high";
export type Recommendation = "eligible" | "ineligible" | "needs_amendment";
export type Severity = "critical" | "major" | "minor";
export type ClauseType =
  | "data_sharing"
  | "subprocessor"
  | "consent"
  | "data_residency"
  | "exclusivity"
  | "confidentiality"
  | "liability"
  | "termination"
  | "ip_rights"
  | "other";
export type RoomStatus = "active" | "completed";
export type MessageType = "text" | "thought" | "tool_call" | "tool_result";
