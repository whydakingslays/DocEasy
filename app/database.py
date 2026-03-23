from datetime import timedelta

from sqlmodel import SQLModel, Session, create_engine, select

from .models import files, users
from .models.files import FILE_EXPIRY_DAYS, File

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args = connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def sync_file_expiry_policy() -> None:
    with Session(engine) as session:
        db_files = session.exec(select(File)).all()
        for current_file in db_files:
            desired_expiry = current_file.created_at + timedelta(days=FILE_EXPIRY_DAYS)
            if current_file.expired_at != desired_expiry:
                current_file.expired_at = desired_expiry
                session.add(current_file)
        session.commit()


def get_session():
    with Session(engine) as session:
        yield session
