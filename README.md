# ReceiptLens — Document Ingestion, OCR & Vector Search Engine

ReceiptLens is a privacy-first tax document and invoice extraction engine designed to eliminate panic-searching during tax season and expense audits.

## Key Features
- **Narrow Google OAuth (Read-Only):** Ingests only PDF/PNG/JPEG attachments from Gmail and Drive matching tax and receipt terms.
- **Microservice OCR & Embeddings:** Python FastAPI service executes Tesseract OCR and computes 384-dim dense embeddings (`all-MiniLM-L6-v2`).
- **PostgreSQL `pgvector` Search:** Blends vector cosine similarity with SQL metadata (tax year, amounts, date boundaries).
- **1-Click Tax Year Export:** Compiles full tax years into a ZIP archive with a generated summary CSV.



## Local Development Setup

Follow these instructions to spin up the local development environment, including PostgreSQL with `pgvector`, Redis, the Python OCR/Embedding microservice, and the Node.js API engine.

---

### Prerequisites

Ensure you have the following installed on your host machine:

* **Node.js**: `v20.x` or `v22.x` (LTS recommended)
* **npm**: `v10.x+`
* **Python**: `3.11+` (with `tesseract-ocr` installed locally if not using Docker)
* **Docker & Docker Compose**: v2.x+ (Recommended for database, cache, and vector infrastructure)
* **Google Cloud Console Account**: For OAuth 2.0 Client Credentials

---

### Step 1: Clone & Install Node Dependencies

```bash
# Clone the repository
git clone [https://github.com/your-org/receiptlens-engine.git](https://github.com/your-org/receiptlens-engine.git)
cd receiptlens-engine

# Install Node.js backend dependencies
npm install
```

---


### Step 2: Configure Environment

```bash
cp .env.example .env
```

**Note:** During `Google OAuth Configuration`; Ensure `http://localhost:8000/api/v1/auth/google/callback` is added under authorized redirect URIs in your Google Cloud Console project.

---

### Step 3: Start Infrastructure via Docker

Start PostgreSQL(`pgvector`), Redis, and the python OCR microservice using Docker Compose:

```bash
# Start PostgreSQL with `pgvector` & Redis
docker compose up postgres redis extractor -d

# Verify the containers are running and healthy
docker compose ps
```
---

### Step 4: Run Database Migrations & Seed Data

```bash
# Generate Prisma Client types
npm run prisma:generate

# Execute database migrations
npm run prisma:migrate

# Seed demo test user & subscription state
npm run prisma:seed

```

---

### Step 5: Start the Development Server

Start the API with live-reloading via `tsx`: 

```bash
npm run dev
```

The server will initialize on `http://localhost:8000`:

```Plaintext
      ReceiptLens Ingestion & Semantic Search Engine
  ======================================================
      API Port           : 8000
      Environment        : development
      Extractor Service  : http://127.0.0.1:8001
      Redis Host         : 127.0.0.1:6379
  ======================================================
```

---

### Step 6: Verify System Health

Run health checks across both services to ensure full connectivity:

```bash
# 1. Check Node.js Engine Health
curl http://localhost:8000/health
# Response: {"status":"healthy","service":"receiptlens-engine"}

# 2. Check Python OCR/Vector Extractor Health
curl http://localhost:8001/health
# Response: {"status":"healthy","service":"ocr-extractor"}
```

---

## Running the Test Suite

Execute unit and integration tests:

```bash
# Run all test suites
npm test

# Run unit tests only
npm run test:unit

# Run integration tests (requires Docker services active)
npm run test:integration
```
