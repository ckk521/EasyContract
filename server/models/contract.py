from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.sql import func
import enum

from server.core.database import Base


class ContractTypeEnum(str, enum.Enum):
    """合同类型枚举"""
    RENTAL = "RENTAL"           # 租赁合同
    EMPLOYMENT = "EMPLOYMENT"   # 雇佣合同
    SALES = "SALES"            # 销售合同
    SERVICE = "SERVICE"        # 服务合同
    PARTNERSHIP = "PARTNERSHIP" # 合伙合同
    LOAN = "LOAN"             # 借款合同
    GIFT = "GIFT"             # 赠与合同
    OTHER = "OTHER"           # 其他


class ContractStatus(str, enum.Enum):
    """合同状态枚举"""
    DRAFT = "draft"                    # 草稿
    PENDING_REVIEW = "pending_review"  # 待审核
    APPROVED = "approved"              # 已批准
    REJECTED = "rejected"              # 已拒绝
    COMPLETED = "completed"            # 已完成
    ARCHIVED = "archived"              # 已归档


class ContractType(Base):
    """合同类型"""
    __tablename__ = "contract_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, comment="类型编码")
    name = Column(String(100), nullable=False, comment="类型名称")
    description = Column(Text, nullable=True, comment="类型描述")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    templates = Column(Integer, default=0, comment="模板数量")


class ContractTemplate(Base):
    """合同模板"""
    __tablename__ = "contract_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, comment="模板名称")
    description = Column(Text, nullable=True, comment="模板描述")
    template_type = Column(String(50), nullable=False, comment="模板类型")
    content = Column(Text, nullable=False, comment="模板内容（Markdown）")
    version = Column(Integer, default=1, comment="版本号")
    status = Column(String(20), default="draft", comment="状态: draft/published/archived")

    # 占位符信息（自动识别）
    placeholders = Column(JSON, nullable=True, comment="占位符列表")

    # Word 文档支持
    raw_docx_path = Column(String(500), nullable=True, comment="原始 docx 文件路径")
    html_content = Column(Text, nullable=True, comment="转换后的 HTML 内容")

    # 占位符与字段的映射关系 {index: field_id | null}
    placeholder_field_map = Column(JSON, nullable=True, comment="占位符字段映射")

    # 模板完整性（所有占位符已分配字段才为 True）
    is_complete = Column(Boolean, default=False, comment="是否完整")

    # 关联
    contract_type_id = Column(Integer, ForeignKey("contract_types.id"), nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ContractDraft(Base):
    """合同草稿"""
    __tablename__ = "contract_drafts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, comment="草稿名称")
    status = Column(String(20), default=ContractStatus.DRAFT.value, comment="状态")

    # 关联
    template_id = Column(Integer, ForeignKey("contract_templates.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String(100), nullable=True, comment="关联的会话ID")

    # 表单填写数据
    form_data = Column(JSON, nullable=True, comment="填写的字段数据")

    # 生成的合同内容
    generated_content = Column(Text, nullable=True, comment="生成的合同正文")

    # 完成度
    filled_fields = Column(Integer, default=0, comment="已填写字段数")
    total_fields = Column(Integer, default=0, comment="总字段数")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
