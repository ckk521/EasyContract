"""
合同类型管理 API 测试
B-TYPE-001 ~ B-TYPE-007

TDD RED 阶段：先编写失败测试
"""
import pytest
from fastapi.testclient import TestClient


class TestContractTypeAPI:
    """合同类型管理 API 测试"""

    def test_create_contract_type_success(self, db_session):
        """
        B-TYPE-001: 创建合同类型 - 正常创建
        验收标准: 1. 类型创建成功 2. 列表显示新类型
        """
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        # 创建测试数据库
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        response = client.post(
            "/api/contract-types",
            json={
                "code": "RENTAL",
                "name": "租赁合同",
                "description": "房屋租赁相关合同",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["code"] == "RENTAL"
        assert data["data"]["name"] == "租赁合同"
        assert data["data"]["is_active"] is True

        app.dependency_overrides.clear()

    def test_create_contract_type_duplicate_code(self, db_session):
        """
        B-TYPE-002: 创建合同类型 - 重复编码
        验收标准: 返回错误提示，类型创建失败
        """
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        # 创建第一个类型
        client.post(
            "/api/contract-types",
            json={"code": "RENTAL", "name": "租赁合同"},
        )

        # 尝试创建重复编码类型
        response = client.post(
            "/api/contract-types",
            json={"code": "RENTAL", "name": "租赁合同2"},
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["success"] is False
        # 检查错误消息包含"已存在"
        assert "已存在" in data["detail"]["message"]

        app.dependency_overrides.clear()

    def test_create_contract_type_empty_fields(self, db_session):
        """
        B-TYPE-003: 创建合同类型 - 空字段校验
        验收标准: 返回验证错误
        """
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        # 缺少必填字段 code
        response = client.post(
            "/api/contract-types",
            json={"name": "租赁合同"},
        )

        assert response.status_code == 422  # Validation error

        # code 为空字符串
        response = client.post(
            "/api/contract-types",
            json={"code": "", "name": "租赁合同"},
        )

        assert response.status_code == 422

        app.dependency_overrides.clear()

    def test_update_contract_type(self, db_session):
        """
        B-TYPE-004: 编辑合同类型
        验收标准: 修改成功，数据更新
        """
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base
        from server.models.contract import ContractType

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        # 先创建
        create_response = client.post(
            "/api/contract-types",
            json={"code": "RENTAL", "name": "租赁合同"},
        )
        type_id = create_response.json()["data"]["id"]

        # 更新
        response = client.put(
            f"/api/contract-types/{type_id}",
            json={"name": "房屋租赁合同", "description": "更新后的描述"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "房屋租赁合同"
        assert data["data"]["description"] == "更新后的描述"
        assert data["data"]["code"] == "RENTAL"  # code 不应改变

        app.dependency_overrides.clear()

    def test_disable_enable_contract_type(self, db_session):
        """
        B-TYPE-005: 禁用/启用合同类型
        验收标准: 状态切换成功
        """
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        # 创建
        create_response = client.post(
            "/api/contract-types",
            json={"code": "RENTAL", "name": "租赁合同"},
        )
        type_id = create_response.json()["data"]["id"]
        assert create_response.json()["data"]["is_active"] is True

        # 禁用
        response = client.patch(
            f"/api/contract-types/{type_id}/toggle-status",
        )

        assert response.status_code == 200
        assert response.json()["data"]["is_active"] is False

        # 启用
        response = client.patch(
            f"/api/contract-types/{type_id}/toggle-status",
        )

        assert response.status_code == 200
        assert response.json()["data"]["is_active"] is True

        app.dependency_overrides.clear()

    def test_delete_contract_type_without_relation(self, db_session):
        """
        B-TYPE-007: 删除合同类型 - 无关联
        验收标准: 删除成功
        """
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        # 创建
        create_response = client.post(
            "/api/contract-types",
            json={"code": "RENTAL", "name": "租赁合同"},
        )
        type_id = create_response.json()["data"]["id"]

        # 删除
        response = client.delete(f"/api/contract-types/{type_id}")

        assert response.status_code == 200
        assert response.json()["success"] is True

        # 确认已删除
        response = client.get(f"/api/contract-types/{type_id}")
        assert response.status_code == 404

        app.dependency_overrides.clear()

    def test_list_contract_types(self, db_session):
        """
        B-TYPE-001: 验证列表显示
        """
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        # 创建多个类型
        for i in range(5):
            client.post(
                "/api/contract-types",
                json={"code": f"TYPE_{i}", "name": f"类型{i}"},
            )

        # 列表查询
        response = client.get("/api/contract-types")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 5
        assert len(data["data"]["items"]) == 5

        app.dependency_overrides.clear()

    def test_get_contract_type_detail(self, db_session):
        """查看合同类型详情"""
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        # 创建
        create_response = client.post(
            "/api/contract-types",
            json={"code": "RENTAL", "name": "租赁合同", "description": "房屋租赁"},
        )
        type_id = create_response.json()["data"]["id"]

        # 获取详情
        response = client.get(f"/api/contract-types/{type_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["code"] == "RENTAL"
        assert data["data"]["name"] == "租赁合同"
        assert data["data"]["description"] == "房屋租赁"

        app.dependency_overrides.clear()

    def test_get_nonexistent_contract_type(self, db_session):
        """获取不存在的类型"""
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        response = client.get("/api/contract-types/99999")

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["success"] is False

        app.dependency_overrides.clear()


class TestDefaultContractTypesInit:
    """默认合同类型初始化测试"""

    def test_init_default_contract_types(self):
        """验证默认合同类型初始化功能"""
        from server.core.database import get_db, Base
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.routers.contract_types import init_default_contract_types, DEFAULT_CONTRACT_TYPES
        from server.models.contract import ContractType

        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        db = TestingSessionLocal()

        # 初始化默认类型
        count = init_default_contract_types(db)

        # 应该创建 6 个默认类型
        assert count == 6, f"Expected 6 types created, got {count}"

        # 再次调用应该返回 0（已存在）
        count2 = init_default_contract_types(db)
        assert count2 == 0

        # 验证所有默认类型都存在
        for type_def in DEFAULT_CONTRACT_TYPES:
            ct = db.query(ContractType).filter(ContractType.code == type_def["code"]).first()
            assert ct is not None, f"ContractType {type_def['code']} not found"
            assert ct.name == type_def["name"]
            assert ct.is_active is True

        db.close()
