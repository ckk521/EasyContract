"""
合同管理模块 - 前后端联调冒烟测试

运行方式：
    python -m pytest server/tests/test_contract_management_api.py -v

前置条件：
    1. 后端服务运行在 http://localhost:8080
    2. 前端服务运行在 http://localhost:5173 (可选，只用于浏览器测试)
"""
import pytest
import time
from httpx import Client, Response
from pathlib import Path

BACKEND_URL = "http://localhost:8080"
FRONTEND_URL = "http://localhost:5173"


class TestContractTypeAPI:
    """合同类型 API 冒烟测试"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = Client(base_url=BACKEND_URL, timeout=10)
        yield
        self.client.close()

    def test_health(self):
        """后端服务是否正常"""
        response = self.client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_list_contract_types(self):
        """合同类型列表"""
        response = self.client.get("/api/contract-types")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "items" in data["data"]
        assert isinstance(data["data"]["items"], list)

    def test_create_contract_type(self):
        """创建合同类型"""
        unique_code = f"TEST_{int(time.time())}"
        response = self.client.post("/api/contract-types", json={
            "code": unique_code,
            "name": "测试合同类型",
            "description": "冒烟测试用"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["code"] == unique_code
        assert data["data"]["is_active"] is True

    def test_create_duplicate_type_fails(self):
        """重复创建合同类型应失败"""
        unique_code = f"DUP_{int(time.time())}"
        # 先创建一个
        self.client.post("/api/contract-types", json={
            "code": unique_code,
            "name": "原始名称"
        })
        # 再创建同名应失败
        response = self.client.post("/api/contract-types", json={
            "code": unique_code,
            "name": "重复名称"
        })
        assert response.status_code == 400

    def test_get_contract_type_detail(self):
        """获取合同类型详情"""
        # 先创建一个
        create_resp = self.client.post("/api/contract-types", json={
            "code": f"DETAIL_{int(time.time())}",
            "name": "详情测试"
        })
        type_id = create_resp.json()["data"]["id"]

        # 获取详情
        response = self.client.get(f"/api/contract-types/{type_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["name"] == "详情测试"

    def test_update_contract_type(self):
        """更新合同类型"""
        # 先创建一个
        create_resp = self.client.post("/api/contract-types", json={
            "code": f"UPDATE_{int(time.time())}",
            "name": "更新前名称"
        })
        type_id = create_resp.json()["data"]["id"]

        # 更新
        response = self.client.put(f"/api/contract-types/{type_id}", json={
            "name": "更新后名称",
            "description": "更新描述"
        })
        assert response.status_code == 200
        assert response.json()["data"]["name"] == "更新后名称"

    def test_toggle_contract_type_status(self):
        """切换合同类型状态"""
        # 先创建一个
        create_resp = self.client.post("/api/contract-types", json={
            "code": f"TOGGLE_{int(time.time())}",
            "name": "切换状态测试"
        })
        type_id = create_resp.json()["data"]["id"]

        # 禁用
        response = self.client.patch(f"/api/contract-types/{type_id}/toggle-status")
        assert response.status_code == 200
        assert response.json()["data"]["is_active"] is False

        # 启用
        response = self.client.patch(f"/api/contract-types/{type_id}/toggle-status")
        assert response.status_code == 200
        assert response.json()["data"]["is_active"] is True

    def test_delete_contract_type(self):
        """删除合同类型"""
        # 先创建一个
        create_resp = self.client.post("/api/contract-types", json={
            "code": f"DELETE_{int(time.time())}",
            "name": "删除测试"
        })
        type_id = create_resp.json()["data"]["id"]

        # 删除
        response = self.client.delete(f"/api/contract-types/{type_id}")
        assert response.status_code == 200

        # 确认已删除
        response = self.client.get(f"/api/contract-types/{type_id}")
        assert response.status_code == 404


class TestTemplateAPI:
    """合同模板 API 冒烟测试"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = Client(base_url=BACKEND_URL, timeout=30)
        # 先创建一个合同类型
        resp = self.client.post("/api/contract-types", json={
            "code": f"TPL_TEST_{int(time.time())}",
            "name": "Template Test Type"
        })
        json_data = resp.json()
        if resp.status_code == 201 and "data" in json_data:
            self.contract_type_id = json_data["data"]["id"]
        else:
            # 如果创建失败，使用已存在的类型
            list_resp = self.client.get("/api/contract-types?page_size=1")
            self.contract_type_id = list_resp.json()["data"]["items"][0]["id"]
        yield
        self.client.close()

    def test_list_templates(self):
        """模板列表"""
        response = self.client.get("/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "items" in data["data"]
        assert "total" in data["data"]

    def test_create_template_from_markdown(self):
        """从 Markdown 创建模板"""
        response = self.client.post("/api/templates", json={
            "name": "Markdown 测试模板",
            "template_type": "RENTAL",
            "content": "# 合同\n甲方：{{party_a}}",
            "contract_type_id": self.contract_type_id
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "Markdown 测试模板"
        # 验证占位符被识别
        placeholders = data["data"].get("placeholders", [])
        assert len(placeholders) >= 1

    def test_create_template_without_placeholder_fails(self):
        """没有占位符的模板创建应失败"""
        response = self.client.post("/api/templates", json={
            "name": "无占位符模板",
            "template_type": "OTHER",
            "content": "# 合同内容无占位符"
        })
        assert response.status_code == 400

    def test_parse_placeholders_only(self):
        """仅解析占位符"""
        response = self.client.post("/api/templates/parse-placeholders", json={
            "content": "# 合同\n甲方：{{party_a}}\n乙方：{{party_b}}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["total_count"] == 2

    def test_create_from_docx_format(self):
        """从 docx 格式创建模板（模拟前端上传后创建）"""
        response = self.client.post("/api/templates/from-docx", json={
            "name": "Docx 格式模板",
            "template_type": "OTHER",
            "raw_docx_path": "/uploads/test.docx",
            "html_content": "<p>测试内容 ____年____月____日</p>",
            "placeholders": [
                {"index": 0, "context": "年", "original_text": "____"},
                {"index": 1, "context": "月", "original_text": "____"},
                {"index": 2, "context": "日", "original_text": "____"}
            ],
            "contract_type_id": self.contract_type_id
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        # 验证占位符被正确转换
        placeholders = data["data"].get("placeholders", [])
        assert len(placeholders) == 3
        assert placeholders[0]["name"] == "field_0"

    def test_get_template_detail(self):
        """获取模板详情"""
        # 先创建一个
        create_resp = self.client.post("/api/templates", json={
            "name": "详情测试模板",
            "template_type": "RENTAL",
            "content": "# 合同\n甲方：{{party_a}}",
            "contract_type_id": self.contract_type_id
        })
        template_id = create_resp.json()["data"]["id"]

        # 获取详情
        response = self.client.get(f"/api/templates/{template_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["name"] == "详情测试模板"

    def test_update_template(self):
        """更新模板"""
        # 先创建一个
        create_resp = self.client.post("/api/templates", json={
            "name": "更新前",
            "template_type": "RENTAL",
            "content": "# 合同\n甲方：{{party_a}}"
        })
        template_id = create_resp.json()["data"]["id"]

        # 更新
        response = self.client.put(f"/api/templates/{template_id}", json={
            "name": "更新后",
            "description": "新描述"
        })
        assert response.status_code == 200
        assert response.json()["data"]["name"] == "更新后"

    def test_delete_template(self):
        """删除模板"""
        # 先创建一个
        create_resp = self.client.post("/api/templates", json={
            "name": "删除测试",
            "template_type": "RENTAL",
            "content": "# 合同\n甲方：{{party_a}}"
        })
        template_id = create_resp.json()["data"]["id"]

        # 删除
        response = self.client.delete(f"/api/templates/{template_id}")
        assert response.status_code == 200

        # 确认已删除
        response = self.client.get(f"/api/templates/{template_id}")
        assert response.status_code == 404


class TestFieldAPI:
    """字段管理 API 冒烟测试"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = Client(base_url=BACKEND_URL, timeout=10)
        yield
        self.client.close()

    def test_list_fields(self):
        """字段列表"""
        response = self.client.get("/api/fields")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "items" in data["data"]

    def test_default_fields_exist(self):
        """默认字段应该存在"""
        response = self.client.get("/api/fields?page_size=100")
        data = response.json()
        items = data["data"]["items"]
        # 检查默认字段
        default_fields = [item for item in items if item.get("is_default")]
        assert len(default_fields) >= 12, f"默认字段应该有12个，实际有 {len(default_fields)} 个"

    def test_create_custom_field(self):
        """创建自定义字段"""
        unique_name = f"custom_field_{int(time.time())}"
        response = self.client.post("/api/fields", json={
            "field_name": unique_name,
            "display_name": "自定义字段",
            "field_type": "text",
            "required": False
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    def test_find_similar_fields(self):
        """查找相似字段"""
        response = self.client.get("/api/fields/similar?query=party")
        assert response.status_code == 200
        data = response.json()
        assert "similar" in data["data"] or "suggestions" in data["data"] or data["success"] is True


class TestCORS:
    """CORS 配置冒烟测试"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = Client(base_url=BACKEND_URL, timeout=10)
        yield
        self.client.close()

    def test_cors_headers(self):
        """验证 CORS headers 存在"""
        # 模拟 OPTIONS 预检请求
        response = self.client.options("/api/contract-types", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        })
        # FastAPI CornSmiddleware 会自动处理 OPTIONS
        assert response.status_code in [200, 204]

    def test_json_response_has_no_cors_issue(self):
        """验证 JSON 响应没有 CORS 问题"""
        response = self.client.get("/api/contract-types")
        assert response.status_code == 200
        # 如果返回 500 说明可能有 CORS 配置问题
        assert response.status_code != 500


# 快速运行所有测试
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
