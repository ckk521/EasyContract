"""智能体核心模块"""
from typing import Optional, List, Dict, Any, AsyncGenerator
import json
import logging
import re

from pydantic import BaseModel, Field
from openai import AsyncOpenAI

from server.services.intent_classifier import IntentClassifier
from server.core.database import get_db
from server.models import ContractTemplate, FieldDefinition

logger = logging.getLogger(__name__)


class AgentContext(BaseModel):
    user_id: int
    conversation_id: int
    intent: Optional[str] = None
    collected_fields: Dict[str, Any] = Field(default_factory=dict)
    pending_fields: List[str] = Field(default_factory=list)
    selected_template_id: Optional[int] = None


class LegalAgent:

    def __init__(self, api_key: str, base_url: str, model: str):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.intent_classifier = IntentClassifier()
        self.system_prompt = """你是法律助手EasyLegal。

【工作流程】
1. 用户询问模板时，调用template_search工具查询
2. 工具返回结果后，根据结果回复用户：
   - 如果templates数组不为空，告诉用户找到了哪些模板，列出模板名称
   - 如果templates数组为空，才说没有找到
3. 禁止在工具返回前就说"没有找到"

【重要】工具返回格式示例：
{"success": true, "templates": [{"id": 2, "name": "保密协议（通用）"}], "total": 1}
这表示找到了1个模板，必须告诉用户找到了"保密协议（通用）"模板。"""
        self.tools = [
            {"type": "function", "function": {"name": "template_search", "description": "搜索合同模板。用户询问有什么模板时调用此工具。", "parameters": {"type": "object", "properties": {"keywords": {"type": "array", "items": {"type": "string"}, "description": "搜索关键词"}}, "required": ["keywords"]}}},
            {"type": "function", "function": {"name": "get_form_fields", "description": "获取模板的表单字段定义", "parameters": {"type": "object", "properties": {"template_id": {"type": "integer"}}, "required": ["template_id"]}}},
            {"type": "function", "function": {"name": "save_draft", "description": "保存合同草稿", "parameters": {"type": "object", "properties": {"template_id": {"type": "integer"}, "form_data": {"type": "object"}, "conversation_id": {"type": "string"}}, "required": ["template_id", "form_data", "conversation_id"]}}}
        ]

    async def stream_process(self, user_input: str, context: AgentContext, conversation_history: Optional[List[Dict]] = None) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": self.system_prompt}]
        if conversation_history:
            for msg in conversation_history[-10:]:
                if msg.get("role") == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                elif msg.get("role") == "assistant":
                    messages.append({"role": "assistant", "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_input})
        async for chunk in self._react_loop(messages, context):
            yield chunk

    async def _react_loop(self, messages: List[Dict], context: AgentContext) -> AsyncGenerator[str, None]:
        max_iterations = 5
        iteration = 0
        while iteration < max_iterations:
            iteration += 1
            response = await self.client.chat.completions.create(model=self.model, messages=messages, tools=self.tools, tool_choice="auto")
            ai_message = response.choices[0].message
            if ai_message.tool_calls:
                for tc in ai_message.tool_calls:
                    fn_name = tc.function.name
                    fn_args = json.loads(tc.function.arguments)
                    fn_args["user_id"] = context.user_id
                    result = await self._execute_tool(fn_name, fn_args)
                    messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": tc.id, "type": "function", "function": {"name": fn_name, "arguments": tc.function.arguments}}]})
                    messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result, ensure_ascii=False)})
                    data = json.dumps({"tool": fn_name, "result": result}, ensure_ascii=False)
                    yield "event: tool\ndata: " + data + "\n\n"
                continue
            if ai_message.content:
                response_content = re.sub(r"<think>.*?</think>", "", ai_message.content, flags=re.DOTALL)
                response_content = response_content.strip()
                data = json.dumps({"content": response_content}, ensure_ascii=False)
                yield "event: content\ndata: " + data + "\n\n"
                break

    async def _execute_tool(self, tool_name: str, args: Dict) -> Any:
        if tool_name == "template_search":
            return await self._template_search(args.get("keywords", []))
        elif tool_name == "get_form_fields":
            return await self._get_form_fields(args.get("template_id"))
        elif tool_name == "save_draft":
            return await self._save_draft(args.get("template_id"), args.get("form_data"), args.get("conversation_id"), args.get("user_id"))
        return {"error": f"Unknown tool: {tool_name}"}

    async def _template_search(self, keywords: List[str]) -> Dict:
        """搜索模板 - 支持关键词匹配、语义匹配、反思机制"""
        db = next(get_db())
        try:
            # 1. 先尝试关键词匹配
            query = db.query(ContractTemplate).filter(ContractTemplate.status == "published")
            if keywords:
                for kw in keywords:
                    query = query.filter(ContractTemplate.name.contains(kw) | ContractTemplate.description.contains(kw))
            templates = query.limit(5).all()
            
            # 2. 如果关键词匹配失败，尝试语义匹配
            if not templates and keywords:
                templates = await self._semantic_search(db, keywords)
            
            # 3. 如果还是失败，返回所有可用模板（让用户选择）
            if not templates:
                templates = db.query(ContractTemplate).filter(ContractTemplate.status == "published").limit(5).all()
            
            result = [{"id": t.id, "name": t.name, "description": t.description or "", "template_type": t.template_type} for t in templates]
            return {
                "success": True, 
                "templates": result, 
                "total": len(result),
                "search_type": "keyword" if templates else "all",
                "message": f"找到 {len(result)} 个模板" if result else "暂无匹配模板，显示所有可用模板"
            }
        finally:
            db.close()

    async def _semantic_search(self, db, keywords: List[str]) -> List:
        """语义匹配 - 理解用户意图"""
        # 关键词到模板类型的语义映射
        semantic_map = {
            "合同": ["RENTAL", "EMPLOYMENT", "SALES", "SERVICE", "PARTNERSHIP", "LOAN", "GIFT", "OTHER"],
            "租房": ["RENTAL"], "租赁": ["RENTAL"], "房租": ["RENTAL"],
            "劳动": ["EMPLOYMENT"], "工作": ["EMPLOYMENT"], "入职": ["EMPLOYMENT"],
            "买卖": ["SALES"], "销售": ["SALES"], "购销": ["SALES"],
            "服务": ["SERVICE"], "外包": ["SERVICE"],
            "合伙": ["PARTNERSHIP"], "合作": ["PARTNERSHIP"],
            "借款": ["LOAN"], "贷款": ["LOAN"], "借贷": ["LOAN"],
            "保密": ["OTHER"], "NDA": ["OTHER"], "协议": ["OTHER"],
            "赠与": ["GIFT"], "赠送": ["GIFT"],
        }
        
        # 查找匹配的类型
        matched_types = []
        for kw in keywords:
            for key, types in semantic_map.items():
                if key in kw or kw in key:
                    matched_types.extend(types)
        
        matched_types = list(set(matched_types))  # 去重
        
        if matched_types:
            return db.query(ContractTemplate).filter(
                ContractTemplate.status == "published",
                ContractTemplate.template_type.in_(matched_types)
            ).limit(5).all()
        
        return []

    async def _get_form_fields(self, template_id: int) -> Dict:
        db = next(get_db())
        try:
            fields = db.query(FieldDefinition).filter(FieldDefinition.template_id == template_id).all()
            result = [{"id": f.id, "name": f.field_name, "label": f.display_name, "type": f.field_type, "required": f.required} for f in fields]
            return {"success": True, "fields": result}
        finally:
            db.close()

    async def _save_draft(self, template_id: int, form_data: Dict, conversation_id: str, user_id: int) -> Dict:
        from server.models import ContractDraft
        db = next(get_db())
        try:
            draft = ContractDraft(template_id=template_id, user_id=user_id, form_data=form_data, status="draft")
            db.add(draft)
            db.commit()
            return {"success": True, "draft_id": draft.id}
        except Exception as e:
            return {"error": str(e)}
        finally:
            db.close()


_agent_instance: Optional[LegalAgent] = None


def get_legal_agent() -> LegalAgent:
    global _agent_instance
    if _agent_instance is None:
        from server.core.config import get_persistent_settings
        ps = get_persistent_settings()
        _agent_instance = LegalAgent(api_key=ps.AI_API_KEY, base_url=ps.AI_BASE_URL, model=ps.AI_MODEL_NAME)
    return _agent_instance
