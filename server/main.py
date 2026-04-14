from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.core.config import settings
from server.core.database import engine, Base, get_db
from server.routers import auth_router
from server.routers.admin_auth import router as admin_auth_router
from server.routers.contract_types import router as contract_types_router
from server.routers.templates import router as templates_router
from server.routers.fields import router as fields_router
from server.routers.drafts import router as drafts_router
from server.routers.uploads import router as uploads_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """启动事件"""
    # 初始化默认字段
    from server.routers.fields import init_default_fields, DEFAULT_FIELDS
    from server.models.field import FieldDefinition
    from server.routers.contract_types import init_default_contract_types

    db = next(get_db())
    try:
        # 初始化默认合同类型
        type_count = init_default_contract_types(db)

        # 初始化默认字段
        for field_def in DEFAULT_FIELDS:
            existing = db.query(FieldDefinition).filter(
                FieldDefinition.field_name == field_def["field_name"]
            ).first()
            if not existing:
                db_field = FieldDefinition(
                    field_name=field_def["field_name"],
                    display_name=field_def["display_name"],
                    field_type=field_def["field_type"],
                    required=True,
                    is_default=True,
                    sort_order=0,
                )
                db.add(db_field)
        db.commit()
    finally:
        db.close()

    yield

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI合同审核系统后端API",
    lifespan=lifespan,
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(admin_auth_router)
app.include_router(contract_types_router)
app.include_router(templates_router)
app.include_router(fields_router)
app.include_router(drafts_router)
app.include_router(uploads_router)


@app.get("/")
def root():
    return {"message": "EasyVerify Legal API", "version": settings.VERSION}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
