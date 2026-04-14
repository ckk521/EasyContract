"""
合同类型管理路由
B-TYPE-001 ~ B-TYPE-007
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional

from server.core.database import get_db
from server.models.contract import ContractType
from server.schemas.contract import (
    ContractTypeCreate,
    ContractTypeUpdate,
    ContractTypeResponse,
    ContractTypeListResponse,
)

router = APIRouter(prefix="/api/contract-types", tags=["合同类型管理"])

# 默认合同类型
DEFAULT_CONTRACT_TYPES = [
    {"code": "NDA", "name": "保密协议", "description": "保护商业秘密和机密信息"},
    {"code": "RENTAL", "name": "租赁协议", "description": "房屋或设备租赁合同"},
    {"code": "MARRIAGE", "name": "婚姻协议", "description": "婚前或婚后财产协议"},
    {"code": "EMPLOYMENT", "name": "劳动合同", "description": "雇佣关系合同"},
    {"code": "SALES", "name": "销售合同", "description": "商品买卖合同"},
    {"code": "SERVICE", "name": "服务合同", "description": "提供服务类合同"},
]


def response_success(data=None, message="操作成功"):
    """统一响应格式"""
    return {"success": True, "message": message, "data": data}


def response_error(message: str, status_code: int = 400):
    """错误响应"""
    raise HTTPException(status_code=status_code, detail={"success": False, "message": message})


def init_default_contract_types(db: Session) -> int:
    """初始化默认合同类型，返回创建的数量"""
    count = 0
    for type_def in DEFAULT_CONTRACT_TYPES:
        existing = db.query(ContractType).filter(ContractType.code == type_def["code"]).first()
        if not existing:
            db_type = ContractType(
                code=type_def["code"],
                name=type_def["name"],
                description=type_def["description"],
                is_active=True,
            )
            db.add(db_type)
            count += 1
    if count > 0:
        db.commit()
    return count


@router.post("", response_model=dict, status_code=201)
def create_contract_type(
    contract_type: ContractTypeCreate,
    db: Session = Depends(get_db),
):
    """
    B-TYPE-001: 创建合同类型
    """
    # 检查编码是否重复
    existing = db.query(ContractType).filter(ContractType.code == contract_type.code).first()
    if existing:
        response_error(f"类型编码 {contract_type.code} 已存在", 400)

    db_contract_type = ContractType(
        code=contract_type.code,
        name=contract_type.name,
        description=contract_type.description,
        is_active=True,
    )
    db.add(db_contract_type)
    try:
        db.commit()
        db.refresh(db_contract_type)
    except IntegrityError:
        db.rollback()
        response_error("类型编码已存在")

    return response_success(
        data=ContractTypeResponse.model_validate(db_contract_type),
        message="类型创建成功",
    )


@router.get("", response_model=dict)
def list_contract_types(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    code: Optional[str] = Query(None, description="类型编码筛选"),
    name: Optional[str] = Query(None, description="名称筛选"),
    is_active: Optional[bool] = Query(None, description="启用状态筛选"),
    db: Session = Depends(get_db),
):
    """
    B-TYPE-001: 列表显示新类型
    """
    query = db.query(ContractType)

    if code:
        query = query.filter(ContractType.code.contains(code))
    if name:
        query = query.filter(ContractType.name.contains(name))
    if is_active is not None:
        query = query.filter(ContractType.is_active == is_active)

    total = query.count()
    items = (
        query.order_by(ContractType.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return response_success(
        data={
            "items": [ContractTypeResponse.model_validate(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    )


@router.get("/{type_id}", response_model=dict)
def get_contract_type(type_id: int, db: Session = Depends(get_db)):
    """
    获取合同类型详情
    """
    contract_type = db.query(ContractType).filter(ContractType.id == type_id).first()
    if not contract_type:
        response_error("类型不存在", 404)

    return response_success(data=ContractTypeResponse.model_validate(contract_type))


@router.put("/{type_id}", response_model=dict)
def update_contract_type(
    type_id: int,
    contract_type: ContractTypeUpdate,
    db: Session = Depends(get_db),
):
    """
    B-TYPE-004: 编辑合同类型
    """
    db_contract_type = db.query(ContractType).filter(ContractType.id == type_id).first()
    if not db_contract_type:
        response_error("类型不存在", 404)

    update_data = contract_type.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contract_type, field, value)

    db.commit()
    db.refresh(db_contract_type)

    return response_success(
        data=ContractTypeResponse.model_validate(db_contract_type),
        message="类型更新成功",
    )


@router.patch("/{type_id}/toggle-status", response_model=dict)
def toggle_contract_type_status(type_id: int, db: Session = Depends(get_db)):
    """
    B-TYPE-005: 禁用/启用合同类型
    """
    db_contract_type = db.query(ContractType).filter(ContractType.id == type_id).first()
    if not db_contract_type:
        response_error("类型不存在", 404)

    db_contract_type.is_active = not db_contract_type.is_active
    db.commit()
    db.refresh(db_contract_type)

    status_text = "启用" if db_contract_type.is_active else "禁用"
    return response_success(
        data=ContractTypeResponse.model_validate(db_contract_type),
        message=f"类型{status_text}成功",
    )


@router.delete("/{type_id}", response_model=dict)
def delete_contract_type(type_id: int, db: Session = Depends(get_db)):
    """
    B-TYPE-006: 删除合同类型 - 有关联模板
    B-TYPE-007: 删除合同类型 - 无关联
    """
    db_contract_type = db.query(ContractType).filter(ContractType.id == type_id).first()
    if not db_contract_type:
        response_error("类型不存在", 404)

    # TODO: 检查是否有模板关联 (B-TYPE-006)
    # if db_contract_type.templates.count() > 0:
    #     response_error("该类型下存在模板，无法删除")

    db.delete(db_contract_type)
    db.commit()

    return response_success(message="类型删除成功")
