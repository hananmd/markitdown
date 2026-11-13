import io
import pytest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas
from backend.app.main import app

client = TestClient(app)

def create_sample_pdf(title: str = "FastAPI PDF Test", body: str = "Automated test body.") -> bytes:
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(100, 750, title)
    p.setFont("Helvetica", 10)
    p.drawString(100, 730, body)
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "MarkItDown" in data["engine"]

def test_sample_endpoint():
    response = client.get("/api/sample")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")

def test_convert_single_pdf_success():
    pdf_bytes = create_sample_pdf(title="Invoice 101", body="Amount due: $500.00")
    files = {"file": ("invoice.pdf", pdf_bytes, "application/pdf")}
    
    response = client.post("/api/convert", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "invoice.pdf"
    assert data["markdown_filename"] == "invoice.md"
    assert "Invoice 101" in data["content"]
    assert data["word_count"] > 0

def test_convert_single_pdf_invalid_format():
    fake_bytes = b"Just plain text pretending to be pdf"
    files = {"file": ("malicious.pdf", fake_bytes, "application/pdf")}
    
    response = client.post("/api/convert", files=files)
    assert response.status_code == 400
    assert "missing %PDF signature" in response.json()["detail"]

def test_convert_download():
    pdf_bytes = create_sample_pdf(title="Download Me", body="Attachment content.")
    files = {"file": ("doc.pdf", pdf_bytes, "application/pdf")}
    
    response = client.post("/api/convert/download", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/markdown")
    assert "attachment; filename=\"doc.md\"" in response.headers["content-disposition"]
    assert "Download Me" in response.text

def test_convert_batch_pdfs():
    pdf1 = create_sample_pdf("Doc 1", "Body 1")
    pdf2 = create_sample_pdf("Doc 2", "Body 2")
    
    files = [
        ("files", ("doc1.pdf", pdf1, "application/pdf")),
        ("files", ("doc2.pdf", pdf2, "application/pdf")),
    ]
    
    response = client.post("/api/convert/batch", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_files"] == 2
    assert data["successful_count"] == 2
    assert data["failed_count"] == 0
    assert len(data["results"]) == 2

def test_export_zip():
    payload = {
        "items": [
            {
                "markdown_filename": "readme.md",
                "content": "# Readme\nThis is a test.",
                "word_count": 5,
                "duration_ms": 12.5
            },
            {
                "markdown_filename": "notes.md",
                "content": "## Notes\nMeeting summary.",
                "word_count": 4,
                "duration_ms": 8.1
            }
        ]
    }
    response = client.post("/api/export/zip", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert len(response.content) > 0

def test_pwa_static_assets():
    # Root SPA
    resp_root = client.get("/")
    assert resp_root.status_code == 200
    assert "<!doctype html>" in resp_root.text.lower()
    assert "MarkItDown" in resp_root.text

    # PWA Manifest
    resp_manifest = client.get("/manifest.json")
    assert resp_manifest.status_code == 200
    manifest_data = resp_manifest.json()
    assert manifest_data["short_name"] == "MarkItDown"
    assert manifest_data["display"] == "standalone"

    # Service Worker
    resp_sw = client.get("/sw.js")
    assert resp_sw.status_code == 200
    assert "markitdown-cache" in resp_sw.text

