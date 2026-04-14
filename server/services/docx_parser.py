"""
Word 文档解析服务
用于将 docx 文件转换为 HTML 并提取占位符
"""
import re
import os
from typing import List, Dict, Any, Tuple
from pathlib import Path


def parse_docx_to_html(file_path: str) -> str:
    """
    将 docx 文件转换为 HTML

    Args:
        file_path: docx 文件路径

    Returns:
        转换后的 HTML 字符串
    """
    try:
        import mammoth
    except ImportError:
        raise ImportError("mammoth 库未安装，请运行: pip install mammoth")

    with open(file_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
        html = result.value
        # 处理可能的警告
        if result.messages:
            # 记录警告但不中断
            for message in result.messages:
                print(f"Warning: {message}")
        return html


def extract_underline_placeholders(html: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    从 HTML 内容中提取下划线占位符

    匹配连续 3 个或以上下划线 "___" 作为占位符

    Args:
        html: HTML 内容

    Returns:
        (处理后的 HTML, 占位符列表)
        占位符列表每项包含: index, context, original_text
    """
    # 正则匹配连续 3 个及以上下划线
    placeholder_pattern = re.compile(r'_{3,}')
    placeholders: List[Dict[str, Any]] = []

    def replace_placeholder(match: re.Match) -> str:
        original_text = match.group(0)
        index = len(placeholders)

        # 获取前后各 20 个字符作为上下文
        start = max(0, match.start() - 20)
        end = min(len(html), match.end() + 20)
        context = html[start:end]
        # 清理 HTML 标签对上下文的干扰
        context = re.sub(r'<[^>]+>', '', context)

        placeholders.append({
            "index": index,
            "context": context,
            "original_text": original_text,
        })

        # 替换为带标记的 span
        return f'<span class="ec-placeholder" data-index="{index}">{original_text}</span>'

    # 替换 HTML 中的占位符
    processed_html = placeholder_pattern.sub(replace_placeholder, html)

    return processed_html, placeholders


def parse_docx_placeholders(file_path: str) -> Dict[str, Any]:
    """
    解析 docx 文件，返回 HTML 和占位符信息

    Args:
        file_path: docx 文件路径

    Returns:
        {
            "html_content": str,  # 转换后的 HTML
            "placeholders": List[Dict],  # 占位符列表
            "placeholder_count": int  # 占位符数量
        }
    """
    # 检查文件是否存在
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件不存在: {file_path}")

    # 检查文件扩展名
    if not file_path.lower().endswith('.docx'):
        raise ValueError("只支持 .docx 格式的 Word 文档")

    # 解析 docx 为 HTML
    html_content = parse_docx_to_html(file_path)

    # 提取占位符
    processed_html, placeholders = extract_underline_placeholders(html_content)

    return {
        "html_content": processed_html,
        "placeholders": placeholders,
        "placeholder_count": len(placeholders),
    }


def validate_docx_file(file_path: str, max_size_mb: int = 10) -> Tuple[bool, str]:
    """
    验证 docx 文件

    Args:
        file_path: 文件路径
        max_size_mb: 最大文件大小（MB）

    Returns:
        (是否有效, 错误消息)
    """
    if not os.path.exists(file_path):
        return False, "文件不存在"

    if not file_path.lower().endswith('.docx'):
        return False, "只支持 .docx 格式的 Word 文档"

    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if file_size_mb > max_size_mb:
        return False, f"文件大小超过 {max_size_mb}MB 限制"

    return True, ""
