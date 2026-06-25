import sys
import os

# Use /tmp for uploads — Vercel Lambda filesystem is read-only outside /tmp
os.environ.setdefault("UPLOAD_DIR", "/tmp/uploads")

# Add backend root to path so `from app.x import y` resolves correctly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app  # noqa: F401  — Vercel picks up the `app` ASGI callable
