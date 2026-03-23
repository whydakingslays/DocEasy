from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi import File as FastAPIFile
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from ..database import get_session
from ..models.files import File
from ..models.users import User
from ..schemas.files import FileDeleteResponse, FileListItem, FileUpload
from ..security import get_current_user
from ..utility import add_db_entry, save_file

UPLOAD_DIR = Path("storage/uploads")

router_auth = APIRouter()


def save_file_and_entry(*, user_id: int, file: UploadFile, session: Session) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    file_stem = Path(file.filename).stem or "uploaded_file"
    file_ext = Path(file.filename).suffix.lower()

    db_entry = add_db_entry(
        user_id=user_id,
        tool=None,
        path="",
        original_name=file.filename,
        session=session,
    )

    stored_filename = f"{db_entry.file_id}_{file_stem}{file_ext}"
    file_path = UPLOAD_DIR / stored_filename

    try:
        save_file(file.file, file_path)
    finally:
        file.file.close()

    db_entry.path = str(file_path.resolve())
    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)

    return {
        "file_id": db_entry.file_id,
        "stored_filename": stored_filename,
        "original_filename": db_entry.original_filename,
    }


def get_owned_file(*, file_id: int, user_id: int, session: Session) -> File:
    current_file = session.get(File, file_id)

    if not current_file or current_file.user_id != user_id:
        raise HTTPException(status_code=404, detail="File not found")

    return current_file


@router_auth.post("/users/me/files", response_model=FileUpload)
async def upload_file_auth(
    current_user: User = Depends(get_current_user),
    file: UploadFile = FastAPIFile(...),
    session: Session = Depends(get_session),
):
    return save_file_and_entry(user_id=current_user.user_id, file=file, session=session)


@router_auth.get("/users/me/files/{file_id}")
async def download_file_auth(
    file_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    current_file = get_owned_file(
        file_id=file_id,
        user_id=current_user.user_id,
        session=session,
    )

    file_path = Path(current_file.path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Stored file not found")

    download_name = current_file.original_filename or file_path.name
    return FileResponse(path=file_path, filename=download_name, media_type="application/octet-stream")


@router_auth.get("/users/me/files", response_model=list[FileListItem])
async def list_files_auth(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(File)
        .where(File.user_id == current_user.user_id)
        .order_by(File.created_at.desc())
    )
    return session.exec(statement).all()


@router_auth.delete("/users/me/files/{file_id}", response_model=FileDeleteResponse)
async def delete_file_auth(
    file_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    current_file = get_owned_file(
        file_id=file_id,
        user_id=current_user.user_id,
        session=session,
    )

    file_path = Path(current_file.path)
    if file_path.exists():
        file_path.unlink()

    session.delete(current_file)
    session.commit()

    return {"message": "File deleted"}
