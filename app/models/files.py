from datetime import datetime, timedelta, timezone

from sqlmodel import Field, SQLModel

FILE_EXPIRY_DAYS = 3


def expiration_time() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=FILE_EXPIRY_DAYS)


class File(SQLModel, table=True):
    file_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.user_id", index=True)
    tool: str | None = Field(default=None)
    path: str
    original_filename: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expired_at: datetime = Field(default_factory=expiration_time)
