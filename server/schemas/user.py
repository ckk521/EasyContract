from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ============ User Schemas ============

class UserBase(BaseModel):
    username: str = Field(..., min_length=1, description="用户名（手机号或邮箱）")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="密码")


class UserLogin(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    user_type: str
    is_active: bool
    first_login: bool

    class Config:
        from_attributes = True


# ============ Auth Schemas ============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # 过期时间（秒）


class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class RegisterRequest(BaseModel):
    username: str
    password: str = Field(..., min_length=6)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    data: Optional[UserResponse] = None
    token: Optional[Token] = None
