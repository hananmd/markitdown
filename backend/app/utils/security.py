import re
import os
from pathlib import Path
from fastapi import HTTPException, status
from ..config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB

PDF_MAGIC_BYTES = b"%PDF-"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and special character exploitation.
    """
    if not filename:
        return "document.pdf"
    
    # Strip paths
    basename = os.path.basename(filename)
    # Remove null bytes or control characters
    clean_name = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', basename)
    # Replace unsafe characters with underscore, keeping alphanumerics, dots, underscores, dashes
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', clean_name).strip()
    
    if not clean_name:
        clean_name = "document.pdf"
        
    return clean_name

def validate_pdf_file(filename: str, content: bytes) -> None:
    """
    Validates file extension, magic bytes header, and size limits.
    Raises HTTPException if invalid.
    """
    # 1. Check extension
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only PDF documents (.pdf) are accepted."
        )

    # 2. Check size
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The uploaded file '{filename}' is empty."
        )
        
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File '{filename}' exceeds maximum allowed size of {MAX_FILE_SIZE_MB}MB."
        )

    # 3. Check magic bytes (PDF header signature %PDF- anywhere within first 1024 bytes)
    header_sample = content[:1024]
    if PDF_MAGIC_BYTES not in header_sample:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{filename}' does not appear to be a valid PDF format (missing %PDF signature)."
        )
