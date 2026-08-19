# ReceiptLens — Document Ingestion, OCR & Vector Search Engine

ReceiptLens is a privacy-first tax document and invoice extraction engine designed to eliminate panic-searching during tax season and expense audits.

## Key Features
- **Narrow Google OAuth (Read-Only):** Ingests only PDF/PNG/JPEG attachments from Gmail and Drive matching tax and receipt terms.
- **Microservice OCR & Embeddings:** Python FastAPI service executes Tesseract OCR and computes 384-dim dense embeddings (`all-MiniLM-L6-v2`).
- **PostgreSQL `pgvector` Search:** Blends vector cosine similarity with SQL metadata (tax year, amounts, date boundaries).
- **1-Click Tax Year Export:** Compiles full tax years into a ZIP archive with a generated summary CSV.



## 🛠️ Local Development Setup

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
# 1. Clone the repository
git clone [https://github.com/your-org/receiptlens-engine.git](https://github.com/your-org/receiptlens-engine.git)
cd receiptlens-engine

# 2. Install Node.js backend dependencies
npm install
```

---


### Step 2: Configure Environment

```bash
cp .env.example .env
```

---

### Step 3: Start PostgreSQL with `pgvector` & Redis

```bash
docker compose up postgres redis extractor -d
```
---

### Step 4: Run Migrations & Seed

```bash
# Run Migrations & Run Prisma Seed:
npx prisma migrate dev --name init
npm run prisma:seed

# Start Dev Server:
npm run dev
```

---

