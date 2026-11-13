import os
import sys
from pathlib import Path
import uvicorn

# Ensure the project root directory is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def main():
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))

    print("\n" + "=" * 55)
    print("  MarkItDown PWA - PDF to Markdown Server")
    print("=" * 55)
    print(f"  * Web Application: http://localhost:{port}")
    print(f"  * Network Host:    http://{host}:{port}")
    print(f"  * API Docs:        http://localhost:{port}/api/docs")
    print("=" * 55)
    print("  Press CTRL+C to stop the server\n")

    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=True,
    )

if __name__ == "__main__":
    main()
