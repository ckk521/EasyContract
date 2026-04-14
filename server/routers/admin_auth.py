from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from server.core.config import settings
from server.core.database import get_db
from server.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from server.models.user import User

router = APIRouter(prefix="/api/admin", tags=["B端管理员认证"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/admin/login")


def get_current_admin(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token已过期或无效",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_type = payload.get("user_type")
    if user_type != "B":
        raise HTTPException(status_code=403, detail="无权限访问B端")

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")

    return user


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    message: str
    data: dict | None = None
    token: dict | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


class ChangePasswordResponse(BaseModel):
    success: bool
    message: str


def validate_b_password(password: str) -> bool:
    """验证B端密码格式：至少8位，包含大小写字母和数字"""
    import re
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    """B端管理员登录"""
    # 查找用户
    user = db.query(User).filter(
        User.username == request.username,
        User.user_type == "B"
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员账号不存在",
        )

    # 验证密码
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误",
        )

    # 检查用户状态
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用",
        )

    # 创建token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "user_type": user.user_type
        },
        expires_delta=timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS),
    )

    return AdminLoginResponse(
        success=True,
        message="登录成功",
        data={
            "id": user.id,
            "username": user.username,
            "first_login": user.first_login,
        },
        token={
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        },
    )


@router.post("/change-password", response_model=ChangePasswordResponse)
def admin_change_password(
    request: ChangePasswordRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """B端管理员修改密码（首次登录或普通修改）"""
    # 验证当前密码
    if not verify_password(request.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码错误",
        )

    # 验证新密码格式
    if not validate_b_password(request.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码至少8位，需包含大小写字母和数字",
        )

    # 验证新密码不能与当前密码相同
    if verify_password(request.new_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码不能与当前密码相同",
        )

    # 验证确认密码
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="两次输入的新密码不一致",
        )

    # 更新密码
    current_admin.password_hash = get_password_hash(request.new_password)
    current_admin.first_login = False
    db.commit()

    return ChangePasswordResponse(
        success=True,
        message="密码修改成功",
    )


@router.get("/me")
def get_admin_me(current_admin: User = Depends(get_current_admin)):
    """获取当前管理员信息"""
    return {
        "id": current_admin.id,
        "username": current_admin.username,
        "user_type": current_admin.user_type,
        "first_login": current_admin.first_login,
    }
