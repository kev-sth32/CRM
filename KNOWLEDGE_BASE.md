# SalesOS Knowledge Base & Retrieval-Augmented Generation (RAG)

## Overview
Tenant knowledge powers grounded AI agent replies, customer answers, and copilot draft generation. SalesOS enforces strict tenant isolation, document versioning, and citation attribution.

## Document Ingestion & Chunking Pipeline

```
[Document / FAQ / Catalog]
            │
            ▼
┌─────────────────────────┐
│ White-Space Normalizer  │ (knowledge-processor.js)
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ Chunking Engine         │ (500 token chunks, 50 token overlap)
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ Embedding Provider      │ (embedding-provider.js)
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ pgvector / Vector Index │ (tenant_id scoped cosine similarity)
└─────────────────────────┘
```

## Data Schema & Storage

### 1. `knowledge_documents`
- `id`: UUID primary key.
- `tenant_id`: Multi-tenant boundary.
- `title`, `source_type` (`pdf`, `faq`, `catalog`, `url`, `markdown`).
- `status`: `pending`, `chunked`, `indexed`, `failed`, `archived`.
- `version`: Integer tracking revisions.

### 2. `knowledge_chunks`
- `id`: UUID primary key.
- `document_id`: Foreign key to `knowledge_documents`.
- `tenant_id`: Scoped query isolation.
- `content`: Extracted text snippet.
- `chunk_index`: Sequence order in document.
- `metadata`: JSON headers, page numbers, section titles.
- `embedding`: Vector representation (1536d or configured model dimension).

## Retrieval & Grounding Service (`retrieval.js` & `grounded-response.js`)
1. Inbound query is converted to embedding coordinates.
2. Cosine similarity query matches top-$k$ ($k=3$ or $k=5$) chunks restricted by `WHERE tenant_id = :tenantId`.
3. Grounded prompt is assembled with strict citations:
   `[Source: doc_title, Chunk #n]`.
4. Output citation validator (`response-validator.js`) verifies that all facts asserted in the model response are backed by cited sources. Uncited or cross-tenant hallucinations are rejected.

## Security & Tenant Isolation
- Zero cross-tenant data leakage: Vector searches enforce tenant filtering at the SQL/vector store query level.
- Version invalidation: When a document is updated, older version chunks are soft-deleted or removed from the active vector index.
- Sensitive data scrubber: Automated redaction of API keys, PII, and credit card numbers prior to embedding storage.

## Automated Testing
- `knowledge-processor.test.js` — Normalization, chunking boundary, and overlap validation.
- `retrieval.test.js` — Cosine similarity ranking and tenant filter verification.
- `response-validator.test.js` — Citation completeness and anti-hallucination guard.
