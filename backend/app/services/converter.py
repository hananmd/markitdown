import io
import time
import logging
from typing import Optional, Dict, Any
from markitdown import MarkItDown
from ..utils.security import sanitize_filename, validate_pdf_file

logger = logging.getLogger(__name__)

class ConversionError(Exception):
    """Custom exception raised when document conversion fails."""
    pass

class DocumentConverter:
    """
    Service wrapper around Microsoft MarkItDown for converting documents to clean Markdown.
    """
    def __init__(self):
        # Initialize MarkItDown engine
        self._md = MarkItDown()

    def convert_pdf_bytes(
        self,
        content: bytes,
        original_filename: str = "document.pdf"
    ) -> Dict[str, Any]:
        """
        Validates and converts PDF byte content into Markdown.
        Returns a dictionary with markdown content and metadata.
        """
        clean_filename = sanitize_filename(original_filename)
        validate_pdf_file(clean_filename, content)

        start_time = time.perf_counter()
        
        try:
            stream = io.BytesIO(content)
            result = self._md.convert_stream(stream, file_extension=".pdf")
            markdown_content = result.text_content or ""
            
            elapsed_time = time.perf_counter() - start_time
            
            # Extract basic metrics
            word_count = len(markdown_content.split())
            char_count = len(markdown_content)
            line_count = len(markdown_content.splitlines())
            
            # Base target name without .pdf
            stem = clean_filename.rsplit(".", 1)[0]
            markdown_filename = f"{stem}.md"
            
            # Try to get title or infer from first markdown heading
            title = getattr(result, "title", None)
            if not title:
                for line in markdown_content.splitlines():
                    stripped = line.strip()
                    if stripped.startswith("#"):
                        title = stripped.lstrip("#").strip()
                        break
            if not title:
                title = stem

            return {
                "success": True,
                "filename": clean_filename,
                "markdown_filename": markdown_filename,
                "title": title,
                "content": markdown_content,
                "word_count": word_count,
                "char_count": char_count,
                "line_count": line_count,
                "size_bytes": len(content),
                "duration_ms": round(elapsed_time * 1000, 2),
            }

        except Exception as e:
            elapsed_time = time.perf_counter() - start_time
            logger.error(f"Failed to convert PDF '{clean_filename}': {str(e)}", exc_info=True)
            raise ConversionError(f"Error processing '{clean_filename}': {str(e)}") from e

# Global singleton converter instance for reuse
converter_service = DocumentConverter()
