import sys
import os

# Use /tmp for uploads since Vercel's Lambda filesystem is read-only outside /tmp
os.environ.setdefault("UPLOAD_DIR", "/tmp/uploads")

# Add backend/ to path so `from app.x import y` resolves correctly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from starlette.applications import Starlette
from starlette.routing import Mount
from app.main import app as _fastapi_app

# Mount FastAPI at /api so Vercel can route /api/* → this handler
# Starlette strips the /api prefix before FastAPI sees the path
app = Starlette(routes=[Mount("/api", app=_fastapi_app)])
