import shutil
from pathlib import Path

from sqlmodel import Session

from .models.files import File


def save_file(file_obj, path: Path) -> None:
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file_obj, buffer)


def add_db_entry(
    *,
    user_id: int,
    tool: str | None,
    path: str,
    original_name: str,
    session: Session,
) -> File:
    db_entry = File(
        user_id=user_id,
        tool=tool,
        path=path,
        original_filename=original_name,
    )

    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)

    return db_entry
