# ReceiptLens — Document Ingestion, OCR & Vector Search Engine

ReceiptLens is a privacy-first tax document and invoice extraction engine designed to eliminate panic-searching during tax season and expense audits.

## Key Features
- **Narrow Google OAuth (Read-Only):** Ingests only PDF/PNG/JPEG attachments from Gmail and Drive matching tax and receipt terms.
- **Microservice OCR & Embeddings:** Python FastAPI service executes Tesseract OCR and computes 384-dim dense embeddings (`all-MiniLM-L6-v2`).
- **PostgreSQL `pgvector` Search:** Blends vector cosine similarity with SQL metadata (tax year, amounts, date boundaries).
- **1-Click Tax Year Export:** Compiles full tax years into a ZIP archive with a generated summary CSV.



## Local Setup

1. **Install Node Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
3. **Start PostgreSQL with `pgvector` & Redis:**
   ```bash
   docker compose up postgres redis extractor -d
   ```
4. **Run Migrations & Seed:**
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
5. **Start Dev Server:**
   ```bash
   npm run dev
   ```
