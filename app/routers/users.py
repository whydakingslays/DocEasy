from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from ..database import get_session
from ..models.users import User
from ..schemas.token import Token
from ..schemas.users import UserCreate, UserRead
from ..security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_user_by_email,
    get_password_hash,
    get_user_by_username,
)

router = APIRouter(prefix="/users")


@router.post("/register", response_model=UserRead)
async def register(
    current_user: UserCreate,
    session: Session = Depends(get_session),
):
    if get_user_by_username(current_user.username, session):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered",
        )
    if get_user_by_email(current_user.email, session):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    hashed_password = get_password_hash(current_user.password)

    new_user = User(
        username=current_user.username,
        email=current_user.email,
        hashed_password=hashed_password,
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Session = Depends(get_session),
):
    user = authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserRead)
async def current_active_user(
    current_user: User = Depends(get_current_user),
):
    return current_user
