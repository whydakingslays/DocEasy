from sqlmodel import SQLModel, Field
from datetime import datetime, timezone

class User(SQLModel, table = True):
    user_id : int | None = Field(default = None, primary_key = True)
    username : str 
    email : str = Field(index = True)
    hashed_password : str
    created_at : datetime = Field(default_factory = lambda : datetime.now(timezone.utc))
