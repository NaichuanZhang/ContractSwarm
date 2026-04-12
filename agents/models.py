"""Pydantic models for the agent backend."""

from __future__ import annotations

from pydantic import BaseModel, field_validator


class OrchestrateRequest(BaseModel):
    assessment_id: str


class OrchestrateResponse(BaseModel):
    assessment_id: str
    status: str
    message: str


class ClauseData(BaseModel):
    clause_type: str
    section_ref: str | None = None
    clause_text: str
    risk_level: str | None = None
    violations: list[ViolationData] = []


class LegalRefData(BaseModel):
    citation: str
    case_name: str
    court_name: str | None = None
    opinion_id: str | None = None
    relevance: str | None = None


class ViolationData(BaseModel):
    severity: str
    explanation: str
    legal_ref: LegalRefData | None = None
    original_language: str | None = None
    proposed_amendment: str | None = None
    legal_justification: str | None = None
    additional_docs: list[str] | None = None


class ContractResult(BaseModel):
    client_name: str
    overall_risk: str
    recommendation: str
    contract_value: float | None = None
    fee_description: str | None = None
    clauses: list[ClauseData] = []

    @field_validator("contract_value", mode="before")
    @classmethod
    def parse_contract_value(cls, v: object) -> float | None:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            cleaned = v.replace("$", "").replace(",", "").strip()
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None


# Forward reference resolution
ClauseData.model_rebuild()
