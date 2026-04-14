"""
字段相似度计算服务
用于检测重复或相似的字段定义
"""
import difflib
from typing import List, Dict, Any


def calculate_similarity(str1: str, str2: str) -> float:
    """
    计算两个字符串的相似度

    Args:
        str1: 字符串1
        str2: 字符串2

    Returns:
        相似度分数 0.0 - 1.0
    """
    return difflib.SequenceMatcher(None, str1, str2).ratio()


def find_similar_fields(
    query: str,
    candidates: List[Dict[str, Any]],
    threshold: float = 0.65
) -> List[Dict[str, Any]]:
    """
    在候选字段中查找与查询字段相似的字段

    Args:
        query: 查询的字段名称（通常为 display_name）
        candidates: 候选字段列表，每项包含 field_name, display_name 等
        threshold: 相似度阈值，超过此值才返回

    Returns:
        相似字段列表，按相似度降序排列，每项包含:
        {
            "field": 字段对象,
            "similarity_score": float  # 相似度分数
        }
    """
    results: List[Dict[str, Any]] = []

    for candidate in candidates:
        display_name = candidate.get("display_name", "")
        field_name = candidate.get("field_name", "")

        # 计算两个维度的相似度
        sim_display = calculate_similarity(query, display_name)
        sim_field = calculate_similarity(query, field_name)

        # 取最高相似度
        max_similarity = max(sim_display, sim_field)

        if max_similarity >= threshold:
            results.append({
                "field": candidate,
                "similarity_score": round(max_similarity, 2),
            })

    # 按相似度降序排列
    results.sort(key=lambda x: x["similarity_score"], reverse=True)

    return results


def is_likely_duplicate(
    new_field_name: str,
    existing_field_name: str,
    threshold: float = 0.8
) -> bool:
    """
    判断新字段是否可能是现有字段的重复

    Args:
        new_field_name: 新字段名称
        existing_field_name: 现有字段名称
        threshold: 判定为重复的阈值（默认 0.8）

    Returns:
        是否可能是重复
    """
    similarity = calculate_similarity(new_field_name, existing_field_name)
    return similarity >= threshold
