"""
合同模板管理路由
B-TPL-001 ~ B-TPL-006
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional

from server.core.database import get_db
from server.models.contract import ContractTemplate, ContractType
from server.schemas.contract import (
    ContractTemplateCreate,
    ContractTemplateUpdate,
    ContractTemplateResponse,
    ContractTemplateListResponse,
    TemplateParseResult,
    PlaceholderInfo,
    DocxUploadParseResult,
    CreateFromDocxRequest,
    PlaceholderAssignRequest,
    PlaceholderAssignResponse,
)
from server.services.template_parser import (
    extract_placeholders,
    validate_template_content,
)

router = APIRouter(prefix="/api/templates", tags=["合同模板管理"])


def response_success(data=None, message="操作成功"):
    """统一响应格式"""
    return {"success": True, "message": message, "data": data}


def response_error(message: str, status_code: int = 400):
    """错误响应"""
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "message": message},
    )


def safe_validate_template(template: ContractTemplate) -> dict:
    """
    安全地验证模板响应，跳过占位符格式验证
    因为旧数据可能使用 DocxPlaceholderInfo 格式
    """
    data = {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "template_type": template.template_type,
        "content": template.content,
        "version": template.version,
        "status": template.status,
        "placeholders": template.placeholders or [],
        "contract_type_id": template.contract_type_id,
        "created_by": template.created_by,
        "raw_docx_path": template.raw_docx_path,
        "html_content": template.html_content,
        "placeholder_field_map": template.placeholder_field_map,
        "is_complete": template.is_complete,
        "created_at": template.created_at,
        "updated_at": template.updated_at,
    }

    # 如果占位符是旧格式（包含 index/context），转换为新格式
    if data["placeholders"] and len(data["placeholders"]) > 0:
        first = data["placeholders"][0]
        if isinstance(first, dict) and "index" in first and "context" in first:
            data["placeholders"] = [
                {
                    "name": f"field_{p.get('index', i)}",
                    "display_name": f"字段{(p.get('index', i) or i) + 1}",
                    "field_type": p.get("field_type", "text") or "text",
                    "required": False,
                    "description": p.get("context", ""),
                }
                for i, p in enumerate(data["placeholders"])
            ]

    return data


@router.post("", response_model=dict, status_code=201)
def create_template(
    template: ContractTemplateCreate,
    db: Session = Depends(get_db),
):
    """
    B-TPL-001: 上传合同模板
    """
    # 验证内容格式
    valid, error_msg = validate_template_content(template.content)
    if not valid:
        response_error(error_msg, 400)

    # 提取占位符
    placeholders = extract_placeholders(template.content)

    # 如果指定了合同类型，检查是否存在
    if template.contract_type_id:
        contract_type = db.query(ContractType).filter(
            ContractType.id == template.contract_type_id
        ).first()
        if not contract_type:
            response_error("合同类型不存在", 404)

    db_template = ContractTemplate(
        name=template.name,
        description=template.description,
        template_type=template.template_type,
        content=template.content,
        contract_type_id=template.contract_type_id,
        placeholders=placeholders,
        status="draft",
        version=1,
    )
    db.add(db_template)

    try:
        db.commit()
        db.refresh(db_template)
    except IntegrityError:
        db.rollback()
        response_error("模板创建失败")

    return response_success(
        data=safe_validate_template(db_template),
        message="模板上传成功",
    )


@router.get("", response_model=dict)
def list_templates(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    template_type: Optional[str] = Query(None, description="模板类型筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
    contract_type_id: Optional[int] = Query(None, description="合同类型ID"),
    db: Session = Depends(get_db),
):
    """
    模板列表查询
    """
    query = db.query(ContractTemplate)

    if template_type:
        query = query.filter(ContractTemplate.template_type == template_type)
    if status:
        query = query.filter(ContractTemplate.status == status)
    if contract_type_id:
        query = query.filter(ContractTemplate.contract_type_id == contract_type_id)

    total = query.count()
    items = (
        query.order_by(ContractTemplate.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return response_success(
        data={
            "items": [safe_validate_template(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    )


@router.get("/{template_id}", response_model=dict)
def get_template(template_id: int, db: Session = Depends(get_db)):
    """
    获取模板详情
    """
    template = db.query(ContractTemplate).filter(
        ContractTemplate.id == template_id
    ).first()

    if not template:
        response_error("模板不存在", 404)

    return response_success(data=safe_validate_template(template))


@router.put("/{template_id}", response_model=dict)
def update_template(
    template_id: int,
    template: ContractTemplateUpdate,
    db: Session = Depends(get_db),
):
    """
    B-TPL-004: 编辑模板基本信息
    """
    db_template = db.query(ContractTemplate).filter(
        ContractTemplate.id == template_id
    ).first()

    if not db_template:
        response_error("模板不存在", 404)

    # 如果更新内容，重新解析占位符
    if template.content:
        valid, error_msg = validate_template_content(template.content)
        if not valid:
            response_error(error_msg, 400)
        db_template.placeholders = extract_placeholders(template.content)

    update_data = template.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field != "content":  # content 单独处理
            setattr(db_template, field, value)

    db.commit()
    db.refresh(db_template)

    return response_success(
        data=safe_validate_template(db_template),
        message="模板更新成功",
    )


@router.post("/{template_id}/new-version", response_model=dict)
def create_new_version(
    template_id: int,
    new_content: dict,
    db: Session = Depends(get_db),
):
    """
    B-TPL-006: 模板版本升级
    """
    db_template = db.query(ContractTemplate).filter(
        ContractTemplate.id == template_id
    ).first()

    if not db_template:
        response_error("模板不存在", 404)

    content = new_content.get("content")
    if not content:
        response_error("请提供新版本内容")

    # 验证新内容
    valid, error_msg = validate_template_content(content)
    if not valid:
        response_error(error_msg, 400)

    # 更新原模板
    db_template.version += 1
    db_template.content = content
    db_template.placeholders = extract_placeholders(content)
    db_template.status = "draft"  # 新版本需要重新发布

    db.commit()
    db.refresh(db_template)

    return response_success(
        data=safe_validate_template(db_template),
        message=f"版本升级为 v{db_template.version}",
    )


@router.post("/parse-placeholders", response_model=dict)
def parse_placeholders(content: dict):
    """
    B-TPL-002: 仅解析占位符（不上传）
    """
    content_text = content.get("content")
    if not content_text:
        response_error("请提供模板内容", 400)

    placeholders = extract_placeholders(content_text)
    required_count = sum(1 for p in placeholders if p.get("required", False))

    return response_success(
        data=TemplateParseResult(
            placeholders=[
                PlaceholderInfo(**p) for p in placeholders
            ],
            total_count=len(placeholders),
            required_count=required_count,
        )
    )


@router.delete("/{template_id}", response_model=dict)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """
    删除模板
    """
    db_template = db.query(ContractTemplate).filter(
        ContractTemplate.id == template_id
    ).first()

    if not db_template:
        response_error("模板不存在", 404)

    # 检查是否有草稿关联
    # TODO: 检查 contract_drafts 表

    db.delete(db_template)
    db.commit()

    return response_success(message="模板删除成功")


# ============ Word 文档模板端点 ============

@router.post("/from-docx", response_model=dict, status_code=201)
def create_template_from_docx(
    template_data: CreateFromDocxRequest,
    db: Session = Depends(get_db),
):
    """
    从 docx 文件创建模板
    """
    # 如果指定了合同类型，检查是否存在
    if template_data.contract_type_id:
        contract_type = db.query(ContractType).filter(
            ContractType.id == template_data.contract_type_id
        ).first()
        if not contract_type:
            response_error("合同类型不存在", 404)

    # 初始化占位符映射
    placeholder_field_map = {p.index: None for p in template_data.placeholders}

    # 将 DocxPlaceholderInfo 转换为 PlaceholderInfo 格式
    placeholders_for_db = [
        {
            "name": f"field_{p.index}",
            "display_name": f"字段{p.index + 1}",
            "field_type": "text",
            "required": False,
            "description": p.context,
        }
        for p in template_data.placeholders
    ]

    db_template = ContractTemplate(
        name=template_data.name,
        description=template_data.description,
        template_type=template_data.template_type,
        content="",  # docx 模板不使用 markdown content
        raw_docx_path=template_data.raw_docx_path,
        html_content=template_data.html_content,
        placeholder_field_map=placeholder_field_map,
        placeholders=placeholders_for_db,
        contract_type_id=template_data.contract_type_id,
        status="draft",
        version=1,
        is_complete=False,
    )
    db.add(db_template)

    try:
        db.commit()
        db.refresh(db_template)
    except IntegrityError:
        db.rollback()
        response_error("模板创建失败")

    return response_success(
        data=safe_validate_template(db_template),
        message="模板创建成功",
    )


@router.patch("/{template_id}/placeholders/{placeholder_index}", response_model=dict)
def assign_placeholder(
    template_id: int,
    placeholder_index: int,
    assign_data: PlaceholderAssignRequest,
    db: Session = Depends(get_db),
):
    """
    为占位符分配字段
    """
    db_template = db.query(ContractTemplate).filter(
        ContractTemplate.id == template_id
    ).first()

    if not db_template:
        response_error("模板不存在", 404)

    # 检查 placeholder_field_map 是否存在
    if db_template.placeholder_field_map is None:
        response_error("此模板不支持占位符分配")

    # 检查 placeholder_index 是否有效
    if str(placeholder_index) not in db_template.placeholder_field_map:
        response_error(f"占位符索引 {placeholder_index} 不存在")

    # 检查字段是否存在
    from server.models.field import FieldDefinition
    field = db.query(FieldDefinition).filter(
        FieldDefinition.id == assign_data.field_id
    ).first()
    if not field:
        response_error("字段不存在", 404)

    # 更新映射（创建新字典以确保 SQLAlchemy 检测到变更）
    placeholder_map = dict(db_template.placeholder_field_map)
    placeholder_map[str(placeholder_index)] = assign_data.field_id
    db_template.placeholder_field_map = placeholder_map

    # 检查是否所有占位符都已分配
    is_complete = all(v is not None for v in placeholder_map.values())
    db_template.is_complete = is_complete

    db.commit()
    db.refresh(db_template)

    return response_success(
        data=PlaceholderAssignResponse(
            template_id=template_id,
            placeholder_index=placeholder_index,
            field_id=assign_data.field_id,
            is_complete=is_complete,
        ),
        message="占位符分配成功",
    )


@router.post("/{template_id}/publish", response_model=dict)
def publish_template(template_id: int, db: Session = Depends(get_db)):
    """
    B-TPL-005: 发布模板
    """
    db_template = db.query(ContractTemplate).filter(
        ContractTemplate.id == template_id
    ).first()

    if not db_template:
        response_error("模板不存在", 404)

    if db_template.status == "published":
        response_error("模板已经是发布状态")

    # 检查模板完整性（仅对 docx 模板有效）
    if db_template.placeholder_field_map is not None and not db_template.is_complete:
        unassigned_count = sum(
            1 for v in db_template.placeholder_field_map.values()
            if v is None
        )
        response_error(
            f"模板尚有 {unassigned_count} 个未分配字段的占位符，无法发布",
            400,
        )

    db_template.status = "published"
    db.commit()
    db.refresh(db_template)

    return response_success(
        data=safe_validate_template(db_template),
        message="模板发布成功",
    )
