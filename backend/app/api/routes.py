import io
import time
import logging
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Response
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from ..config import APP_NAME, APP_VERSION, APP_DESCRIPTION, MAX_BATCH_FILES, MAX_FILE_SIZE_MB
from ..services.converter import converter_service, ConversionError
from ..utils.security import sanitize_filename
from ..utils.zip_helper import create_markdown_zip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Conversion"])

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    engine: str
    max_file_size_mb: int
    max_batch_files: int

class ConversionResult(BaseModel):
    success: bool
    filename: str
    markdown_filename: str
    title: Optional[str] = None
    content: str
    word_count: int
    char_count: int
    line_count: int
    size_bytes: int
    duration_ms: float
    error: Optional[str] = None

class BatchConversionResponse(BaseModel):
    total_files: int
    successful_count: int
    failed_count: int
    total_duration_ms: float
    results: List[ConversionResult]

class ExportZipItem(BaseModel):
    markdown_filename: str
    content: str
    word_count: Optional[int] = 0
    duration_ms: Optional[float] = 0

class ExportZipRequest(BaseModel):
    items: List[ExportZipItem]


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health and configuration information endpoint."""
    return HealthResponse(
        status="healthy",
        app_name=APP_NAME,
        version=APP_VERSION,
        engine="Microsoft MarkItDown (v0.1.7+)",
        max_file_size_mb=MAX_FILE_SIZE_MB,
        max_batch_files=MAX_BATCH_FILES,
    )


@router.get("/sample")
async def get_sample_pdf():
    """Returns a rich sample PDF for quick testing and demonstration."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=12,
        textColor=colors.HexColor('#1e3a8a')
    )
    h2_style = ParagraphStyle(
        'Heading2Style',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=14,
        spaceAfter=8,
        textColor=colors.HexColor('#2563eb')
    )
    body_style = styles['Normal']

    story.append(Paragraph("MarkItDown Demonstration Document", title_style))
    story.append(Paragraph("This is a sample PDF document demonstrating the conversion capabilities of Microsoft MarkItDown integrated with our Progressive Web App.", body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Key Capabilities", h2_style))
    story.append(Paragraph("1. Fast in-memory parsing with minimal latency.<br/>2. Clean conversion of paragraphs, bullet points, and headers.<br/>3. Robust table formatting into GitHub-flavored Markdown.<br/>4. Multi-file batch queues with ZIP export.", body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Performance Comparison", h2_style))
    table_data = [
        ["Engine", "Batch Support", "Speed", "Output Format"],
        ["MarkItDown", "Yes (Parallel)", "Ultra Fast", "Standard Markdown (.md)"],
        ["Legacy OCR", "Limited", "Slow", "Raw Text (.txt)"],
        ["Standard Parser", "Partial", "Moderate", "HTML / Plain"]
    ]
    t = Table(table_data, colWidths=[120, 100, 90, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Conclusion", h2_style))
    story.append(Paragraph("Install this application as a PWA to enjoy offline reading, native windowing, and instant conversions anytime.", body_style))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="markitdown_sample.pdf"'
        }
    )



@router.post("/convert", response_model=ConversionResult)
async def convert_single_pdf(file: UploadFile = File(...)):
    """
    Convert a single PDF file to Markdown.
    Returns JSON containing the generated Markdown and file conversion metadata.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    try:
        content = await file.read()
        res = converter_service.convert_pdf_bytes(
            content=content,
            original_filename=file.filename
        )
        return ConversionResult(**res)
    except HTTPException:
        raise
    except ConversionError as ce:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ce)
        )
    except Exception as e:
        logger.error(f"Unexpected error during single conversion: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal conversion error: {str(e)}"
        )


@router.post("/convert/download")
async def convert_and_download_pdf(file: UploadFile = File(...)):
    """
    Directly converts a PDF and triggers an immediate .md file download.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    try:
        content = await file.read()
        res = converter_service.convert_pdf_bytes(
            content=content,
            original_filename=file.filename
        )
        md_filename = res["markdown_filename"]
        md_bytes = res["content"].encode("utf-8")
        
        return StreamingResponse(
            io.BytesIO(md_bytes),
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{md_filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in convert and download: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversion failed: {str(e)}"
        )


@router.post("/convert/batch", response_model=BatchConversionResponse)
async def convert_batch_pdfs(files: List[UploadFile] = File(...)):
    """
    Batch conversion of multiple PDF documents.
    Processes each document and returns a structured array of outcomes.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded."
        )

    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Exceeded maximum batch limit of {MAX_BATCH_FILES} files."
        )

    overall_start = time.perf_counter()
    results: List[ConversionResult] = []
    successful_count = 0
    failed_count = 0

    for file in files:
        raw_name = file.filename or "document.pdf"
        clean_name = sanitize_filename(raw_name)
        stem = clean_name.rsplit(".", 1)[0]
        md_name = f"{stem}.md"

        try:
            content = await file.read()
            res = converter_service.convert_pdf_bytes(content=content, original_filename=raw_name)
            results.append(ConversionResult(**res))
            successful_count += 1
        except Exception as e:
            failed_count += 1
            logger.warning(f"Batch item failed for {raw_name}: {str(e)}")
            results.append(ConversionResult(
                success=False,
                filename=clean_name,
                markdown_filename=md_name,
                content="",
                word_count=0,
                char_count=0,
                line_count=0,
                size_bytes=0,
                duration_ms=0,
                error=str(getattr(e, "detail", str(e)))
            ))

    total_duration_ms = round((time.perf_counter() - overall_start) * 1000, 2)

    return BatchConversionResponse(
        total_files=len(files),
        successful_count=successful_count,
        failed_count=failed_count,
        total_duration_ms=total_duration_ms,
        results=results
    )


@router.post("/export/zip")
async def export_zip_archive(payload: ExportZipRequest):
    """
    Given a list of converted markdown files, bundles them into a ZIP archive for immediate download.
    """
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No items provided to export."
        )

    dict_items = [item.model_dump() for item in payload.items]
    zip_bytes = create_markdown_zip(dict_items)

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="markitdown_converted_files.zip"'
        }
    )
