# Midpage API Reference

## Authentication

All requests: `Authorization: Bearer <MIDPAGE_API_KEY>`

```
MIDPAGE_API_KEY=ak_EFP99MC6007P50SH20204X102VF5Z3JC
```

## MCP Server

- **URL:** `https://app.midpage.ai/mcp`
- **Transport:** Streamable HTTP
- **3 tools:**

| Tool | Purpose | Unique params |
|------|---------|---------------|
| `search` | Search US case law | `queries[]` (1-4 parallel), `negativeQuery`, `jurisdictionType`, `circuits[]`, `states[]` |
| `findInOpinion` | Find quotable passages in an opinion | `opinionId` or `reporterCitation` or `docket{courtAbbreviation, docketNumber}` + `query` |
| `analyzeOpinion` | AI Q&A over an opinion | Same ID params + `question` |

## REST API (`https://app.midpage.ai/api/v1`)

### POST /search

```json
{
  "query": "qualified immunity",
  "mode": "semantic",           // "semantic" | "keyword" | "hybrid"
  "page": 1,
  "page_size": 10,
  "rerank": true,
  "include_facets": false,      // keyword/hybrid only
  "filters": {
    "court_ids": ["ca9", "scotus"],
    "jurisdictions": ["Federal Appellate"],
    "states": ["California"],
    "publish_status": "published",
    "date_filed": { "start": "2020-01-01", "end": "2025-12-31" }
  }
}
```

Response: `{ results: [{ opinion_id, case_name, court_id, court_name, jurisdiction, state, date_filed, docket_number, snippet, score }], pagination: { page, total_results, total_pages, has_next }, metadata: { mode, processing_time_ms } }`

### POST /opinions/get

Lookup by exactly one method:

```json
// By IDs
{ "opinion_ids": ["7228818"], "include_content": true, "include_detailed_treatments": true }

// By citation
{ "citations": ["556 U.S. 662"] }

// By docket
{ "docket": { "docket_number": "16-402", "court_id": "scotus" } }
```

Response: `{ opinions: [{ id, case_name, court_id, docket_number, date_filed, judge_name, citations: [{ cited_as, volume, reporter, page }], citation_count, overall_treatment, html_content?, treatments?: [{ citing_id, treatment_category, treatment_description, supporting_quote }] }] }`

### POST /court/get

```json
{ "court_ids": ["ca9"] }
// or { "court_abbreviations": ["9th Cir."] }
// or { "names": ["Supreme Court"] }
```

Response: `{ courts: [{ id, full_name, court_abbreviation, jurisdiction, state, in_use }] }`
