from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class FieldType(str, Enum):
    """字段类型枚举"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    RADIO = "radio"
    CHECKBOX = "checkbox"
    TEXTAREA = "textarea"
    FILE = "file"


class ConditionOperator(str, Enum):
    """条件运算符"""
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"


class LogicOperator(str, Enum):
    """逻辑运算符"""
    AND = "AND"
    OR = "OR"


# ============ FieldDefinition Schemas ============

class ValidationRules(BaseModel):
    """验证规则"""
    min_length: Optional[int] = Field(None, ge=0, description="最小长度")
    max_length: Optional[int] = Field(None, ge=1, description="最大长度")
    min: Optional[float] = Field(None, description="最小值")
    max: Optional[float] = Field(None, description="最大值")
    pattern: Optional[str] = Field(None, description="正则表达式")
    options: Optional[List[Dict[str, str]]] = Field(None, description="下拉选项")


class FieldDefinitionBase(BaseModel):
    """字段定义基础Schema"""
    field_name: str = Field(..., min_length=1, max_length=100, description="字段名称（英文）")
    display_name: str = Field(..., min_length=1, max_length=100, description="显示名称（中文）")
    field_type: FieldType = Field(..., description="字段类型")
    description: Optional[str] = Field(None, description="字段描述")
    placeholder: Optional[str] = Field(None, max_length=200, description="占位符提示")
    required: bool = Field(False, description="是否必填")


class FieldDefinitionCreate(FieldDefinitionBase):
    """创建字段定义"""
    validation_rules: Optional[ValidationRules] = None
    group_id: Optional[int] = Field(None, description="所属分组ID")
    template_id: Optional[int] = Field(None, description="关联的模板ID")
    preset_id: Optional[int] = Field(None, description="关联的预设字段ID")


class FieldDefinitionUpdate(BaseModel):
    """更新字段定义"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    field_type: Optional[FieldType] = None
    description: Optional[str] = None
    placeholder: Optional[str] = Field(None, max_length=200)
    required: Optional[bool] = None
    validation_rules: Optional[ValidationRules] = None
    group_id: Optional[int] = None


class FieldDefinitionResponse(FieldDefinitionBase):
    """字段定义响应"""
    id: int
    validation_rules: Optional[Dict[str, Any]] = None
    group_id: Optional[int] = None
    template_id: Optional[int] = None
    preset_id: Optional[int] = None
    sort_order: int
    is_default: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SimilarFieldItem(BaseModel):
    """相似字段项（简化版，用于相似度查询）"""
    id: int
    field_name: str
    display_name: str
    field_type: str
    description: Optional[str] = None
    required: bool = False


class SimilarFieldResult(BaseModel):
    """相似字段查询结果"""
    field: SimilarFieldItem
    similarity_score: float = Field(..., description="相似度分数 0.0-1.0")


# ============ FieldGroup Schemas ============

class FieldGroupBase(BaseModel):
    """字段分组基础Schema"""
    name: str = Field(..., min_length=1, max_length=100, description="分组名称")
    description: Optional[str] = Field(None, description="分组描述")


class FieldGroupCreate(FieldGroupBase):
    """创建字段分组"""
    template_id: Optional[int] = Field(None, description="关联的模板ID")


class FieldGroupUpdate(BaseModel):
    """更新字段分组"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class FieldGroupResponse(FieldGroupBase):
    """字段分组响应"""
    id: int
    sort_order: int
    template_id: Optional[int] = None
    fields: Optional[List[FieldDefinitionResponse]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============ FieldCondition Schemas ============

class ConditionRule(BaseModel):
    """条件规则"""
    field: str = Field(..., description="关联的字段名")
    operator: ConditionOperator = Field(..., description="运算符")
    value: Any = Field(..., description="比较值")


class FieldConditionBase(BaseModel):
    """字段条件基础Schema"""
    field_id: int = Field(..., description="关联的字段ID")
    condition_type: str = Field(..., description="条件类型: display/required")


class FieldConditionCreate(FieldConditionBase):
    """创建字段条件"""
    conditions: List[ConditionRule] = Field(..., description="条件规则列表")
    logic_operator: LogicOperator = Field(LogicOperator.AND, description="逻辑运算符")


class FieldConditionUpdate(BaseModel):
    """更新字段条件"""
    conditions: Optional[List[ConditionRule]] = None
    logic_operator: Optional[LogicOperator] = None


class FieldConditionResponse(FieldConditionBase):
    """字段条件响应"""
    id: int
    conditions: List[Dict[str, Any]]
    logic_operator: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============ FieldPreset Schemas ============

class FieldPresetBase(BaseModel):
    """字段预设基础Schema"""
    field_name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=100)
    field_type: FieldType = Field(...)
    description: Optional[str] = None
    category: Optional[str] = Field(None, description="分类")


class FieldPresetCreate(FieldPresetBase):
    """创建字段预设"""
    default_validation_rules: Optional[ValidationRules] = None


class FieldPresetResponse(FieldPresetBase):
    """字段预设响应"""
    id: int
    default_validation_rules: Optional[Dict[str, Any]] = None
    content_hash: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ 列表响应 ============

class FieldDefinitionListResponse(BaseModel):
    """字段定义列表响应"""
    items: List[FieldDefinitionResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class FieldGroupListResponse(BaseModel):
    """字段分组列表响应"""
    items: List[FieldGroupResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class FieldPresetListResponse(BaseModel):
    """字段预设列表响应"""
    items: List[FieldPresetResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


# ============ 字段排序 ============

class FieldReorderRequest(BaseModel):
    """字段排序请求"""
    field_ids: List[int] = Field(..., description="字段ID列表，按新顺序排列")


class GroupReorderRequest(BaseModel):
    """分组排序请求"""
    group_ids: List[int] = Field(..., description="分组ID列表，按新顺序排列")
