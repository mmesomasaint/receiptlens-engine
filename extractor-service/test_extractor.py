import io
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont
from main import app

client = TestClient(app)

def create_mock_receipt_image() -> bytes:
    """Generates a small in-memory PNG with clear text for OCR testing."""
    img = Image.new('RGB', (400, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    text = "Home Depot\nInvoice Date: 2023-11-15\nTotal: $148.50"
    draw.text((20, 30), text, fill=(0, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_embed_query():
    response = client.post("/embed-query", json={"query": "Uber ride receipts from June"})
    assert response.status_code == 200
    data = response.json()
    assert "embedding" in data
    assert len(data["embedding"]) == 384  # 384-dimensional for all-MiniLM-L6-v2

def test_extract_features_image():
    image_bytes = create_mock_receipt_image()
    files = {"file": ("test_receipt.png", image_bytes, "image/png")}
    response = client.post("/extract", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "raw_text" in data
    assert "embedding" in data
    assert len(data["embedding"]) == 384
    assert data["total_amount"] == 148.50
