from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..database import get_session
from ..models.files import File
from ..models.users import User
from ..schemas.files import FileUpload
from ..security import get_current_user
from ..services.compress_img import compress_img
from ..services.compress_pdf import compress_pdf
from ..services.ocr import ocr_to_pdf
from ..services.pdf_to_word import pdf_to_word
from ..services.word_to_pdf import word_to_pdf
from ..utility import add_db_entry, save_file

RESULTS_DIR = Path("storage/results")

router_auth = APIRouter()


def process_tool(
    *,
    file_id: int,
    user_id: int,
    process_fn,
    tool: str,
    output_ext: str,
    session: Session,
) -> dict:
    source_file = session.get(File, file_id)

    if not source_file or source_file.user_id != user_id:
        raise HTTPException(status_code=404, detail="File not found")

    source_path = Path(source_file.path)
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Source file is missing")

    try:
        output_buffer = process_fn(source_file)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc

    original_stem = Path(source_file.original_filename).stem or f"file_{source_file.file_id}"
    output_original_name = f"{original_stem}_{tool}{output_ext}"

    db_entry = add_db_entry(
        user_id=user_id,
        tool=tool,
        path="",
        original_name=output_original_name,
        session=session,
    )

    stored_filename = f"{db_entry.file_id}_{Path(output_original_name).stem}{output_ext}"
    output_path = RESULTS_DIR / stored_filename

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    save_file(output_buffer, output_path)

    db_entry.path = str(output_path.resolve())
    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)

    return {
        "file_id": db_entry.file_id,
        "stored_filename": stored_filename,
        "original_filename": db_entry.original_filename,
    }


@router_auth.post("/users/me/tools/compress_image/{file_id}", response_model=FileUpload)
async def compress_image_auth(
    file_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return process_tool(
        file_id=file_id,
        user_id=current_user.user_id,
        process_fn=lambda current_file: compress_img(current_file, quality=50),
        tool="compressed",
        output_ext=".jpeg",
        session=session,
    )


@router_auth.post("/users/me/tools/compress_pdf/{file_id}", response_model=FileUpload)
async def compress_pdf_file_auth(
    file_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return process_tool(
        file_id=file_id,
        user_id=current_user.user_id,
        process_fn=lambda current_file: compress_pdf(current_file, quality=50),
        tool="compressed",
        output_ext=".pdf",
        session=session,
    )


@router_auth.post("/users/me/tools/pdf_to_word/{file_id}", response_model=FileUpload)
async def pdf_to_word_file_auth(
    file_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return process_tool(
        file_id=file_id,
        user_id=current_user.user_id,
        process_fn=pdf_to_word,
        tool="converted",
        output_ext=".docx",
        session=session,
    )


@router_auth.post("/users/me/tools/word_to_pdf/{file_id}", response_model=FileUpload)
async def word_to_pdf_file_auth(
    file_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return process_tool(
        file_id=file_id,
        user_id=current_user.user_id,
        process_fn=word_to_pdf,
        tool="converted",
        output_ext=".pdf",
        session=session,
    )


@router_auth.post("/users/me/tools/ocr/{file_id}", response_model=FileUpload)
async def file_to_ocr_auth(
    file_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return process_tool(
        file_id=file_id,
        user_id=current_user.user_id,
        process_fn=ocr_to_pdf,
        tool="ocr",
        output_ext=".pdf",
        session=session,
    )
