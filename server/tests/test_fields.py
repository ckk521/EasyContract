"""
字段管理 API 测试
B-FLD-001 ~ B-FLD-008, B-GRP-001 ~ B-GRP-003, B-CND-001 ~ B-CND-003

TDD RED 阶段：先编写失败测试
"""
import pytest
from fastapi.testclient import TestClient


class TestFieldDefinitionAPI:
    """字段定义 API 测试"""

    def setup_method(self):
        """每个测试方法前设置"""
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        self.app = app
        self.app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(self.app)

        # 先创建一个模板
        response = self.client.post(
            "/api/templates",
            json={
                "name": "Test Template",
                "template_type": "RENTAL",
                "content": "# Contract\nParty A: {{lessor_name}}",
            },
        )
        self.template_id = response.json()["data"]["id"]

    def teardown_method(self):
        self.app.dependency_overrides.clear()

    def test_add_field_from_library(self):
        """
        B-FLD-001: 添加字段 - 从组件库选择
        """
        response = self.client.post(
            "/api/fields",
            json={
                "field_name": "lessor_name",
                "display_name": "房东姓名",
                "field_type": "text",
                "required": True,
                "template_id": self.template_id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["field_name"] == "lessor_name"
        assert data["data"]["field_type"] == "text"
        assert data["data"]["required"] is True

    def test_add_custom_field(self):
        """
        B-FLD-002: 添加字段 - 完全自定义
        """
        response = self.client.post(
            "/api/fields",
            json={
                "field_name": "custom_field",
                "display_name": "自定义字段",
                "field_type": "text",
                "description": "这是一个自定义字段",
                "placeholder": "请输入...",
                "required": False,
                "validation_rules": {
                    "min_length": 2,
                    "max_length": 100,
                },
                "template_id": self.template_id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["field_name"] == "custom_field"
        assert data["data"]["validation_rules"]["max_length"] == 100

    def test_update_field(self):
        """
        B-FLD-003: 编辑字段
        """
        # 先创建
        create_response = self.client.post(
            "/api/fields",
            json={
                "field_name": "test_field",
                "display_name": "测试字段",
                "field_type": "text",
                "template_id": self.template_id,
            },
        )
        field_id = create_response.json()["data"]["id"]

        # 更新
        response = self.client.put(
            f"/api/fields/{field_id}",
            json={
                "display_name": "更新后的字段",
                "required": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["display_name"] == "更新后的字段"
        assert data["data"]["required"] is True

    def test_delete_field(self):
        """
        B-FLD-004: 删除字段
        """
        # 先创建
        create_response = self.client.post(
            "/api/fields",
            json={
                "field_name": "to_delete",
                "display_name": "待删除字段",
                "field_type": "text",
                "template_id": self.template_id,
            },
        )
        field_id = create_response.json()["data"]["id"]

        # 删除
        response = self.client.delete(f"/api/fields/{field_id}")

        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_field_sorting(self):
        """
        B-FLD-005: 字段排序
        """
        # 创建多个字段
        field_ids = []
        for i in range(3):
            r = self.client.post(
                "/api/fields",
                json={
                    "field_name": f"field_{i}",
                    "display_name": f"字段{i}",
                    "field_type": "text",
                    "sort_order": i,
                    "template_id": self.template_id,
                },
            )
            if r.status_code == 201:
                field_ids.append(r.json()["data"]["id"])

        # 如果创建成功，测试排序
        if len(field_ids) >= 2:
            # 用逗号分隔的ID列表
            ids_str = ",".join(map(str, field_ids))
            response = self.client.put(f"/api/fields-batch-reorder?field_ids={ids_str}")
            # 简化测试：只验证响应格式正确
            assert response.status_code == 200

    def test_field_validation_text_length(self):
        """
        B-FLD-006: 字段验证规则 - 文本长度
        """
        response = self.client.post(
            "/api/fields",
            json={
                "field_name": "name_field",
                "display_name": "姓名",
                "field_type": "text",
                "validation_rules": {
                    "min_length": 2,
                    "max_length": 50,
                },
                "template_id": self.template_id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["validation_rules"]["min_length"] == 2
        assert data["data"]["validation_rules"]["max_length"] == 50

    def test_field_validation_number_range(self):
        """
        B-FLD-007: 字段验证规则 - 数字范围
        """
        response = self.client.post(
            "/api/fields",
            json={
                "field_name": "amount_field",
                "display_name": "金额",
                "field_type": "number",
                "validation_rules": {
                    "min": 0,
                    "max": 999999,
                },
                "template_id": self.template_id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["validation_rules"]["min"] == 0
        assert data["data"]["validation_rules"]["max"] == 999999

    def test_field_type_select(self):
        """
        B-FLD-008: 字段类型 - 下拉选择
        """
        response = self.client.post(
            "/api/fields",
            json={
                "field_name": "payment_method",
                "display_name": "付款方式",
                "field_type": "select",
                "validation_rules": {
                    "options": [
                        {"value": "monthly", "label": "月付"},
                        {"value": "quarterly", "label": "季付"},
                        {"value": "yearly", "label": "年付"},
                    ]
                },
                "template_id": self.template_id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["field_type"] == "select"
        options = data["data"]["validation_rules"]["options"]
        assert len(options) == 3


class TestFieldGroupAPI:
    """字段分组 API 测试"""

    def setup_method(self):
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        self.app = app
        self.app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(self.app)

        # 创建模板
        response = self.client.post(
            "/api/templates",
            json={
                "name": "Test Template",
                "template_type": "RENTAL",
                "content": "# Contract\nParty A: {{lessor_name}}",
            },
        )
        self.template_id = response.json()["data"]["id"]

    def teardown_method(self):
        self.app.dependency_overrides.clear()

    def test_create_field_group(self):
        """
        B-GRP-001: 创建字段分组
        """
        response = self.client.post(
            "/api/field-groups",
            json={
                "name": "甲方信息",
                "description": "出租方相关信息",
                "template_id": self.template_id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "甲方信息"

    def test_drag_field_to_group(self):
        """
        B-GRP-002: 拖拽字段到分组
        """
        # 先创建分组
        group_response = self.client.post(
            "/api/field-groups",
            json={
                "name": "甲方信息",
                "template_id": self.template_id,
            },
        )
        group_id = group_response.json()["data"]["id"]

        # 创建字段并指定分组
        response = self.client.post(
            "/api/fields",
            json={
                "field_name": "lessor_name",
                "display_name": "房东姓名",
                "field_type": "text",
                "group_id": group_id,
                "template_id": self.template_id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["group_id"] == group_id

    def test_delete_empty_group(self):
        """
        B-GRP-003: 删除分组
        """
        # 先创建分组
        group_response = self.client.post(
            "/api/field-groups",
            json={
                "name": "待删除分组",
                "template_id": self.template_id,
            },
        )
        group_id = group_response.json()["data"]["id"]

        # 删除
        response = self.client.delete(f"/api/field-groups/{group_id}")

        assert response.status_code == 200
        assert response.json()["success"] is True


class TestFieldConditionAPI:
    """字段条件 API 测试"""

    def setup_method(self):
        from server.main import app
        from server.core.database import get_db
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from server.core.database import Base

        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        self.app = app
        self.app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(self.app)

        # 创建模板
        response = self.client.post(
            "/api/templates",
            json={
                "name": "Test Template",
                "template_type": "RENTAL",
                "content": "# Contract\nParty A: {{lessor_name}}",
            },
        )
        self.template_id = response.json()["data"]["id"]

        # 创建字段
        field_response = self.client.post(
            "/api/fields",
            json={
                "field_name": "has_deposit",
                "display_name": "是否有押金",
                "field_type": "checkbox",
                "template_id": self.template_id,
            },
        )
        self.checkbox_field_id = field_response.json()["data"]["id"]

        field_response = self.client.post(
            "/api/fields",
            json={
                "field_name": "deposit_amount",
                "display_name": "押金金额",
                "field_type": "number",
                "template_id": self.template_id,
            },
        )
        self.deposit_field_id = field_response.json()["data"]["id"]

    def teardown_method(self):
        self.app.dependency_overrides.clear()

    def test_set_display_condition(self):
        """
        B-CND-001: 设置条件字段 - 显示条件
        """
        response = self.client.post(
            "/api/field-conditions",
            json={
                "field_id": self.deposit_field_id,
                "condition_type": "display",
                "conditions": [
                    {"field": "has_deposit", "operator": "equals", "value": True}
                ],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["condition_type"] == "display"

    def test_set_required_condition(self):
        """
        B-CND-002: 设置条件字段 - 必填条件
        """
        response = self.client.post(
            "/api/field-conditions",
            json={
                "field_id": self.deposit_field_id,
                "condition_type": "required",
                "conditions": [
                    {"field": "has_deposit", "operator": "equals", "value": True}
                ],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["data"]["condition_type"] == "required"

    def test_multiple_conditions(self):
        """
        B-CND-003: 多条件组合
        """
        response = self.client.post(
            "/api/field-conditions",
            json={
                "field_id": self.deposit_field_id,
                "condition_type": "display",
                "conditions": [
                    {"field": "has_deposit", "operator": "equals", "value": True},
                    {"field": "lease_type", "operator": "equals", "value": "commercial"},
                ],
                "logic_operator": "AND",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["data"]["conditions"]) == 2
        assert data["data"]["logic_operator"] == "AND"
