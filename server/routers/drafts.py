"""
合同草稿路由 (C-end)
C-DRAFT-001 ~ C-DRAFT-006
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from server.core.database import get_db
from server.models.contract import ContractDraft, ContractTemplate
from server.models.field import FieldDefinition, FieldCondition
from server.schemas.contract import (
    DraftCreate,
    DraftUpdate,
    DraftResponse,
    FieldValuesUpdate,
    ValidationResult,
)
from server.schemas.field import FieldDefinitionResponse
from server.services.template_parser import render_template

router = APIRouter(prefix="/api", tags=["合同草稿"])


def response_success(data=None, message="操作成功"):
    return {"success": True, "message": message, "data": data}


def response_error(message: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code, detail={"success": False, "message": message}
    )


@router.post("/drafts", response_model=dict, status_code=201)
def create_draft(draft: DraftCreate, db: Session = Depends(get_db)):
    """
    C-DRAFT-001: 创建合同草稿
    """
    # 检查模板是否存在
    template = db.query(ContractTemplate).filter(
        ContractTemplate.id == draft.template_id
    ).first()
    if not template:
        response_error("模板不存在", 404)

    # 获取模板的字段数量
    field_count = db.query(FieldDefinition).filter(
        FieldDefinition.template_id == draft.template_id
    ).count()

    db_draft = ContractDraft(
        name=draft.name,
        template_id=draft.template_id,
        user_id=draft.user_id,
        conversation_id=draft.conversation_id,
        total_fields=field_count,
        filled_fields=0,
        status="draft",
    )
    db.add(db_draft)
    db.commit()
    db.refresh(db_draft)

    return response_success(
        data=DraftResponse.model_validate(db_draft),
        message="草稿创建成功",
    )


@router.get("/drafts", response_model=dict)
def list_drafts(
    user_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    C-DRAFT-006: 列出用户的草稿
    """
    query = db.query(ContractDraft)

    if user_id:
        query = query.filter(ContractDraft.user_id == user_id)

    total = query.count()
    items = (
        query.order_by(ContractDraft.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return response_success(
        data={
            "items": [DraftResponse.model_validate(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    )


@router.get("/drafts/{draft_id}", response_model=dict)
def get_draft(draft_id: int, db: Session = Depends(get_db)):
    """获取草稿详情"""
    draft = db.query(ContractDraft).filter(ContractDraft.id == draft_id).first()
    if not draft:
        response_error("草稿不存在", 404)

    return response_success(data=DraftResponse.model_validate(draft))


@router.put("/drafts/{draft_id}", response_model=dict)
def update_draft(
    draft_id: int,
    draft_update: DraftUpdate,
    db: Session = Depends(get_db),
):
    """更新草稿信息"""
    db_draft = db.query(ContractDraft).filter(ContractDraft.id == draft_id).first()
    if not db_draft:
        response_error("草稿不存在", 404)

    update_data = draft_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_draft, key, value)

    db.commit()
    db.refresh(db_draft)

    return response_success(
        data=DraftResponse.model_validate(db_draft),
        message="草稿更新成功",
    )


@router.delete("/drafts/{draft_id}", response_model=dict)
def delete_draft(draft_id: int, db: Session = Depends(get_db)):
    """删除草稿"""
    draft = db.query(ContractDraft).filter(ContractDraft.id == draft_id).first()
    if not draft:
        response_error("草稿不存在", 404)

    db.delete(draft)
    db.commit()

    return response_success(message="草稿删除成功")


@router.put("/drafts/{draft_id}/fields", response_model=dict)
def save_field_values(
    draft_id: int,
    field_values: FieldValuesUpdate,
    db: Session = Depends(get_db),
):
    """
    C-DRAFT-002: 保存字段填写值
    """
    db_draft = db.query(ContractDraft).filter(ContractDraft.id == draft_id).first()
    if not db_draft:
        response_error("草稿不存在", 404)

    # 获取当前form_data并更新
    form_data = dict(db_draft.form_data) if db_draft.form_data else {}
    # model_dump with exclude_none=False to include all fields
    new_values = field_values.model_dump(exclude_none=True)
    form_data.update(new_values)

    # 计算已填写的字段数量（只统计有值的非空字段）
    filled_count = sum(1 for v in form_data.values() if v not in (None, "", []))
    db_draft.form_data = form_data
    db_draft.filled_fields = filled_count

    db.commit()
    db.refresh(db_draft)

    return response_success(
        data=DraftResponse.model_validate(db_draft),
        message="字段保存成功",
    )


@router.get("/drafts/{draft_id}/fields", response_model=dict)
def get_draft_fields(
    draft_id: int,
    db: Session = Depends(get_db),
):
    """
    C-DRAFT-003: 获取草稿字段（含条件过滤）
    """
    db_draft = db.query(ContractDraft).filter(ContractDraft.id == draft_id).first()
    if not db_draft:
        response_error("草稿不存在", 404)

    # 获取模板的所有字段
    fields = db.query(FieldDefinition).filter(
        FieldDefinition.template_id == db_draft.template_id
    ).order_by(FieldDefinition.sort_order, FieldDefinition.id).all()

    # 获取所有条件
    field_ids = [f.id for f in fields]
    conditions = db.query(FieldCondition).filter(
        FieldCondition.field_id.in_(field_ids)
    ).all()

    # 构建字段ID到条件的映射
    condition_map = {c.field_id: c for c in conditions}

    # 查询参数（用于条件判断）
    query_params = dict(db_draft.form_data or {})

    # 计算可见字段
    visible_fields = []
    for field in fields:
        cond = condition_map.get(field.id)
        if cond and cond.condition_type == "display":
            # 检查条件是否满足
            if not _check_conditions_met(cond.conditions, cond.logic_operator, query_params):
                continue  # 条件不满足，跳过
        visible_fields.append(field)

    return response_success(
        data={
            "fields": [FieldDefinitionResponse.model_validate(f) for f in visible_fields],
            "form_data": db_draft.form_data or {},
            "filled_fields": db_draft.filled_fields,
            "total_fields": db_draft.total_fields,
        }
    )


@router.post("/drafts/{draft_id}/validate", response_model=dict)
def validate_draft_fields(
    draft_id: int,
    field_values: FieldValuesUpdate,
    db: Session = Depends(get_db),
):
    """
    C-DRAFT-004: 验证字段
    """
    db_draft = db.query(ContractDraft).filter(ContractDraft.id == draft_id).first()
    if not db_draft:
        response_error("草稿不存在", 404)

    # 获取模板的所有必填字段
    required_fields = db.query(FieldDefinition).filter(
        FieldDefinition.template_id == db_draft.template_id,
        FieldDefinition.required == True,
    ).all()

    # 获取所有条件（用于检查必填条件）
    field_ids = [f.id for f in required_fields]
    conditions = db.query(FieldCondition).filter(
        FieldCondition.field_id.in_(field_ids)
    ).all()
    condition_map = {c.field_id: c for c in conditions}

    values = field_values.model_dump()
    errors = []

    for field in required_fields:
        cond = condition_map.get(field.id)

        # 如果有显示条件，检查条件是否满足
        if cond and cond.condition_type == "display":
            if not _check_conditions_met(cond.conditions, cond.logic_operator, values):
                continue  # 条件不满足，不需要验证

        # 检查必填条件
        if cond and cond.condition_type == "required":
            if not _check_conditions_met(cond.conditions, cond.logic_operator, values):
                continue  # 必填条件不满足，不需要验证

        # 检查值是否为空
        value = values.get(field.field_name)
        if value is None or value == "" or value == []:
            errors.append({
                "field": field.field_name,
                "message": f"{field.display_name} 是必填字段",
            })
            continue

        # 类型验证
        if field.field_type == "number":
            try:
                float(value)
            except (ValueError, TypeError):
                errors.append({
                    "field": field.field_name,
                    "message": f"{field.display_name} 必须是有效数字",
                })

        # 验证规则检查
        if field.validation_rules and value:
            rules = field.validation_rules
            if field.field_type in ("text", "textarea"):
                if "min_length" in rules and len(str(value)) < rules["min_length"]:
                    errors.append({
                        "field": field.field_name,
                        "message": f"{field.display_name} 长度不能少于 {rules['min_length']} 个字符",
                    })
                if "max_length" in rules and len(str(value)) > rules["max_length"]:
                    errors.append({
                        "field": field.field_name,
                        "message": f"{field.display_name} 长度不能超过 {rules['max_length']} 个字符",
                    })
            if field.field_type == "number":
                if "min" in rules and float(value) < rules["min"]:
                    errors.append({
                        "field": field.field_name,
                        "message": f"{field.display_name} 不能小于 {rules['min']}",
                    })
                if "max" in rules and float(value) > rules["max"]:
                    errors.append({
                        "field": field.field_name,
                        "message": f"{field.display_name} 不能大于 {rules['max']}",
                    })

    is_valid = len(errors) == 0

    return response_success(
        data={
            "is_valid": is_valid,
            "errors": errors,
        }
    )


@router.post("/drafts/{draft_id}/generate", response_model=dict)
def generate_contract_content(
    draft_id: int,
    db: Session = Depends(get_db),
):
    """
    C-DRAFT-005: 生成合同内容
    """
    db_draft = db.query(ContractDraft).filter(ContractDraft.id == draft_id).first()
    if not db_draft:
        response_error("草稿不存在", 404)

    template = db.query(ContractTemplate).filter(
        ContractTemplate.id == db_draft.template_id
    ).first()
    if not template:
        response_error("模板不存在", 404)

    # 使用模板解析器生成内容
    form_data = db_draft.form_data or {}
    content = render_template(template.content, form_data)

    # 更新草稿
    db_draft.generated_content = content
    db.commit()
    db.refresh(db_draft)

    return response_success(
        data={
            "content": content,
            "draft_id": draft_id,
        },
        message="合同生成成功",
    )


def _check_conditions_met(
    conditions: list,
    logic_operator: str,
    values: dict
) -> bool:
    """
    检查条件是否满足
    conditions: [{"field": "xxx", "operator": "equals", "value": True}]
    logic_operator: "AND" 或 "OR"
    """
    if not conditions:
        return True

    results = []
    for cond in conditions:
        field_name = cond.get("field")
        operator = cond.get("operator")
        expected_value = cond.get("value")
        actual_value = values.get(field_name)

        if operator == "equals":
            result = actual_value == expected_value
        elif operator == "not_equals":
            result = actual_value != expected_value
        elif operator == "contains":
            result = expected_value in str(actual_value) if actual_value else False
        elif operator == "greater_than":
            result = float(actual_value) > float(expected_value) if actual_value else False
        elif operator == "less_than":
            result = float(actual_value) < float(expected_value) if actual_value else False
        else:
            result = False

        results.append(result)

    if logic_operator == "AND":
        return all(results)
    else:  # OR
        return any(results)
