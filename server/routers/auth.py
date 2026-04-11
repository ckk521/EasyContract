import re
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
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
from server.schemas.user import (
    LoginRequest,
    RegisterRequest,
    UserResponse,
    Token,
    AuthResponse,
    ChangePasswordRequest,
)

router = APIRouter(prefix="/api/auth", tags=["认证"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def is_valid_email(username: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, username))


def is_valid_phone(username: str) -> bool:
    pattern = r"^1[3-9]\d{9}$"
    return bool(re.match(pattern, username))


def validate_username(username: str) -> bool:
    return is_valid_email(username) or is_valid_phone(username)


def get_current_user(
    token: str = Depends(oauth2_scheme),
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


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """C端用户注册"""
    # 验证用户名格式
    if not validate_username(request.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请输入有效的手机号或邮箱地址",
        )

    # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        if is_valid_email(request.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已注册",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该手机号已注册",
            )

    # 创建用户
    hashed_password = get_password_hash(request.password)
    user = User(
        username=request.username,
        password_hash=hashed_password,
        user_type="C",
        is_active=True,
        first_login=False,  # C端用户首次登录不需要改密
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        success=True,
        message="注册成功",
        data=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """C端用户登录"""
    # 查找用户
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号不存在",
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

    # 计算token过期时间
    if request.remember_me:
        expire_days = settings.REMEMBER_ME_TOKEN_EXPIRE_DAYS
    else:
        expire_days = settings.ACCESS_TOKEN_EXPIRE_DAYS

    # 创建token (sub必须是字符串)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "user_type": user.user_type},
        expires_delta=timedelta(days=expire_days),
    )

    return AuthResponse(
        success=True,
        message="登录成功",
        data=UserResponse.model_validate(user),
        token=Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=expire_days * 24 * 60 * 60,
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """退出登录（前端删除token即可）"""
    return {"success": True, "message": "退出成功"}
