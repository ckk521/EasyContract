from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from server.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    user_type = Column(String(20), default="C")  # C: C端用户, B: B端用户
    is_active = Column(Boolean, default=True)
    first_login = Column(Boolean, default=True)  # 首次登录需要改密
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
