"""
合同模块数据模型测试
测试数据模型的创建、关联和基础操作
"""
import pytest
from datetime import datetime

from server.models.contract import ContractType, ContractTemplate, ContractDraft, ContractStatus
from server.models.field import FieldDefinition, FieldGroup, FieldCondition, FieldPreset, FieldType


class TestContractTypeModel:
    """合同类型模型测试"""

    def test_create_contract_type(self, db_session):
        """测试创建合同类型"""
        contract_type = ContractType(
            code="RENTAL",
            name="租赁合同",
            description="房屋租赁相关合同",
            is_active=True,
        )
        db_session.add(contract_type)
        db_session.commit()

        assert contract_type.id is not None
        assert contract_type.code == "RENTAL"
        assert contract_type.name == "租赁合同"
        assert contract_type.is_active is True
        assert contract_type.created_at is not None

    def test_contract_type_unique_code(self, db_session):
        """测试合同类型编码唯一性约束"""
        contract_type1 = ContractType(code="RENTAL", name="租赁合同")
        db_session.add(contract_type1)
        db_session.commit()

        contract_type2 = ContractType(code="RENTAL", name="租赁合同2")
        db_session.add(contract_type2)

        with pytest.raises(Exception):  # SQLite IntegrityError
            db_session.commit()

    def test_contract_type_default_values(self, db_session):
        """测试合同类型默认值"""
        contract_type = ContractType(code="SALES", name="销售合同")
        db_session.add(contract_type)
        db_session.commit()

        assert contract_type.is_active is True
        assert contract_type.description is None


class TestContractTemplateModel:
    """合同模板模型测试"""

    def test_create_template(self, db_session, test_b_user):
        """测试创建合同模板"""
        template = ContractTemplate(
            name="房屋租赁合同模板",
            description="标准住宅租赁合同",
            template_type="RENTAL",
            content="# 房屋租赁合同\n\n甲方（出租方）：{{lessor_name}}",
            version=1,
            status="draft",
            created_by=test_b_user.id,
        )
        db_session.add(template)
        db_session.commit()

        assert template.id is not None
        assert template.name == "房屋租赁合同模板"
        assert template.version == 1
        assert template.status == "draft"

    def test_template_placeholders_json(self, db_session):
        """测试模板占位符JSON存储"""
        placeholders = [
            {"name": "lessor_name", "display_name": "房东姓名", "field_type": "text"},
            {"name": "lessee_name", "display_name": "租客姓名", "field_type": "text"},
        ]
        template = ContractTemplate(
            name="测试模板",
            template_type="RENTAL",
            content="合同内容",
            placeholders=placeholders,
        )
        db_session.add(template)
        db_session.commit()

        db_session.refresh(template)
        assert template.placeholders == placeholders
        assert len(template.placeholders) == 2


class TestContractDraftModel:
    """合同草稿模型测试"""

    def test_create_draft(self, db_session, test_user):
        """测试创建合同草稿"""
        draft = ContractDraft(
            name="我的租房合同",
            user_id=test_user.id,
            status=ContractStatus.DRAFT.value,
            form_data={"lessor_name": "张三"},
        )
        db_session.add(draft)
        db_session.commit()

        assert draft.id is not None
        assert draft.name == "我的租房合同"
        assert draft.status == "draft"
        assert draft.filled_fields == 0

    def test_draft_form_data_json(self, db_session, test_user):
        """测试草稿表单数据JSON存储"""
        form_data = {
            "lessor_name": "张三",
            "lessee_name": "李四",
            "monthly_rent": 5000,
        }
        draft = ContractDraft(
            name="测试草稿",
            user_id=test_user.id,
            form_data=form_data,
        )
        db_session.add(draft)
        db_session.commit()

        db_session.refresh(draft)
        assert draft.form_data == form_data
        assert draft.form_data["monthly_rent"] == 5000

    def test_draft_completion_rate(self, db_session, test_user):
        """测试草稿完成度计算"""
        draft = ContractDraft(
            name="测试草稿",
            user_id=test_user.id,
            filled_fields=3,
            total_fields=10,
        )
        db_session.add(draft)
        db_session.commit()

        db_session.refresh(draft)
        assert draft.filled_fields == 3
        assert draft.total_fields == 10


class TestFieldDefinitionModel:
    """字段定义模型测试"""

    def test_create_field_definition(self, db_session):
        """测试创建字段定义"""
        field = FieldDefinition(
            field_name="lessor_name",
            display_name="房东姓名",
            field_type=FieldType.TEXT.value,
            required=True,
            description="合同甲方姓名",
            placeholder="请输入房东姓名",
        )
        db_session.add(field)
        db_session.commit()

        assert field.id is not None
        assert field.field_name == "lessor_name"
        assert field.required is True
        assert field.validation_rules is None

    def test_field_validation_rules_json(self, db_session):
        """测试字段验证规则JSON存储"""
        validation_rules = {
            "min_length": 2,
            "max_length": 50,
        }
        field = FieldDefinition(
            field_name="lessor_name",
            display_name="房东姓名",
            field_type=FieldType.TEXT.value,
            validation_rules=validation_rules,
        )
        db_session.add(field)
        db_session.commit()

        db_session.refresh(field)
        assert field.validation_rules == validation_rules
        assert field.validation_rules["max_length"] == 50


class TestFieldGroupModel:
    """字段分组模型测试"""

    def test_create_field_group(self, db_session):
        """测试创建字段分组"""
        group = FieldGroup(
            name="甲方信息",
            description="出租方相关信息",
            sort_order=1,
        )
        db_session.add(group)
        db_session.commit()

        assert group.id is not None
        assert group.name == "甲方信息"
        assert group.sort_order == 1


class TestFieldConditionModel:
    """字段条件模型测试"""

    def test_create_display_condition(self, db_session):
        """测试创建显示条件"""
        # 先创建一个字段
        field = FieldDefinition(
            field_name="payment_method",
            display_name="付款方式",
            field_type=FieldType.SELECT.value,
        )
        db_session.add(field)
        db_session.commit()
        db_session.refresh(field)

        conditions = [
            {"field": "lease_type", "operator": "equals", "value": "commercial"}
        ]
        condition = FieldCondition(
            field_id=field.id,
            condition_type="display",
            conditions=conditions,
            logic_operator="AND",
        )
        db_session.add(condition)
        db_session.commit()

        assert condition.id is not None
        assert condition.condition_type == "display"
        assert condition.conditions == conditions

    def test_required_condition(self, db_session):
        """测试创建必填条件"""
        field = FieldDefinition(
            field_name="deposit",
            display_name="押金",
            field_type=FieldType.NUMBER.value,
        )
        db_session.add(field)
        db_session.commit()
        db_session.refresh(field)

        conditions = [
            {"field": "has_deposit", "operator": "equals", "value": True}
        ]
        condition = FieldCondition(
            field_id=field.id,
            condition_type="required",
            conditions=conditions,
        )
        db_session.add(condition)
        db_session.commit()

        assert condition.condition_type == "required"


class TestFieldPresetModel:
    """字段预设模型测试"""

    def test_create_field_preset(self, db_session):
        """测试创建字段预设"""
        preset = FieldPreset(
            field_name="lessor_name",
            display_name="姓名",
            field_type=FieldType.TEXT.value,
            category="甲方信息",
            content_hash="abc123",
        )
        db_session.add(preset)
        db_session.commit()

        assert preset.id is not None
        assert preset.field_name == "lessor_name"
        assert preset.content_hash == "abc123"

    def test_preset_content_hash_unique(self, db_session):
        """测试预设hash唯一性"""
        preset1 = FieldPreset(
            field_name="name1",
            display_name="姓名1",
            field_type=FieldType.TEXT.value,
            content_hash="unique_hash",
        )
        db_session.add(preset1)
        db_session.commit()

        preset2 = FieldPreset(
            field_name="name2",
            display_name="姓名2",
            field_type=FieldType.TEXT.value,
            content_hash="unique_hash",
        )
        db_session.add(preset2)

        with pytest.raises(Exception):
            db_session.commit()
