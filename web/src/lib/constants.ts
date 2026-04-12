export const COLORS = {
  background: "#FAFAF8",
  card: "#FFFFFF",
  surface: "#F0EDE8",
  textPrimary: "#1A1A1A",
  textMuted: "#6B6560",
  gold: "#8B6F47",
  border: "#E5E0DB",
  riskHigh: "#DC3A2A",
  riskMedium: "#B8922E",
  riskLow: "#2D7A4A",
} as const;

export const CLAUSE_TYPE_LABELS: Record<string, string> = {
  data_sharing: "Data Sharing",
  subprocessor: "Subprocessor",
  consent: "Consent",
  data_residency: "Data Residency",
  exclusivity: "Exclusivity",
  confidentiality: "Confidentiality",
  liability: "Liability",
  termination: "Termination",
  ip_rights: "IP Rights",
  other: "Other",
} as const;

export const RISK_LABELS: Record<string, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
} as const;

export const RECOMMENDATION_LABELS: Record<string, string> = {
  eligible: "Eligible",
  ineligible: "Ineligible",
  needs_amendment: "Needs Amendment",
} as const;

export const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
} as const;
