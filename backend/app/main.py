from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import create_tables
from app.routers import auth, employees, departments, attendance, leaves, payroll, recruitment, performance, notifications, dashboard, documents
import os

app = FastAPI(
    title="TalentFlow HRMS API",
    description="Complete HR Management System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("./uploads/avatars", exist_ok=True)
os.makedirs("./uploads/documents", exist_ok=True)
os.makedirs("./uploads/resumes", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(departments.router)
app.include_router(attendance.router)
app.include_router(leaves.router)
app.include_router(payroll.router)
app.include_router(recruitment.router)
app.include_router(performance.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(documents.router)


@app.on_event("startup")
async def startup():
    create_tables()


@app.get("/")
async def root():
    return {
        "message": "TalentFlow HRMS API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
