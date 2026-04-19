"""
合同模板解析服务
用于提取占位符、推断字段类型、渲染模板
"""
import re
from typing import List, Dict, Any


# 占位符正则表达式
PLACEHOLDER_PATTERN = re.compile(r'\{\{([^}]+)\}\}')


def extract_placeholders(content: str) -> List[Dict[str, Any]]:
    """
    从模板内容中提取所有占位符

    Args:
        content: Markdown 模板内容

    Returns:
        占位符列表，每个占位符包含 name, display_name, field_type, required
    """
    placeholders = []
    seen = set()

    for match in PLACEHOLDER_PATTERN.finditer(content):
        name = match.group(1).strip()

        # 去重
        if name in seen:
            continue
        seen.add(name)

        field_type = infer_field_type(name)
        display_name = generate_display_name(name)
        required = is_field_required(name)

        placeholders.append({
            "name": name,
            "display_name": display_name,
            "field_type": field_type,
            "required": required,
        })

    return placeholders


def infer_field_type(field_name: str) -> str:
    """
    根据字段名推断字段类型

    Args:
        field_name: 字段名称

    Returns:
        字段类型: text, number, date, select, checkbox
    """
    name_lower = field_name.lower()

    # 布尔字段（优先检查）
    bool_keywords = ["has_", "is_", "enable", "active", "agree",
                    "是否", "有没有"]
    for keyword in bool_keywords:
        if keyword in name_lower:
            return "checkbox"

    # 日期字段
    date_keywords = ["date", "时间", "日期", "生日", "到期"]
    for keyword in date_keywords:
        if keyword in name_lower:
            return "date"

    # 数字字段
    number_keywords = ["amount", "rent", "deposit", "price", "cost", "fee",
                       "number", "num", "count", "total", "金额", "租金",
                       "押金", "价格", "费用", "数量", "总计"]
    for keyword in number_keywords:
        if keyword in name_lower:
            return "number"

    # 选择字段
    select_keywords = ["method", "type", "mode", "way", "方式",
                       "类型", "模式"]
    for keyword in select_keywords:
        if keyword in name_lower:
            return "select"

    # 文本字段（默认）
    return "text"


def generate_display_name(field_name: str) -> str:
    """
    根据字段名生成显示名称

    Args:
        field_name: 字段名称（如 lessor_name）

    Returns:
        显示名称（如 房东姓名）
    """
    # 下划线转中文
    name_mapping = {
        "lessor": "房东",
        "lessee": "租客",
        "name": "姓名",
        "address": "地址",
        "property": "房屋",
        "monthly_rent": "月租金",
        "deposit": "押金",
        "amount": "金额",
        "start_date": "开始日期",
        "end_date": "结束日期",
        "payment": "付款",
        "method": "方式",
        "contract": "合同",
        "no": "编号",
        "phone": "电话",
        "email": "邮箱",
        "id_card": "身份证",
    }

    name_lower = field_name.lower()

    # 先检查完整匹配
    for key, value in name_mapping.items():
        if key in name_lower:
            # 尝试找到对应的中文
            if key == "lessor":
                return "房东姓名" if "name" in name_lower else "房东"
            elif key == "lessee":
                return "租客姓名" if "name" in name_lower else "租客"
            elif key == "property":
                return "房屋地址" if "address" in name_lower else "房屋"
            elif key == "monthly_rent":
                return "月租金"
            elif key == "start_date":
                return "开始日期"
            elif key == "end_date":
                return "结束日期"

    # 通用转换：下划线转空格，首字母大写
    display = field_name.replace("_", " ").title()

    # 简单中文化
    if display == field_name:
        return field_name

    return display


def is_field_required(field_name: str) -> bool:
    """
    判断字段是否通常为必填

    Args:
        field_name: 字段名称

    Returns:
        是否必填
    """
    # 非必填字段
    optional_keywords = ["optional", "remark", "note", "memo", "description",
                        "可选", "备注", "说明", "描述"]
    name_lower = field_name.lower()
    for keyword in optional_keywords:
        if keyword in name_lower:
            return False

    # 关键字段默认必填
    required_keywords = ["name", "date", "amount", "rent", "address",
                        "姓名", "日期", "金额", "地址"]
    for keyword in required_keywords:
        if keyword in name_lower:
            return True

    return False


def render_template(content: str, fields: Dict[str, Any]) -> str:
    """
    渲染模板，用字段值替换占位符

    Args:
        content: 模板内容
        fields: 字段值字典

    Returns:
        渲染后的内容
    """
    result = content

    # Handle {{field_name}} style placeholders (markdown templates)
    for field_name, value in fields.items():
        placeholder = f"{{{{{field_name}}}}}"
        result = result.replace(placeholder, str(value) if value is not None else "")

    # Handle <span class="ec-placeholder" data-index="N"> style placeholders (HTML templates)
    # fields keys are placeholder indices as strings ("0", "1", etc.)
    import re
    placeholder_pattern = re.compile(
        r'<span class="ec-placeholder" data-index="(\d+)">[^<]*</span>'
    )

    def replace_placeholder(match):
        index = match.group(1)
        value = fields.get(index, fields.get(int(index), ""))
        return str(value) if value is not None else ""

    result = placeholder_pattern.sub(replace_placeholder, result)

    return result


def validate_template_content(content: str) -> tuple[bool, str]:
    """
    验证模板内容格式

    Args:
        content: 模板内容

    Returns:
        (是否有效, 错误消息)
    """
    if not content or not content.strip():
        return False, "模板内容不能为空"

    # 检查是否有占位符
    placeholders = extract_placeholders(content)
    if len(placeholders) == 0:
        return False, "模板内容中未找到占位符，请使用 {{字段名}} 格式定义占位符"

    return True, ""
