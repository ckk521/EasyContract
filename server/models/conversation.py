"""
对话会话模型 - C端用户与智能体的会话
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from server.core.database import Base


class Conversation(Base):
    """
    对话会话表
    """
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="active")  # active/completed
    current_intent = Column(String(50), nullable=True)  # 当前意图
    context_data = Column(Text, nullable=True)  # JSON: 收集的字段、待填写字段等
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    user = relationship("User", backref="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    """
    消息表 - 存储对话消息
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user/assistant/system
    content = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)  # 识别的意图
    confidence = Column(String(10), nullable=True)  # 置信度
    extracted_entities = Column(Text, nullable=True)  # JSON: 提取的实体
    tool_calls = Column(Text, nullable=True)  # JSON: 调用的工具
    tool_results = Column(Text, nullable=True)  # JSON: 工具返回结果
    reflection = Column(Text, nullable=True)  # 反思结果：回答是否满足用户
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    conversation = relationship("Conversation", back_populates="messages")
