# System Architecture & Workflow

## Architecture

```Plaintext
[ User / Web Client ]
       │
       │  1. GET /api/v1/auth/google -> OAuth 2.0 (gmail.readonly, drive.readonly)
       ▼
┌─────────────────────────┐
│   Express API Gateway   │ ────► Encrypts & stores Google Refresh Tokens in PostgreSQL
└────────────┬────────────┘
             │
             │  2. POST /api/v1/documents/sync -> Enqueues sync job
             ▼
┌─────────────────────────┐
│   Redis / BullMQ Queue  │
└────────────┬────────────┘
             │
             │  3. Ingestion Worker processes sync job
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Async Ingestion Pipeline                          │
│                                                                        │
│  Step A: Google Ingestion (Gmail & Drive)                              │
│          - Queries messages with `has:attachment filename:(pdf|jpg...)`│
│          - Queries Drive for files with matching MIME types            │
│          - Deduplicates by provider file SHA-256 hash                  │
│                                                                        │
│  Step B: Extraction & Vectorization (FastAPI Microservice)             │
│          - Runs Tesseract OCR / PDFPlumber on binary streams           │
│          - Regex heuristics extract Merchant, Date, Total, & Currency  │
│          - Computes dense vector embeddings via sentence-transformers  │
│                                                                        │
│  Step C: PostgreSQL Storage (`pgvector`)                               │
│          - Stores structured metadata (amount, merchant, file URL)     │
│          - Stores embedding vector (384-dim) for semantic matching     │
└────────────────────────────────────────────────────────────────────────┘
             │
             │  4. GET /api/v1/documents/search?q="Uber rides in June"
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Hybrid Search Execution                           │
│                                                                        │
│  - Generates query vector via Python extractor                         │
│  - Executes cosine similarity search on `pgvector` embeddings          │
│  - Combines with metadata filters (date ranges, tax year, tier limits) │
│  - Returns paginated documents + presigned download URLs               │
└────────────────────────────────────────────────────────────────────────┘
```
