export const COLORS = {
  background: "#0A0A0A",
  card: "#141414",
  surface: "#1C1C1C",
  textPrimary: "#F5F0EB",
  textMuted: "#8A8580",
  gold: "#C8A97E",
  border: "#2A2724",
  riskHigh: "#E85D4A",
  riskMedium: "#D4A843",
  riskLow: "#4A9E6E",
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
