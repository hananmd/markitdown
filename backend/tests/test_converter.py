import io
import pytest
from reportlab.pdfgen import canvas
from backend.app.services.converter import DocumentConverter, ConversionError
from backend.app.utils.security import sanitize_filename, validate_pdf_file
from fastapi import HTTPException

def create_sample_pdf(title: str = "Test Document", body: str = "This is a test content paragraph.") -> bytes:
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(72, 750, title)
    p.setFont("Helvetica", 12)
    p.drawString(72, 720, body)
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()

def test_sanitize_filename():
    assert sanitize_filename("../../../malicious.pdf") == "malicious.pdf"
    assert sanitize_filename("test file (1).pdf") == "test file _1_.pdf"
    assert sanitize_filename("") == "document.pdf"

def test_validate_pdf_file_valid():
    pdf_bytes = create_sample_pdf()
    # Should not raise
    validate_pdf_file("sample.pdf", pdf_bytes)

def test_validate_pdf_file_invalid_extension():
    pdf_bytes = create_sample_pdf()
    with pytest.raises(HTTPException) as exc_info:
        validate_pdf_file("sample.exe", pdf_bytes)
    assert exc_info.value.status_code == 400
    assert "Unsupported file extension" in exc_info.value.detail

def test_validate_pdf_file_empty():
    with pytest.raises(HTTPException) as exc_info:
        validate_pdf_file("sample.pdf", b"")
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.detail

def test_validate_pdf_file_fake_magic_bytes():
    fake_content = b"THIS IS NOT A PDF FILE AT ALL"
    with pytest.raises(HTTPException) as exc_info:
        validate_pdf_file("sample.pdf", fake_content)
    assert exc_info.value.status_code == 400
    assert "missing %PDF signature" in exc_info.value.detail

def test_converter_service_success():
    converter = DocumentConverter()
    pdf_bytes = create_sample_pdf(title="Quarterly Report", body="Revenue increased by 25 percent.")
    
    result = converter.convert_pdf_bytes(pdf_bytes, "quarterly_report.pdf")
    assert result["success"] is True
    assert result["filename"] == "quarterly_report.pdf"
    assert result["markdown_filename"] == "quarterly_report.md"
    assert "Quarterly Report" in result["content"]
    assert "Revenue increased" in result["content"]
    assert result["word_count"] > 0
    assert result["duration_ms"] >= 0
