from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.document import Document
from app.models.employee import Employee
from app.models.user import User
from app.core.dependencies import get_current_user
import os
import aiofiles
import uuid

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", status_code=201)
async def upload_document(
    employee_id: str = Form(...),
    name: str = Form(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    upload_dir = f"./uploads/documents/{employee_id}"
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "bin"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    doc = Document(
        employee_id=employee_id,
        company_id=current_user.company_id,
        uploaded_by=current_user.id,
        name=name,
        document_type=document_type,
        description=description,
        file_url=f"/uploads/documents/{employee_id}/{filename}",
        file_size=len(content),
        file_type=ext
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {
        "id": doc.id,
        "name": doc.name,
        "document_type": doc.document_type,
        "file_url": doc.file_url,
        "file_size": doc.file_size,
        "file_type": doc.file_type,
        "created_at": doc.created_at.isoformat()
    }


@router.get("/{employee_id}")
async def get_documents(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(Document).filter(
        Document.employee_id == employee_id,
        Document.company_id == current_user.company_id
    ).all()
    return [{
        "id": d.id,
        "name": d.name,
        "document_type": d.document_type,
        "file_url": d.file_url,
        "file_type": d.file_type,
        "file_size": d.file_size,
        "description": d.description,
        "version": d.version,
        "created_at": d.created_at.isoformat()
    } for d in docs]


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.company_id == current_user.company_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Attempt to remove the physical file
    file_path = f".{doc.file_url}"
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
