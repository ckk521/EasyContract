from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
import enum

from server.core.database import Base


class FieldType(str, enum.Enum):
    """字段类型枚举"""
    TEXT = "text"           # 文本输入
    NUMBER = "number"       # 数字输入
    DATE = "date"          # 日期选择
    SELECT = "select"       # 下拉选择
    RADIO = "radio"        # 单选按钮
    CHECKBOX = "checkbox"  # 多选框
    TEXTAREA = "textarea"  # 多行文本
    FILE = "file"          # 文件上传


class FieldDefinition(Base):
    """字段定义"""
    __tablename__ = "field_definitions"

    id = Column(Integer, primary_key=True, index=True)
    field_name = Column(String(100), nullable=False, comment="字段名称（英文）")
    display_name = Column(String(100), nullable=False, comment="显示名称（中文）")
    field_type = Column(String(50), nullable=False, comment="字段类型")
    description = Column(Text, nullable=True, comment="字段描述")
    placeholder = Column(String(200), nullable=True, comment="占位符提示")
    required = Column(Boolean, default=False, comment="是否必填")
    sort_order = Column(Integer, default=0, comment="排序顺序")

    # 是否系统默认字段
    is_default = Column(Boolean, default=False, comment="是否为系统默认字段")

    # 验证规则（JSON格式）
    validation_rules = Column(JSON, nullable=True, comment="验证规则")

    # 所属分组
    group_id = Column(Integer, ForeignKey("field_groups.id"), nullable=True)

    # 关联模板（如果为空则是公共字段）"
    template_id = Column(Integer, ForeignKey("contract_templates.id"), nullable=True)

    # 预设字段ID（用于去重）"
    preset_id = Column(Integer, nullable=True, comment="关联的预设字段ID")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FieldGroup(Base):
    """字段分组"""
    __tablename__ = "field_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="分组名称")
    description = Column(Text, nullable=True, comment="分组描述")
    sort_order = Column(Integer, default=0, comment="排序顺序")

    # 关联模板
    template_id = Column(Integer, ForeignKey("contract_templates.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FieldCondition(Base):
    """字段条件（用于条件显示/必填）"""
    __tablename__ = "field_conditions"

    id = Column(Integer, primary_key=True, index=True)

    # 关联字段
    field_id = Column(Integer, ForeignKey("field_definitions.id"), nullable=False)

    # 条件类型
    condition_type = Column(String(20), nullable=False, comment="condition_type: display/required")

    # 条件规则（JSON格式）
    # 示例: {"field": "payment_method", "operator": "equals", "value": "monthly"}
    # 支持的operator: equals, not_equals, contains, greater_than, less_than
    conditions = Column(JSON, nullable=False, comment="条件规则")

    # 逻辑运算符（多条件时）
    logic_operator = Column(String(10), default="AND", comment="AND/OR")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FieldPreset(Base):
    """字段预设库（用于去重）"""
    __tablename__ = "field_presets"

    id = Column(Integer, primary_key=True, index=True)
    field_name = Column(String(100), unique=True, nullable=False, comment="字段名称")
    display_name = Column(String(100), nullable=False, comment="显示名称")
    field_type = Column(String(50), nullable=False, comment="字段类型")
    description = Column(Text, nullable=True, comment="字段描述")
    default_validation_rules = Column(JSON, nullable=True, comment="默认验证规则")
    category = Column(String(50), nullable=True, comment="分类：甲方信息/乙方信息/合同条款等")

    # 字段hash（用于去重）
    content_hash = Column(String(64), unique=True, nullable=False, comment="内容hash")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
