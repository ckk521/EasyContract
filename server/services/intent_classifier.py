"""
意图分类器 - 关键词匹配 + LLM分类 + 反思机制
"""
import re
import json
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from server.services.llm_service import get_ai_service
from langchain_core.messages import HumanMessage, SystemMessage


class Intent(str, Enum):
    """一级意图"""
    CONTRACT_DRAFT = "CONTRACT_DRAFT"      # 起草合同
    CONTRACT_REVIEW = "CONTRACT_REVIEW"  # 审核合同
    CONTRACT_QUERY = "CONTRACT_QUERY"    # 合同查询
    DRAFT_RESUME = "DRAFT_RESUME"        # 恢复草稿
    GENERAL_CHAT = "GENERAL_CHAT"        # 通用对话
    CLARIFICATION = "CLARIFICATION"      # 意图澄清
    CONVERSATION_CONTROL = "CONVERSATION_CONTROL"  # 对话控制


class SubIntent(str, Enum):
    """二级意图（合同类型）"""
    RENTAL = "RENTAL"          # 租赁合同
    EMPLOYMENT = "EMPLOYMENT"  # 劳动合同
    SALES = "SALES"            # 买卖合同
    SERVICE = "SERVICE"       # 服务合同
    PARTNERSHIP = "PARTNERSHIP"  # 合作协议
    LOAN = "LOAN"              # 借款合同
    GIFT = "GIFT"             # 赠与合同
    OTHER = "OTHER"           # 其他类型


@dataclass
class IntentResult:
    """意图分类结果"""
    intent: Intent
    sub_intent: Optional[SubIntent] = None
    confidence: float = 0.0
    entities: Dict[str, Any] = None
    reasoning: str = ""
    needs_clarification: bool = False

    def __post_init__(self):
        if self.entities is None:
            self.entities = {}


class IntentClassifier:
    """
    意图分类器

    采用混合策略：
    1. 关键词匹配（快速路径，高置信度）
    2. LLM分类（兜底，更精准）
    """

    # 意图关键词映射
    INTENT_KEYWORDS = {
        Intent.CONTRACT_DRAFT: [
            "租房", "租房子", "租赁", "租", "买房", "卖房", "买卖", "雇佣", "招聘", "入职",
            "辞职", "劳动合同", "合作", "合伙", "入股", "借款", "借钱", "贷款", "赠送",
            "赠与", "捐赠", "合同", "模板", "起草", "生成合同", "写合同", "弄个合同",
            "合同", "协议", "草拟", "拟合同", "写个合同", "做个合同", "份合同"
        ],
        Intent.CONTRACT_REVIEW: [
            "审核", "审查", "检查合同", "看看合同", "帮我看看", "有没有问题"
        ],
        Intent.CONTRACT_QUERY: [
            "合同查询", "我的合同", "合同状态", "合同进度"
        ],
        Intent.DRAFT_RESUME: [
            "继续", "接着上次的", "恢复", "继续上次"
        ],
        Intent.CONVERSATION_CONTROL: [
            "继续", "上一个", "暂停", "重新开始", "重新来", "停止"
        ],
    }

    # 二级意图（合同类型）关键词
    SUB_INTENT_KEYWORDS = {
        SubIntent.RENTAL: ["租房", "租赁", "租房子", "房东", "租客", "租金", "押金", "公寓", "住处"],
        SubIntent.EMPLOYMENT: ["雇佣", "招聘", "入职", "辞职", "劳动", "员工", "老板", "工资", "试用期", "加班", "社保"],
        SubIntent.SALES: ["买卖", "购买", "出售", "交易", "买", "卖", "商品", "房屋买卖", "二手房"],
        SubIntent.SERVICE: ["服务", "委托", "代理", "咨询", "外包", "保洁", "维修"],
        SubIntent.PARTNERSHIP: ["合作", "合伙", "入股", "合作方", "合作伙伴", "股东"],
        SubIntent.LOAN: ["借款", "借钱", "贷款", "借", "债务", "民间借贷"],
        SubIntent.GIFT: ["赠送", "赠与", "捐赠", "礼物", "捐献", "遗产"],
    }

    # 非法律问题关键词（低置信度触发拒绝）
    NON_LEGAL_KEYWORDS = [
        "天气", "新闻", "股票", "体育", "娱乐", "今天星期几", "几点了",
        "美国总统", "明星", "游戏", "电影", "音乐"
    ]

    # 置信度阈值
    HIGH_CONFIDENCE = 0.85
    MEDIUM_CONFIDENCE = 0.6

    def __init__(self):
        self.ai_service = get_ai_service()

    async def classify(self, user_input: str, context: Optional[Dict] = None) -> IntentResult:
        """
        分类用户意图

        Args:
            user_input: 用户输入
            context: 上下文信息（可选）

        Returns:
            IntentResult: 意图分类结果
        """
        user_input_lower = user_input.lower().strip()

        # Step 1: 检查是否是闲聊/非法律问题
        if self._is_non_legal(user_input_lower):
            return IntentResult(
                intent=Intent.GENERAL_CHAT,
                confidence=0.95,
                reasoning="检测到非法律问题关键词",
                needs_clarification=False
            )

        # Step 2: 关键词匹配（快速路径）
        keyword_result = self._keyword_match(user_input_lower)
        if keyword_result and keyword_result.confidence >= self.HIGH_CONFIDENCE:
            return keyword_result

        # Step 3: LLM分类（兜底）
        llm_result = await self._llm_classify(user_input, context)
        return llm_result

    def _is_non_legal(self, text: str) -> bool:
        """检查是否是非法律问题"""
        for keyword in self.NON_LEGAL_KEYWORDS:
            if keyword in text:
                return True
        return False

    def _keyword_match(self, text: str) -> Optional[IntentResult]:
        """
        关键词匹配

        Returns:
            如果匹配成功返回IntentResult，否则返回None
        """
        # 先检查二级意图
        for sub_intent, keywords in self.SUB_INTENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    # 检查是否也匹配一级意图
                    if self._matches_intent_keywords(text, Intent.CONTRACT_DRAFT):
                        return IntentResult(
                            intent=Intent.CONTRACT_DRAFT,
                            sub_intent=sub_intent,
                            confidence=0.92,
                            reasoning=f"关键词'{keyword}'匹配{sub_intent.value}",
                            needs_clarification=False
                        )

        # 检查一级意图
        for intent, keywords in self.INTENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    return IntentResult(
                        intent=intent,
                        confidence=0.90,
                        reasoning=f"关键词'{keyword}'匹配{intent.value}",
                        needs_clarification=intent in [Intent.GENERAL_CHAT, Intent.CLARIFICATION]
                    )

        return None

    def _matches_intent_keywords(self, text: str, intent: Intent) -> bool:
        """检查文本是否匹配特定意图的关键词"""
        if intent not in self.INTENT_KEYWORDS:
            return False
        keywords = self.INTENT_KEYWORDS[intent]
        return any(keyword in text for keyword in keywords)

    async def _llm_classify(self, user_input: str, context: Optional[Dict] = None) -> IntentResult:
        """
        LLM分类（兜底）- 使用简化prompt加快速度
        """
        prompt = f"""用户输入: {user_input}
意图分类(只返回JSON): {{"intent":"CONTRACT_DRAFT"|"CONTRACT_REVIEW"|"CONTRACT_QUERY"|"GENERAL_CHAT", "sub_intent":"RENTAL"|"EMPLOYMENT"|"SALES"|"SERVICE"|"PARTNERSHIP"|"LOAN"|"GIFT"|null, "confidence":0.0-1.0, "needs_clarification":true|false}}"""

        try:
            response = await self.ai_service.generate([
                SystemMessage(content="你是一个专业的法律助手。"),
                HumanMessage(content=prompt)
            ])

            # 解析LLM返回
            result_text = response.content.strip()

            # 尝试提取JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]

            result = json.loads(result_text)

            return IntentResult(
                intent=Intent(result.get("intent", "GENERAL_CHAT")),
                sub_intent=SubIntent(result.get("sub_intent")) if result.get("sub_intent") else None,
                confidence=float(result.get("confidence", 0.5)),
                entities=result.get("entities", {}),
                reasoning=result.get("reasoning", ""),
                needs_clarification=result.get("needs_clarification", False)
            )
        except Exception as e:
            # LLM分类失败时，返回默认意图
            return IntentResult(
                intent=Intent.GENERAL_CHAT,
                confidence=0.3,
                reasoning=f"LLM分类失败: {str(e)}，降级为通用对话",
                needs_clarification=True
            )


class ReflectionEngine:
    """
    反思引擎 - 验证回答是否满足用户预期

    这是架构核心组件，确保智能体的回答真正解决了用户问题。
    """

    def __init__(self):
        self.ai_service = get_ai_service()

    async def reflect(
        self,
        user_input: str,
        agent_response: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        反思回答是否满足用户预期

        Args:
            user_input: 用户原始输入
            agent_response: 智能体回复
            context: 上下文信息

        Returns:
            {
                "satisfied": true/false,  # 是否满足
                "reasoning": "反思理由",
                "suggestions": ["改进建议"],
                "needs_clarification": true/false
            }
        """
        prompt = f"""你是一个法律助手的反思审核员。

用户原始问题：{user_input}
智能体回答：{agent_response}
当前意图：{context.get('intent', 'UNKNOWN')}
已收集的字段：{context.get('collected_fields', {})}
待填写字段：{context.get('pending_fields', [])}

请判断智能体的回答是否真正解决了用户的问题。

检查点：
1. 是否理解了用户的真实需求？
2. 是否提供了有用的信息或操作？
3. 如果用户想要起草合同，是否引导到正确的模板？
4. 是否有可能遗漏了用户的隐含需求？
5. 回答是否过于冗长或偏离主题？

请以JSON格式返回：
{{
    "satisfied": true/false,
    "reasoning": "详细分析",
    "suggestions": ["如果未满足，给出改进建议"],
    "confidence": 0.0-1.0,
    "needs_clarification": true/false
}}

只返回JSON，不要其他内容。"""

        try:
            response = await self.ai_service.generate([
                SystemMessage(content="你是一个严格的质量审核员，负责确保智能体回答质量。"),
                HumanMessage(content=prompt)
            ])

            result_text = response.content.strip()

            # 解析JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]

            result = json.loads(result_text)

            return {
                "satisfied": result.get("satisfied", False),
                "reasoning": result.get("reasoning", ""),
                "suggestions": result.get("suggestions", []),
                "confidence": float(result.get("confidence", 0.5)),
                "needs_clarification": result.get("needs_clarification", False)
            }
        except Exception as e:
            # 反思失败时，默认认为满足，避免卡死
            return {
                "satisfied": True,
                "reasoning": f"反思过程出错: {str(e)}，默认认为满足",
                "suggestions": [],
                "confidence": 0.0,
                "needs_clarification": False
            }


# 全局实例
intent_classifier = IntentClassifier()
reflection_engine = ReflectionEngine()


def get_intent_classifier() -> IntentClassifier:
    return intent_classifier


def get_reflection_engine() -> ReflectionEngine:
    return reflection_engine
