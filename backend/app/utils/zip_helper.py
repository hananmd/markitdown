import io
import zipfile
from datetime import datetime, timezone
from typing import List, Dict, Any

def create_markdown_zip(conversions: List[Dict[str, Any]]) -> bytes:
    """
    Creates an in-memory ZIP archive containing all converted markdown files,
    handling filename deduplication and adding a summary manifest.
    """
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
        used_filenames = set()
        manifest_lines = [
            "MarkItDown PWA - Batch Conversion Export",
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"Total Files: {len(conversions)}",
            "-" * 50,
        ]
        
        for item in conversions:
            raw_filename = item.get("markdown_filename", "document.md")
            
            # Handle duplicates
            target_name = raw_filename
            counter = 1
            stem, ext = (raw_filename.rsplit(".", 1) + ["md"])[:2]
            while target_name in used_filenames:
                target_name = f"{stem}_{counter}.{ext}"
                counter += 1
            used_filenames.add(target_name)
            
            content = item.get("content", "")
            archive.writestr(target_name, content.encode("utf-8"))
            
            words = item.get("word_count", len(content.split()))
            duration = item.get("duration_ms", 0)
            manifest_lines.append(f"- {target_name} ({words} words, {duration}ms)")
            
        manifest_lines.append("-" * 50)
        manifest_lines.append("Converted with Microsoft MarkItDown via MarkItDown PWA")
        archive.writestr("CONVERSION_MANIFEST.txt", "\n".join(manifest_lines).encode("utf-8"))

    zip_buffer.seek(0)
    return zip_buffer.getvalue()
