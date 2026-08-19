# extractor-service/main.py
import io
import re
from datetime import datetime
from typing import List, Optional

import pdfplumber
import pytesseract
from dateutil import parser as date_parser
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="ReceiptLens OCR & Vector Engine", version="1.0.0")

# Load lightweight 384-dimensional vector embedding model (CPU-optimized)
embed_model = SentenceTransformer("all-MiniLM-L6-v2")


class ExtractionResponse(BaseModel):
    raw_text: str
    merchant_name: Optional[str] = None
    total_amount: Optional[float] = None
    currency: str = "USD"
    document_date: Optional[str] = None
    tax_year: Optional[int] = None
    category: str = "UNKNOWN"
    embedding: List[float]


class QueryEmbeddingRequest(BaseModel):
    query: str


class QueryEmbeddingResponse(BaseModel):
    embedding: List[float]


def extract_metadata_heuristics(text: str):
    """Rule-based parsing to extract financial entities from OCR text."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    merchant_name = lines[0] if lines else "Unknown Vendor"

    # Category Detection
    text_lower = text.lower()
    category = "RECEIPT"
    if "form w-9" in text_lower or "form 1099" in text_lower:
        category = "TAX_FORM_W9_1099"
    elif "invoice" in text_lower or "bill to" in text_lower:
        category = "INVOICE"
    elif "agreement" in text_lower or "contract" in text_lower:
        category = "CONTRACT"

    # Currency and Total Amount Detection
    amount_matches = re.findall(
        r"(?:[\$\€\£]|USD|EUR|GBP)\s?([0-9]{1,4}(?:,[0-9]{3})*(?:\.[0-9]{2}))",
        text,
    )
    if not amount_matches:
        amount_matches = re.findall(
            r"(?:total|amount due|balance due|charged):\s?\$?([0-9]+\.[0-9]{2})",
            text_lower,
        )

    total_amount = None
    if amount_matches:
        try:
            total_amount = float(amount_matches[-1].replace(",", ""))
        except ValueError:
            pass

    # Date and Tax Year Parsing
    date_matches = re.findall(
        r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b",
        text,
        re.IGNORECASE,
    )
    doc_date = None
    tax_year = None
    if date_matches:
        try:
            parsed_dt = date_parser.parse(date_matches[0])
            doc_date = parsed_dt.strftime("%Y-%m-%d")
            tax_year = parsed_dt.year
        except Exception:
            pass

    return merchant_name, total_amount, doc_date, tax_year, category


@app.post("/extract", response_model=ExtractionResponse)
async def extract_document_features(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename.lower()
    raw_text = ""

    try:
        if filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(contents)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        raw_text += extracted + "\n"
            # Fallback to OCR if PDF contains scanned image text
            if not raw_text.strip():
                # In production, rasterize PDF pages with pdf2image and run Tesseract
                raw_text = "Scanned PDF (No direct text found)"
        else:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            raw_text = pytesseract.image_to_string(image)
    except Exception as e:
        raise HTTPException(
            status_code=422, detail=f"OCR Extraction Fault: {str(e)}"
        )

    merchant, total, doc_date, tax_year, category = (
        extract_metadata_heuristics(raw_text)
    )

    # Compute dense 384-dim semantic embedding on extracted text
    text_for_embedding = (
        f"{merchant} {category} {doc_date or ''} {raw_text[:1000]}"
    )
    embedding = embed_model.encode(text_for_embedding).tolist()

    return ExtractionResponse(
        raw_text=raw_text,
        merchant_name=merchant,
        total_amount=total,
        currency="USD",
        document_date=doc_date,
        tax_year=tax_year,
        category=category,
        embedding=embedding,
    )


@app.post("/embed-query", response_model=QueryEmbeddingResponse)
async def embed_search_query(payload: QueryEmbeddingRequest):
    embedding = embed_model.encode(payload.query).tolist()
    return QueryEmbeddingResponse(embedding=embedding)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ocr-extractor"}
