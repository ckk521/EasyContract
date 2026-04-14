"""
合同草稿 API 测试 (C-end)
C-DRAFT-001 ~ C-DRAFT-006

TDD RED 阶段：先编写失败测试
"""
import pytest
from fastapi.testclient import TestClient


class TestDraftAPI:
    """合同草稿 API 测试"""

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

        # 创建测试用户
        from server.models.user import User
        self.user = User(
            username="testuser",
            password_hash="hashed",
            user_type="C",
        )
        db = TestingSessionLocal()
        db.add(self.user)
        db.commit()
        db.refresh(self.user)
        db.close()

        # 创建模板
        response = self.client.post(
            "/api/templates",
            json={
                "name": "Test Template",
                "template_type": "RENTAL",
                "content": "# Contract\nParty A: {{lessor_name}}\nParty B: {{lessee_name}}\nDeposit: {{deposit_amount}}",
            },
        )
        self.template_id = response.json()["data"]["id"]

        # 创建字段
        self.lessor_field = self.client.post(
            "/api/fields",
            json={
                "field_name": "lessor_name",
                "display_name": "房东姓名",
                "field_type": "text",
                "required": True,
                "template_id": self.template_id,
            },
        ).json()["data"]

        self.lessee_field = self.client.post(
            "/api/fields",
            json={
                "field_name": "lessee_name",
                "display_name": "租客姓名",
                "field_type": "text",
                "required": True,
                "template_id": self.template_id,
            },
        ).json()["data"]

        self.deposit_field = self.client.post(
            "/api/fields",
            json={
                "field_name": "deposit_amount",
                "display_name": "押金金额",
                "field_type": "number",
                "required": False,
                "template_id": self.template_id,
            },
        ).json()["data"]

    def teardown_method(self):
        self.app.dependency_overrides.clear()

    def test_create_draft(self):
        """
        C-DRAFT-001: 创建合同草稿
        """
        response = self.client.post(
            "/api/drafts",
            json={
                "name": "我的租赁合同",
                "template_id": self.template_id,
                "user_id": self.user.id,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "我的租赁合同"
        assert data["data"]["template_id"] == self.template_id
        assert data["data"]["status"] == "draft"

    def test_save_field_values(self):
        """
        C-DRAFT-002: 保存字段填写值
        """
        # 创建草稿
        draft_response = self.client.post(
            "/api/drafts",
            json={
                "name": "Test Draft",
                "template_id": self.template_id,
                "user_id": self.user.id,
            },
        )
        draft_id = draft_response.json()["data"]["id"]

        # 保存字段值
        response = self.client.put(
            f"/api/drafts/{draft_id}/fields",
            json={
                "lessor_name": "张三",
                "lessee_name": "李四",
                "deposit_amount": 5000,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["form_data"]["lessor_name"] == "张三"
        assert data["data"]["filled_fields"] == 3

    def test_get_draft_with_fields(self):
        """
        C-DRAFT-003: 获取草稿详情（含字段数据）
        """
        # 创建并填充草稿
        draft_response = self.client.post(
            "/api/drafts",
            json={
                "name": "Test Draft",
                "template_id": self.template_id,
                "user_id": self.user.id,
            },
        )
        draft_id = draft_response.json()["data"]["id"]

        self.client.put(
            f"/api/drafts/{draft_id}/fields",
            json={
                "lessor_name": "张三",
                "lessee_name": "李四",
            },
        )

        # 获取草稿
        response = self.client.get(f"/api/drafts/{draft_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["form_data"]["lessor_name"] == "张三"

    def test_validate_fields(self):
        """
        C-DRAFT-004: 字段验证
        """
        # 创建草稿
        draft_response = self.client.post(
            "/api/drafts",
            json={
                "name": "Test Draft",
                "template_id": self.template_id,
                "user_id": self.user.id,
            },
        )
        draft_id = draft_response.json()["data"]["id"]

        # 验证必填字段（故意不填）
        response = self.client.post(
            f"/api/drafts/{draft_id}/validate",
            json={
                "lessor_name": "张三",
                # 故意不填 lessee_name（必填）
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["errors"]) > 0
        assert any("lessee_name" in e["field"] for e in data["data"]["errors"])

    def test_generate_contract_content(self):
        """
        C-DRAFT-005: 生成合同内容
        """
        # 创建并填充草稿
        draft_response = self.client.post(
            "/api/drafts",
            json={
                "name": "Test Draft",
                "template_id": self.template_id,
                "user_id": self.user.id,
            },
        )
        draft_id = draft_response.json()["data"]["id"]

        self.client.put(
            f"/api/drafts/{draft_id}/fields",
            json={
                "lessor_name": "张三",
                "lessee_name": "李四",
                "deposit_amount": 5000,
            },
        )

        # 生成合同
        response = self.client.post(f"/api/drafts/{draft_id}/generate")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "张三" in data["data"]["content"]
        assert "李四" in data["data"]["content"]
        assert "5000" in data["data"]["content"]

    def test_list_user_drafts(self):
        """
        C-DRAFT-006: 列出用户的草稿
        """
        # 创建多个草稿
        for i in range(3):
            self.client.post(
                "/api/drafts",
                json={
                    "name": f"Draft {i}",
                    "template_id": self.template_id,
                    "user_id": self.user.id,
                },
            )

        # 列出草稿
        response = self.client.get(f"/api/drafts?user_id={self.user.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 3

    def test_delete_draft(self):
        """
        C-DRAFT-007: 删除草稿
        """
        # 创建草稿
        draft_response = self.client.post(
            "/api/drafts",
            json={
                "name": "To Delete",
                "template_id": self.template_id,
                "user_id": self.user.id,
            },
        )
        draft_id = draft_response.json()["data"]["id"]

        # 删除
        response = self.client.delete(f"/api/drafts/{draft_id}")

        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_field_condition_display(self):
        """
        C-DRAFT-008: 字段条件 - 显示条件
        """
        # 创建有显示条件的字段（当 has_deposit=true 时显示 deposit_amount）
        has_deposit_field = self.client.post(
            "/api/fields",
            json={
                "field_name": "has_deposit",
                "display_name": "是否有押金",
                "field_type": "checkbox",
                "required": True,
                "template_id": self.template_id,
            },
        ).json()["data"]

        # 设置条件
        self.client.post(
            "/api/field-conditions",
            json={
                "field_id": self.deposit_field["id"],
                "condition_type": "display",
                "conditions": [
                    {"field": "has_deposit", "operator": "equals", "value": True}
                ],
            },
        )

        # 创建草稿
        draft_response = self.client.post(
            "/api/drafts",
            json={
                "name": "Conditional Draft",
                "template_id": self.template_id,
                "user_id": self.user.id,
            },
        )
        draft_id = draft_response.json()["data"]["id"]

        # 先保存 form_data，设置 has_deposit=true
        self.client.put(
            f"/api/drafts/{draft_id}/fields",
            json={
                "has_deposit": True,
                "lessor_name": "张三",
                "lessee_name": "李四",
            },
        )

        # 获取应该显示的字段
        response = self.client.get(f"/api/drafts/{draft_id}/fields")

        assert response.status_code == 200
        data = response.json()
        # deposit_amount 应该在 has_deposit=true 时显示
        field_names = [f["field_name"] for f in data["data"]["fields"]]
        assert "deposit_amount" in field_names
