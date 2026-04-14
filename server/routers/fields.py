"""
字段管理路由
B-FLD-001 ~ B-FLD-008, B-GRP-001 ~ B-GRP-003, B-CND-001 ~ B-CND-003
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from server.core.database import get_db
from server.models.field import FieldDefinition, FieldGroup, FieldCondition, FieldPreset
from server.models.contract import ContractTemplate
from server.schemas.field import (
    FieldDefinitionCreate,
    FieldDefinitionUpdate,
    FieldDefinitionResponse,
    FieldDefinitionListResponse,
    FieldGroupCreate,
    FieldGroupUpdate,
    FieldGroupResponse,
    FieldGroupListResponse,
    FieldConditionCreate,
    FieldConditionUpdate,
    FieldConditionResponse,
    FieldPresetCreate,
    FieldPresetResponse,
    FieldReorderRequest,
    GroupReorderRequest,
    SimilarFieldResult,
)
from server.services.field_similarity import find_similar_fields

router = APIRouter(prefix="/api", tags=["字段管理"])


def response_success(data=None, message="操作成功"):
    return {"success": True, "message": message, "data": data}


def response_error(message: str, status_code: int = 400):
    raise HTTPException(status_code=status_code, detail={"success": False, "message": message})


# ============ FieldDefinition APIs ============

@router.post("/fields", response_model=dict, status_code=201)
def create_field(field: FieldDefinitionCreate, db: Session = Depends(get_db)):
    """
    B-FLD-001: 添加字段 - 从组件库选择
    B-FLD-002: 添加字段 - 完全自定义
    """
    # 如果指定了模板，检查模板是否存在
    if field.template_id:
        template = db.query(ContractTemplate).filter(
            ContractTemplate.id == field.template_id
        ).first()
        if not template:
            response_error("模板不存在", 404)

    # 如果指定了分组，检查分组是否存在
    if field.group_id:
        group = db.query(FieldGroup).filter(FieldGroup.id == field.group_id).first()
        if not group:
            response_error("分组不存在", 404)

    # 处理验证规则
    validation_rules = None
    if field.validation_rules:
        validation_rules = field.validation_rules.model_dump(exclude_none=True)

    db_field = FieldDefinition(
        field_name=field.field_name,
        display_name=field.display_name,
        field_type=field.field_type.value if hasattr(field.field_type, 'value') else field.field_type,
        description=field.description,
        placeholder=field.placeholder,
        required=field.required,
        validation_rules=validation_rules,
        group_id=field.group_id,
        template_id=field.template_id,
        preset_id=field.preset_id,
    )
    db.add(db_field)
    db.commit()
    db.refresh(db_field)

    return response_success(
        data=FieldDefinitionResponse.model_validate(db_field),
        message="字段创建成功",
    )


@router.get("/fields", response_model=dict)
def list_fields(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    template_id: Optional[int] = Query(None),
    group_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """获取字段列表"""
    query = db.query(FieldDefinition)

    if template_id:
        query = query.filter(FieldDefinition.template_id == template_id)
    if group_id:
        query = query.filter(FieldDefinition.group_id == group_id)

    total = query.count()
    items = (
        query.order_by(FieldDefinition.sort_order, FieldDefinition.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return response_success(
        data={
            "items": [FieldDefinitionResponse.model_validate(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    )


# ============ 字段相似度查询 ============

@router.get("/fields/similar", response_model=dict)
def get_similar_fields(
    query: str = Query(..., min_length=1, description="查询字段名称"),
    threshold: float = Query(0.65, ge=0.0, le=1.0, description="相似度阈值"),
    db: Session = Depends(get_db),
):
    """
    查询与给定名称相似的字段
    """
    all_fields = db.query(FieldDefinition).all()
    candidates = [
        {
            "id": f.id,
            "field_name": f.field_name,
            "display_name": f.display_name,
            "field_type": f.field_type,
        }
        for f in all_fields
    ]
    similar = find_similar_fields(query, candidates, threshold)
    return response_success(
        data=[SimilarFieldResult(field=f["field"], similarity_score=f["similarity_score"]) for f in similar]
    )


@router.get("/fields/{field_id}", response_model=dict)
def get_field(field_id: int, db: Session = Depends(get_db)):
    """获取字段详情"""
    field = db.query(FieldDefinition).filter(FieldDefinition.id == field_id).first()
    if not field:
        response_error("字段不存在", 404)

    return response_success(data=FieldDefinitionResponse.model_validate(field))


@router.put("/fields/{field_id}", response_model=dict)
def update_field(
    field_id: int,
    field_update: FieldDefinitionUpdate,
    db: Session = Depends(get_db),
):
    """
    B-FLD-003: 编辑字段
    """
    db_field = db.query(FieldDefinition).filter(FieldDefinition.id == field_id).first()
    if not db_field:
        response_error("字段不存在", 404)

    update_data = field_update.model_dump(exclude_unset=True)
    if field_update.validation_rules:
        update_data["validation_rules"] = field_update.validation_rules.model_dump(
            exclude_none=True
        )

    for key, value in update_data.items():
        setattr(db_field, key, value)

    db.commit()
    db.refresh(db_field)

    return response_success(
        data=FieldDefinitionResponse.model_validate(db_field),
        message="字段更新成功",
    )


@router.delete("/fields/{field_id}", response_model=dict)
def delete_field(field_id: int, db: Session = Depends(get_db)):
    """
    B-FLD-004: 删除字段
    """
    field = db.query(FieldDefinition).filter(FieldDefinition.id == field_id).first()
    if not field:
        response_error("字段不存在", 404)

    db.delete(field)
    db.commit()

    return response_success(message="字段删除成功")


# ============ FieldGroup APIs ============

@router.post("/field-groups", response_model=dict, status_code=201)
def create_field_group(group: FieldGroupCreate, db: Session = Depends(get_db)):
    """
    B-GRP-001: 创建字段分组
    """
    if group.template_id:
        template = db.query(ContractTemplate).filter(
            ContractTemplate.id == group.template_id
        ).first()
        if not template:
            response_error("模板不存在", 404)

    db_group = FieldGroup(
        name=group.name,
        description=group.description,
        template_id=group.template_id,
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)

    return response_success(
        data=FieldGroupResponse.model_validate(db_group),
        message="分组创建成功",
    )


@router.get("/field-groups", response_model=dict)
def list_field_groups(
    template_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """获取分组列表"""
    query = db.query(FieldGroup)

    if template_id:
        query = query.filter(FieldGroup.template_id == template_id)

    items = query.order_by(FieldGroup.sort_order, FieldGroup.id).all()

    return response_success(
        data={
            "items": [FieldGroupResponse.model_validate(item) for item in items],
            "total": len(items),
            "page": 1,
            "page_size": len(items),
            "has_more": False,
        }
    )


@router.put("/field-groups/{group_id}", response_model=dict)
def update_field_group(
    group_id: int,
    group_update: FieldGroupUpdate,
    db: Session = Depends(get_db),
):
    """更新分组"""
    db_group = db.query(FieldGroup).filter(FieldGroup.id == group_id).first()
    if not db_group:
        response_error("分组不存在", 404)

    update_data = group_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_group, key, value)

    db.commit()
    db.refresh(db_group)

    return response_success(
        data=FieldGroupResponse.model_validate(db_group),
        message="分组更新成功",
    )


@router.delete("/field-groups/{group_id}", response_model=dict)
def delete_field_group(group_id: int, db: Session = Depends(get_db)):
    """
    B-GRP-003: 删除分组
    """
    db_group = db.query(FieldGroup).filter(FieldGroup.id == group_id).first()
    if not db_group:
        response_error("分组不存在", 404)

    # TODO: 检查分组是否有字段

    db.delete(db_group)
    db.commit()

    return response_success(message="分组删除成功")


# ============ FieldCondition APIs ============

@router.post("/field-conditions", response_model=dict, status_code=201)
def create_field_condition(condition: FieldConditionCreate, db: Session = Depends(get_db)):
    """
    B-CND-001: 设置条件字段 - 显示条件
    B-CND-002: 设置条件字段 - 必填条件
    B-CND-003: 多条件组合
    """
    # 检查字段是否存在
    field = db.query(FieldDefinition).filter(
        FieldDefinition.id == condition.field_id
    ).first()
    if not field:
        response_error("字段不存在", 404)

    # 转换条件
    conditions_list = [
        c.model_dump() for c in condition.conditions
    ]

    db_condition = FieldCondition(
        field_id=condition.field_id,
        condition_type=condition.condition_type,
        conditions=conditions_list,
        logic_operator=condition.logic_operator.value if hasattr(condition.logic_operator, 'value') else condition.logic_operator,
    )
    db.add(db_condition)
    db.commit()
    db.refresh(db_condition)

    return response_success(
        data=FieldConditionResponse.model_validate(db_condition),
        message="条件创建成功",
    )


@router.get("/field-conditions", response_model=dict)
def list_field_conditions(
    field_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """获取字段条件列表"""
    query = db.query(FieldCondition)

    if field_id:
        query = query.filter(FieldCondition.field_id == field_id)

    items = query.all()

    return response_success(
        data={
            "items": [FieldConditionResponse.model_validate(item) for item in items],
            "total": len(items),
            "page": 1,
            "page_size": len(items),
            "has_more": False,
        }
    )


@router.delete("/field-conditions/{condition_id}", response_model=dict)
def delete_field_condition(condition_id: int, db: Session = Depends(get_db)):
    """删除字段条件"""
    condition = db.query(FieldCondition).filter(
        FieldCondition.id == condition_id
    ).first()
    if not condition:
        response_error("条件不存在", 404)

    db.delete(condition)
    db.commit()

    return response_success(message="条件删除成功")


# 单独的处理函数，避免路由冲突
def reorder_fields_impl(
    field_ids: str = Query(..., description="逗号分隔的字段ID列表"),
    db: Session = Depends(get_db),
):
    """
    B-FLD-005: 字段排序
    """
    try:
        ids = [int(x.strip()) for x in field_ids.split(",")]
    except ValueError:
        response_error("无效的字段ID格式")

    for i, field_id in enumerate(ids):
        field = db.query(FieldDefinition).filter(FieldDefinition.id == field_id).first()
        if field:
            field.sort_order = i

    db.commit()
    return response_success(message="字段排序更新成功")


# 注册到不同的路径避免冲突
router.add_api_route(
    "/fields-batch-reorder",
    reorder_fields_impl,
    methods=["PUT"],
    name="reorder_fields",
)


# ============ 默认字段初始化 ============

# 默认字段定义
DEFAULT_FIELDS = [
    {"field_name": "party_a_name", "display_name": "甲方姓名", "field_type": "text"},
    {"field_name": "party_b_name", "display_name": "乙方姓名", "field_type": "text"},
    {"field_name": "party_a_address", "display_name": "甲方地址", "field_type": "text"},
    {"field_name": "party_b_address", "display_name": "乙方地址", "field_type": "text"},
    {"field_name": "party_a_phone", "display_name": "甲方电话", "field_type": "text"},
    {"field_name": "party_b_phone", "display_name": "乙方电话", "field_type": "text"},
    {"field_name": "party_a_id", "display_name": "甲方ID", "field_type": "text"},
    {"field_name": "party_b_id", "display_name": "乙方ID", "field_type": "text"},
    {"field_name": "year", "display_name": "年", "field_type": "number"},
    {"field_name": "month", "display_name": "月", "field_type": "number"},
    {"field_name": "day", "display_name": "日", "field_type": "number"},
    {"field_name": "specific_content", "display_name": "具体内容", "field_type": "text"},
]


@router.post("/fields/init-defaults", response_model=dict)
def init_default_fields(db: Session = Depends(get_db)):
    """
    初始化系统默认字段（幂等操作）
    """
    created_count = 0
    skipped_count = 0

    for field_def in DEFAULT_FIELDS:
        # 检查是否已存在
        existing = db.query(FieldDefinition).filter(
            FieldDefinition.field_name == field_def["field_name"]
        ).first()

        if existing:
            skipped_count += 1
            continue

        # 创建新字段
        db_field = FieldDefinition(
            field_name=field_def["field_name"],
            display_name=field_def["display_name"],
            field_type=field_def["field_type"],
            required=True,
            is_default=True,
            sort_order=0,
        )
        db.add(db_field)
        created_count += 1

    db.commit()

    return response_success(
        data={"created": created_count, "skipped": skipped_count},
        message=f"默认字段初始化完成：新建 {created_count} 个，跳过 {skipped_count} 个",
    )
