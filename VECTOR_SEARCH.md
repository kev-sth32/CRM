# SalesOS Vector Search & Semantic Knowledge Retrieval

## Architecture
SalesOS incorporates a provider-agnostic vector search abstraction (`vector-store.js`) that operates over tenant knowledge documents. It indexes chunk embeddings, performs cosine similarity searches, and guarantees that search results never leak cross-tenant data.

## Vector Store Contract

```javascript
class VectorStore {
  /**
   * Indexes text chunks with embeddings.
   * @param {string} tenantId - Tenant boundary.
   * @param {Array<{id: string, embedding: number[], metadata: Object, text: string}>} items
   */
  async upsert(tenantId, items) {}

  /**
   * Performs semantic similarity search within tenant scope.
   * @param {string} tenantId - Tenant boundary.
   * @param {number[]} queryEmbedding - Query vector.
   * @param {Object} options - { limit: 5, minScore: 0.75, filter: {} }
   * @returns {Promise<Array<{id: string, score: number, text: string, metadata: Object}>>}
   */
  async search(tenantId, queryEmbedding, options) {}

  /**
   * Deletes chunks associated with a specific document.
   * @param {string} tenantId
   * @param {string} documentId
   */
  async deleteByDocument(tenantId, documentId) {}
}
```

## Storage Implementations

### 1. PostgreSQL `pgvector` Adapter (`012_vector_store.sql`)
- Leverages native `vector` data type in PostgreSQL 15+.
- Creates an HNSW or IVFFlat cosine similarity index:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
  ON knowledge_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WHERE tenant_id IS NOT NULL;
  ```
- Queries use native distance operators (`<=>` for cosine distance):
  ```sql
  SELECT id, content, metadata, 1 - (embedding <=> $1) AS score
  FROM knowledge_chunks
  WHERE tenant_id = $2
  ORDER BY embedding <=> $1
  LIMIT $3;
  ```

### 2. In-Memory Cosine Adapter (Development & Test Mode)
- Computes normalized dot product vector similarity in Node.js memory.
- Allows test suites (`retrieval.test.js`) to run cleanly in CI environments without external vector database dependencies.

## Retrieval Service Pipeline (`retrieval.js`)
1. **Query Sanitization:** Removes prompt injections and adversarial control characters.
2. **Embedding:** Computes vector coordinates via `embedding-provider.js`.
3. **Tenant-Scoped Search:** Executes vector query strictly isolated to `req.tenantId`.
4. **Context Assembly & Citations:** Formats top chunks into structured prompt context including source document ID, title, and chunk index.
5. **Hallucination Shield:** Evaluator verifies that generated answers attribute facts exclusively to the retrieved chunks.

## Automated Testing
- `retrieval.test.js` — Cosine similarity ranking, tenant boundary enforcement, and minimum threshold checks.
- `knowledge-processor.test.js` — Document chunking, overlap calculations, and vector store upsert.
