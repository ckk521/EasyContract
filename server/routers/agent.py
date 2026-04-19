"""
智能体对话路由 - C端用户与智能体的对话接口
"""
import json
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from server.core.database import get_db
from server.core.security import decode_access_token
from server.models.conversation import Conversation, Message
from server.models.user import User
from server.services.agent import LegalAgent, AgentContext, get_legal_agent
from server.services.tools import get_welcome_message

router = APIRouter(prefix="/api/agent", tags=["智能体对话"])


def response_success(data=None, message="操作成功"):
    return {"success": True, "message": message, "data": data}


def response_error(message: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code, detail={"success": False, "message": message}
    )


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """获取当前登录用户（支持 Bearer token）"""
    if not authorization:
        return None

    # 解析 Bearer token
    try:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization

        payload = decode_access_token(token)
        if payload is None:
            return None

        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None

        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except:
        return None


@router.get("/welcome")
def get_welcome():
    """获取欢迎语"""
    return response_success(data={"message": get_welcome_message()})


@router.post("/conversations", response_model=dict, status_code=201)
def create_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    创建新会话
    """
    user_id = current_user.id if current_user else 0  # 未登录用户用0

    conversation = Conversation(
        user_id=user_id,
        status="active",
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return response_success(
        data={
            "conversation_id": conversation.id,
            "status": conversation.status,
            "created_at": conversation.created_at,
        },
        message="会话创建成功"
    )


@router.get("/conversations", response_model=dict)
def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取用户的会话列表
    """
    if not current_user:
        response_error("请先登录", 401)

    query = db.query(Conversation).filter(
        Conversation.user_id == current_user.id,
        Conversation.status != "deleted"
    )

    total = query.count()
    conversations = (
        query.order_by(Conversation.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Build response with titles
    items = []
    for c in conversations:
        # Get the first user message as title
        first_message = db.query(Message).filter(
            Message.conversation_id == c.id,
            Message.role == "user"
        ).order_by(Message.created_at.asc()).first()

        title = "法律咨询"
        if first_message and first_message.content:
            # Truncate to 30 chars
            title = first_message.content[:30]
            if len(first_message.content) > 30:
                title += "..."

        items.append({
            "id": c.id,
            "status": c.status,
            "current_intent": c.current_intent,
            "title": title,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        })

    return response_success(
        data={
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    )


@router.get("/conversations/{conversation_id}/messages", response_model=dict)
def get_messages(
    conversation_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取会话的消息历史
    """
    if not current_user:
        response_error("请先登录", 401)

    # 验证会话归属
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        response_error("会话不存在", 404)

    query = db.query(Message).filter(
        Message.conversation_id == conversation_id
    )

    total = query.count()
    messages = (
        query.order_by(Message.created_at.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return response_success(
        data={
            "items": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "intent": m.intent,
                    "confidence": m.confidence,
                    "tool_calls": json.loads(m.tool_calls) if m.tool_calls else None,
                    "created_at": m.created_at,
                }
                for m in messages
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    )


@router.post("/conversations/{conversation_id}/chat", response_class=StreamingResponse)
async def chat(
    conversation_id: int,
    message: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    发送消息并获取流式响应（SSE）

    返回SSE格式：
    - event: intent - 意图识别结果
    - event: content - 消息内容片段
    - event: tool_calls - 工具调用
    - event: reflection - 反思结果
    - event: done - 结束信号
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")

    # 验证会话归属
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 获取对话历史
    history_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).limit(20).all()

    history = [
        {
            "role": m.role,
            "content": m.content,
            "intent": m.intent,
        }
        for m in history_messages
    ]

    # 保存用户消息
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=message,
    )
    db.add(user_message)

    # 更新会话状态
    conversation.updated_at = datetime.utcnow()

    # 解析上下文数据
    context_data = json.loads(conversation.context_data) if conversation.context_data else {}
    context_data["conversation_id"] = conversation_id

    db.commit()

    # 构建Agent上下文
    context = AgentContext(
        user_id=current_user.id,
        conversation_id=conversation_id,
        intent=conversation.current_intent,
        collected_fields=context_data.get("collected_fields", {}),
        pending_fields=context_data.get("pending_fields", []),
        selected_template_id=context_data.get("selected_template_id"),
    )

    # 获取Agent实例
    agent = get_legal_agent()

    # 流式处理 - 收集回复内容并保存
    async def event_generator():
        assistant_content = ""
        try:
            async for chunk in agent.stream_process(
                user_input=message,
                context=context,
                conversation_history=history
            ):
                # 收集content事件的内容
                if chunk.startswith("event: content"):
                    try:
                        data_line = [l for l in chunk.split("\n") if l.startswith("data:")][0]
                        data = json.loads(data_line[5:])
                        assistant_content += data.get("content", "")
                    except:
                        pass
                yield chunk

            # 流式结束后保存智能体回复
            if assistant_content:
                from server.core.database import SessionLocal
                db_session = SessionLocal()
                try:
                    assistant_message = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=assistant_content,
                    )
                    db_session.add(assistant_message)
                    db_session.commit()
                finally:
                    db_session.close()

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.delete("/conversations/{conversation_id}", response_model=dict)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    删除会话
    """
    if not current_user:
        response_error("请先登录", 401)

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        response_error("会话不存在", 404)

    # 软删除：将会话状态改为completed
    conversation.status = "deleted"
    db.commit()

    return response_success(message="会话已删除")
