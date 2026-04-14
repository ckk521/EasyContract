from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ContractTypeEnum(str, Enum):
    """合同类型枚举"""
    RENTAL = "RENTAL"
    EMPLOYMENT = "EMPLOYMENT"
    SALES = "SALES"
    SERVICE = "SERVICE"
    PARTNERSHIP = "PARTNERSHIP"
    LOAN = "LOAN"
    GIFT = "GIFT"
    OTHER = "OTHER"


class ContractStatus(str, Enum):
    """合同状态枚举"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    ARCHIVED = "archived"


# ============ ContractType Schemas ============

class ContractTypeBase(BaseModel):
    """合同类型基础Schema"""
    code: str = Field(..., min_length=1, max_length=50, description="类型编码")
    name: str = Field(..., min_length=1, max_length=100, description="类型名称")
    description: Optional[str] = Field(None, description="类型描述")


class ContractTypeCreate(ContractTypeBase):
    """创建合同类型"""
    pass


class ContractTypeUpdate(BaseModel):
    """更新合同类型"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ContractTypeResponse(ContractTypeBase):
    """合同类型响应"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============ ContractTemplate Schemas ============

class PlaceholderInfo(BaseModel):
    """占位符信息"""
    name: str
    display_name: str
    field_type: str
    required: bool = False
    description: Optional[str] = None


class ContractTemplateBase(BaseModel):
    """合同模板基础Schema"""
    name: str = Field(..., min_length=1, max_length=200, description="模板名称")
    description: Optional[str] = Field(None, description="模板描述")
    template_type: str = Field(..., description="模板类型")
    content: str = Field(..., description="模板内容（Markdown）")


class ContractTemplateCreate(ContractTemplateBase):
    """创建合同模板"""
    contract_type_id: Optional[int] = Field(None, description="关联的合同类型ID")


class ContractTemplateUpdate(BaseModel):
    """更新合同模板"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    content: Optional[str] = None
    contract_type_id: Optional[int] = None


class ContractTemplateResponse(ContractTemplateBase):
    """合同模板响应"""
    id: int
    version: int
    status: str
    placeholders: Optional[List[PlaceholderInfo]] = None
    contract_type_id: Optional[int] = None
    created_by: Optional[int] = None
    # Word 文档支持
    raw_docx_path: Optional[str] = None
    html_content: Optional[str] = None
    placeholder_field_map: Optional[Dict[str, Any]] = None
    is_complete: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TemplateParseResult(BaseModel):
    """模板解析结果"""
    placeholders: List[PlaceholderInfo]
    total_count: int
    required_count: int


# ============ ContractDraft Schemas ============

class DraftFieldUpdate(BaseModel):
    """更新单个字段"""
    field_name: str
    value: Any


class ContractDraftBase(BaseModel):
    """合同草稿基础Schema"""
    name: str = Field(..., min_length=1, max_length=200, description="草稿名称")
    template_id: int = Field(..., description="关联的模板ID")


class DraftCreate(BaseModel):
    """创建草稿请求"""
    name: str = Field(..., min_length=1, max_length=200, description="草稿名称")
    template_id: int = Field(..., description="关联的模板ID")
    user_id: int = Field(..., description="用户ID")
    conversation_id: Optional[str] = Field(None, description="关联的会话ID")


class DraftUpdate(BaseModel):
    """更新草稿"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    form_data: Optional[Dict[str, Any]] = None


class DraftResponse(BaseModel):
    """草稿响应"""
    id: int
    name: str
    status: str
    template_id: int
    user_id: int
    conversation_id: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    generated_content: Optional[str] = None
    filled_fields: int
    total_fields: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class FieldValuesUpdate(BaseModel):
    """字段值更新"""
    model_config = ConfigDict(extra="allow")  # 允许额外的字段


class ValidationError(BaseModel):
    """验证错误"""
    field: str
    message: str


class ValidationResult(BaseModel):
    """验证结果"""
    is_valid: bool
    errors: List[ValidationError] = []


class DraftSubmitRequest(BaseModel):
    """提交审核请求"""
    confirm: bool = Field(True, description="确认提交")


class DraftSubmitResponse(BaseModel):
    """提交审核响应"""
    draft_id: int
    status: str
    message: str


# ============ 列表响应 ============

class ContractTypeListResponse(BaseModel):
    """合同类型列表响应"""
    items: List[ContractTypeResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class ContractTemplateListResponse(BaseModel):
    """合同模板列表响应"""
    items: List[ContractTemplateResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class ContractDraftListResponse(BaseModel):
    """合同草稿列表响应"""
    items: List[DraftResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


# 向后兼容别名
ContractDraftCreate = DraftCreate
ContractDraftUpdate = DraftUpdate
ContractDraftResponse = DraftResponse


# ============ Word 文档模板 Schemas ============

class DocxPlaceholderInfo(BaseModel):
    """docx 解析出的占位符信息"""
    index: int = Field(..., description="占位符索引")
    context: str = Field(..., description="占位符前后文")
    original_text: Optional[str] = Field(None, description="原始下划线文本")


class DocxUploadParseResult(BaseModel):
    """docx 文件解析结果"""
    html_content: str = Field(..., description="转换后的 HTML")
    placeholders: List[DocxPlaceholderInfo] = Field(..., description="占位符列表")
    placeholder_count: int = Field(..., description="占位符数量")


class CreateFromDocxRequest(BaseModel):
    """从 docx 创建模板请求"""
    name: str = Field(..., min_length=1, max_length=200, description="模板名称")
    description: Optional[str] = Field(None, description="模板描述")
    template_type: str = Field(..., description="模板类型")
    raw_docx_path: str = Field(..., description="原始 docx 文件路径")
    html_content: str = Field(..., description="转换后的 HTML")
    placeholders: List[DocxPlaceholderInfo] = Field(..., description="占位符列表")
    contract_type_id: Optional[int] = Field(None, description="关联的合同类型ID")


class PlaceholderAssignRequest(BaseModel):
    """占位符分配字段请求"""
    field_id: int = Field(..., description="要分配的字段ID")


class PlaceholderAssignResponse(BaseModel):
    """占位符分配响应"""
    template_id: int
    placeholder_index: int
    field_id: Optional[int]
    is_complete: bool
