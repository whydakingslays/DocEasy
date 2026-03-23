from datetime import datetime

from pydantic import BaseModel


class FileUpload(BaseModel):
    file_id: int
    stored_filename: str
    original_filename: str

    class Config:
        from_attributes = True


class FileListItem(BaseModel):
    file_id: int
    original_filename: str
    tool: str | None
    created_at: datetime
    expired_at: datetime

    class Config:
        from_attributes = True


class FileDeleteResponse(BaseModel):
    message: str
