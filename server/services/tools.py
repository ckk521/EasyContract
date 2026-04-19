"""
工具注册中心 - 管理智能体可用的工具
"""
from typing import List, Optional, Dict, Any, Callable
from dataclasses import dataclass
from enum import Enum

from langchain_core.tools import BaseTool, tool
from pydantic import BaseModel, Field

from server.core.database import get_db
from server.models.contract import ContractTemplate
from server.models.field import FieldDefinition


class ToolCategory(str, Enum):
    """工具分类"""
    CONTRACT = "contract"
    LEGAL = "legal"
    REVIEW = "review"
    USER = "user"
    UTILITY = "utility"


@dataclass
class ToolMetadata:
    """工具元数据"""
    name: str
    category: ToolCategory
    description: str
    version: str = "1.0.0"
    enabled: bool = True
    intents: List[str] = None
    parameters: Dict = None
    examples: List[str] = None
    timeout_ms: int = 30000

    def __post_init__(self):
        if self.intents is None:
            self.intents = []
        if self.parameters is None:
            self.parameters = {}
        if self.examples is None:
            self.examples = []


class InputTemplateSearch(BaseModel):
    """搜索模板参数"""
    keywords: List[str] = Field(description="搜索关键词列表", examples=[["租房"], ["劳动"]])
    template_type: Optional[str] = Field(None, description="模板类型: RENTAL/EMPLOYMENT/SALES/SERVICE/PARTNERSHIP/LOAN/GIFT/OTHER")
    limit: int = Field(default=5, ge=1, le=20, description="返回结果数量")


class InputGetFormFields(BaseModel):
    """获取表单字段参数"""
    template_id: int = Field(description="模板ID")


class InputSaveDraft(BaseModel):
    """保存草稿参数"""
    template_id: int = Field(description="模板ID")
    form_data: Dict[str, Any] = Field(description="表单填写数据")
    conversation_id: str = Field(description="会话ID")
    draft_name: Optional[str] = Field(None, description="草稿名称")


@tool(args_schema=InputTemplateSearch)
def template_search(keywords: List[str], template_type: Optional[str] = None, limit: int = 5) -> Dict[str, Any]:
    """
    搜索可用的合同模板。

    使用场景：
    - 用户想要起草合同但不确定有什么模板
    - 用户指定了合同类型（如租房、劳动合同）
    - 用户想要查看特定类型的合同模板

    返回匹配用户需求的模板列表，每个模板包含名称、描述、适用场景。
    """
    db = next(get_db())
    try:
        query = db.query(ContractTemplate).filter(ContractTemplate.status == "published")

        # 关键词搜索
        if keywords:
            for kw in keywords:
                query = query.filter(ContractTemplate.name.contains(kw) | ContractTemplate.description.contains(kw))

        # 类型筛选
        if template_type:
            query = query.filter(ContractTemplate.template_type == template_type)

        templates = query.limit(limit).all()

        result = []
        for t in templates:
            field_count = db.query(FieldDefinition).filter(
                FieldDefinition.template_id == t.id
            ).count()

            result.append({
                "id": t.id,
                "name": t.name,
                "description": t.description or "",
                "template_type": t.template_type,
                "field_count": field_count,
            })

        return {
            "success": True,
            "templates": result,
            "total": len(result),
            "message": f"为您找到 {len(result)} 个合适的模板" if result else "抱歉，暂时没有找到相关模板，我们会尽快补充..."
        }
    finally:
        db.close()


@tool(args_schema=InputGetFormFields)
def get_form_fields(template_id: int) -> Dict[str, Any]:
    """
    获取模板的表单字段定义。

    用于引导用户填写合同信息。
    返回模板的字段列表，包括字段名、显示名、类型、是否必填等。
    """
    db = next(get_db())
    try:
        template = db.query(ContractTemplate).filter(
            ContractTemplate.id == template_id
        ).first()

        if not template:
            return {
                "success": False,
                "error": "模板不存在"
            }

        fields = db.query(FieldDefinition).filter(
            FieldDefinition.template_id == template_id
        ).order_by(FieldDefinition.sort_order).all()

        field_list = []
        required_count = 0
        for f in fields:
            field_data = {
                "field_name": f.field_name,
                "display_name": f.display_name,
                "field_type": f.field_type,
                "required": f.required,
                "placeholder": f.placeholder or f"请输入{f.display_name}",
                "description": f.description or "",
            }
            if f.options:
                field_data["options"] = f.options
            if f.validation_rules:
                field_data["validation"] = f.validation_rules

            field_list.append(field_data)
            if f.required:
                required_count += 1

        return {
            "success": True,
            "template_id": template.id,
            "template_name": template.name,
            "fields": field_list,
            "total_fields": len(field_list),
            "required_fields": required_count
        }
    finally:
        db.close()


@tool(args_schema=InputSaveDraft)
def save_draft(template_id: int, form_data: Dict[str, Any], conversation_id: str, draft_name: Optional[str] = None) -> Dict[str, Any]:
    """
    保存合同草稿。

    当用户填写完表单后调用，将数据保存为草稿。
    """
    from server.models.contract import ContractDraft
    from datetime import datetime

    db = next(get_db())
    try:
        # 检查模板是否存在
        template = db.query(ContractTemplate).filter(
            ContractTemplate.id == template_id
        ).first()

        if not template:
            return {
                "success": False,
                "error": "模板不存在"
            }

        # 统计已填字段
        filled_count = sum(1 for v in form_data.values() if v is not None and v != "")

        # 创建草稿
        draft = ContractDraft(
            template_id=template_id,
            user_id=1,  # TODO: 从会话上下文获取
            draft_name=draft_name or f"草稿_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            form_data_json=form_data,
            status="draft",
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)

        return {
            "success": True,
            "draft_id": str(draft.id),
            "template_id": template_id,
            "draft_name": draft.draft_name,
            "status": "draft",
            "filled_fields": filled_count,
            "message": "草稿保存成功"
        }
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()


def get_contract_tools() -> List[BaseTool]:
    """获取合同相关的工具列表"""
    return [
        template_search,
        get_form_fields,
        save_draft,
    ]


def get_rejection_message() -> str:
    """获取拒绝非法律问题的话术（从B端配置读取）"""
    # TODO: 从配置表读取
    return "您好，我是法律助手，专注于为您提供法律服务哦~\n请问有什么法律问题可以帮到您？"


def get_welcome_message() -> str:
    """获取欢迎语"""
    return """您好！我是法律助手"法小才"，很高兴为您服务。

我可以帮助您：
• 起草各类合同（租赁、劳动合同、买卖合同等）
• 回答法律问题
• 审核合同条款

请问有什么可以帮助您的？"""


# 意图-工具映射
INTENT_TOOLS = {
    "CONTRACT_DRAFT": ["template_search", "get_form_fields", "save_draft"],
    "CONTRACT_REVIEW": [],  # Phase 2
    "CONTRACT_QUERY": [],   # Phase 2
    "DRAFT_RESUME": ["get_form_fields", "save_draft"],
    "GENERAL_CHAT": [],     # 仅对话
}
