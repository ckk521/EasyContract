# C02 - 智能体对话 API 设计

## 目录

- [1. API 设计原则](#1-api-设计原则)
- [2. 接口清单](#2-接口清单)
- [3. 模板相关接口](#3-模板相关接口)
- [4. 草稿相关接口](#4-草稿相关接口)
- [5. 会话相关接口](#5-会话相关接口)
- [6. RAG 法律问答接口](#6-rag-法律问答接口)
- [7. Schema 定义](#7-schema-定义)

---

## 1. API 设计原则

### 1.1 RESTful 风格

```
GET    /resources          # 列表查询
GET    /resources/{id}     # 单个查询
POST   /resources          # 创建
PUT    /resources/{id}     # 更新
DELETE /resources/{id}     # 删除
```

### 1.2 认证方式

- Agent API 使用 `Bearer Token`（与现有认证一致）
- Token 通过 `/api/auth/login` 获取
- 请求头：`Authorization: Bearer <token>`

### 1.3 统一响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... },
  "error": null
}
```

### 1.4 分页格式

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

---

## 2. 接口清单

### 2.1 模板相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/templates/search` | GET | 搜索合同模板 |
| `/api/templates/{id}` | GET | 获取模板详情 |
| `/api/templates/{id}/fields` | GET | 获取模板字段定义 |

### 2.2 草稿相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/drafts` | POST | 创建/保存草稿 |
| `/api/drafts` | GET | 列出用户草稿 |
| `/api/drafts/{id}` | GET | 获取草稿详情 |
| `/api/drafts/{id}` | PUT | 更新草稿 |
| `/api/drafts/{id}` | DELETE | 删除草稿 |

### 2.3 会话相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/conversations` | POST | 创建会话 |
| `/api/conversations` | GET | 列出用户会话 |
| `/api/conversations/{id}` | GET | 获取会话详情 |
| `/api/conversations/{id}/messages` | GET | 获取会话消息历史 |
| `/api/conversations/{id}/messages` | POST | 发送消息 |

### 2.4 RAG 法律问答

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/rag/search` | POST | 法律知识检索问答 |

---

## 3. 模板相关接口

### 3.1 搜索模板 `GET /api/templates/search`

**描述**: 根据关键词搜索可用的合同模板

**Query Parameters**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keywords` | string | 是 | 搜索关键词，多个用逗号分隔 |
| `template_type` | string | 否 | 模板类型筛选：RENTAL/EMPLOYMENT/SALES/SERVICE/PARTNERSHIP/LOAN/GIFT/OTHER |
| `page` | int | 否 | 页码，默认1 |
| `page_size` | int | 否 | 每页数量，默认5，最大20 |

**请求示例**:
```
GET /api/templates/search?keywords=租房,租赁&template_type=RENTAL&page_size=5
```

**响应示例**:
```json
{
  "success": true,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 101,
        "name": "房屋租赁合同（标准版）",
        "description": "适用于普通住宅租赁，标准条款",
        "template_type": "RENTAL",
        "适用场景": "房东与租客之间的住宅租赁",
        "预览图": "https://...",
        "字段数量": 12
      },
      {
        "id": 102,
        "name": "房屋租赁合同（商业版）",
        "description": "适用于商铺、办公室租赁",
        "template_type": "RENTAL",
        "适用场景": "商业地产租赁",
        "预览图": "https://...",
        "字段数量": 15
      }
    ],
    "total": 2,
    "page": 1,
    "page_size": 5,
    "has_more": false
  }
}
```

### 3.2 获取模板详情 `GET /api/templates/{id}`

**描述**: 获取单个模板的详细信息

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | int | 模板ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "name": "房屋租赁合同（标准版）",
    "description": "适用于普通住宅租赁，标准条款",
    "template_type": "RENTAL",
    "content": "【合同正文】\n甲方（出租方）：_____\n乙方（承租方）：_____\n...",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-04-01T00:00:00Z"
  }
}
```

### 3.3 获取模板字段 `GET /api/templates/{id}/fields`

**描述**: 获取模板的表单字段定义，用于引导用户填写

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | int | 模板ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "template_id": 101,
    "template_name": "房屋租赁合同（标准版）",
    "fields": [
      {
        "field_name": "lessor_name",
        "display_name": "房东姓名",
        "field_type": "text",
        "required": true,
        "placeholder": "请输入房东姓名",
        "description": "合同甲方姓名",
        "validation": {
          "max_length": 50,
          "min_length": 2
        }
      },
      {
        "field_name": "lessee_name",
        "display_name": "租客姓名",
        "field_type": "text",
        "required": true,
        "placeholder": "请输入租客姓名"
      },
      {
        "field_name": "property_address",
        "display_name": "房屋地址",
        "field_type": "text",
        "required": true,
        "placeholder": "如：北京市朝阳区xxx路xxx号"
      },
      {
        "field_name": "monthly_rent",
        "display_name": "月租金（元）",
        "field_type": "number",
        "required": true,
        "placeholder": "请输入月租金",
        "validation": {
          "min": 0,
          "max": 999999999
        }
      },
      {
        "field_name": "deposit",
        "display_name": "押金（元）",
        "field_type": "number",
        "required": true,
        "placeholder": "请输入押金金额"
      },
      {
        "field_name": "lease_start_date",
        "display_name": "租赁开始日期",
        "field_type": "date",
        "required": true
      },
      {
        "field_name": "lease_end_date",
        "display_name": "租赁结束日期",
        "field_type": "date",
        "required": true
      },
      {
        "field_name": "payment_method",
        "display_name": "付款方式",
        "field_type": "select",
        "required": true,
        "options": [
          {"value": "monthly", "label": "月付"},
          {"value": "quarterly", "label": "季付"},
          {"value": "yearly", "label": "年付"}
        ]
      }
    ],
    "total_fields": 12,
    "required_fields": 8
  }
}
```

---

## 4. 草稿相关接口

### 4.1 保存草稿 `POST /api/drafts`

**描述**: 创建或更新合同草稿

**请求体**:
```json
{
  "template_id": 101,
  "draft_name": "我的租房合同",
  "form_data": {
    "lessor_name": "张三",
    "lessee_name": "李四",
    "property_address": "北京市朝阳区xxx路",
    "monthly_rent": 8000,
    "deposit": 16000,
    "lease_start_date": "2026-05-01",
    "lease_end_date": "2027-04-30"
  },
  "conversation_id": "conv_123456"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `template_id` | int | 是 | 关联的模板ID |
| `draft_name` | string | 否 | 草稿名称，默认"草稿_时间戳" |
| `form_data` | object | 是 | 表单填写数据 |
| `conversation_id` | string | 是 | 关联的会话ID |

**响应示例**:
```json
{
  "success": true,
  "message": "草稿保存成功",
  "data": {
    "draft_id": "draft_789",
    "template_id": 101,
    "draft_name": "我的租房合同",
    "status": "draft",
    "filled_fields": 8,
    "total_fields": 12,
    "created_at": "2026-04-13T10:30:00Z",
    "updated_at": "2026-04-13T10:30:00Z"
  }
}
```

### 4.2 列出草稿 `GET /api/drafts`

**描述**: 获取当前用户的所有草稿

**Query Parameters**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认1 |
| `page_size` | int | 否 | 每页数量，默认10 |
| `status` | string | 否 | 状态筛选：draft/completed |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "draft_id": "draft_789",
        "template_id": 101,
        "template_name": "房屋租赁合同（标准版）",
        "draft_name": "我的租房合同",
        "status": "draft",
        "filled_fields": 8,
        "total_fields": 12,
        "completion_rate": 0.67,
        "created_at": "2026-04-13T10:30:00Z",
        "updated_at": "2026-04-13T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10,
    "has_more": false
  }
}
```

### 4.3 获取草稿详情 `GET /api/drafts/{id}`

**描述**: 获取单个草稿的完整信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "draft_id": "draft_789",
    "template_id": 101,
    "template_name": "房屋租赁合同（标准版）",
    "template_type": "RENTAL",
    "draft_name": "我的租房合同",
    "status": "draft",
    "form_data": {
      "lessor_name": "张三",
      "lessee_name": "李四",
      "property_address": "北京市朝阳区xxx路",
      "monthly_rent": 8000,
      "deposit": 16000
    },
    "conversation_id": "conv_123456",
    "filled_fields": 5,
    "total_fields": 12,
    "completion_rate": 0.42,
    "created_at": "2026-04-13T10:30:00Z",
    "updated_at": "2026-04-13T10:35:00Z"
  }
}
```

### 4.4 更新草稿 `PUT /api/drafts/{id}`

**描述**: 更新草稿内容

**请求体**:
```json
{
  "draft_name": "张三的租房合同",
  "form_data": {
    "lessor_name": "张三",
    "lessee_name": "李四",
    "property_address": "北京市朝阳区xxx路",
    "monthly_rent": 8000,
    "deposit": 16000,
    "lease_start_date": "2026-05-01"
  }
}
```

### 4.5 删除草稿 `DELETE /api/drafts/{id}`

**描述**: 删除草稿

**响应示例**:
```json
{
  "success": true,
  "message": "草稿已删除"
}
```

---

## 5. 会话相关接口

### 5.1 创建会话 `POST /api/conversations`

**描述**: 创建新的对话会话

**请求体**:
```json
{
  "user_id": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_123456",
    "user_id": 1,
    "status": "active",
    "current_intent": null,
    "created_at": "2026-04-13T10:00:00Z"
  }
}
```

### 5.2 列出会话 `GET /api/conversations`

**描述**: 获取用户的会话列表

**Query Parameters**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量 |
| `status` | string | 否 | 状态筛选：active/completed |

### 5.3 获取会话消息 `GET /api/conversations/{id}/messages`

**描述**: 获取会话的历史消息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_123456",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "我要租房，有什么模板？",
        "intent": "CONTRACT_DRAFT",
        "sub_intent": "RENTAL",
        "confidence": 0.94,
        "entities": {
          "location": "朝阳区",
          "area": "100平米"
        },
        "created_at": "2026-04-13T10:01:00Z"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "为您找到3个租房相关模板...",
        "intent": "CONTRACT_DRAFT",
        "tool_calls": [
          {
            "tool": "template_search",
            "args": {"keywords": ["租房", "租赁"]}
          }
        ],
        "created_at": "2026-04-13T10:01:01Z"
      }
    ],
    "total": 2
  }
}
```

### 5.4 发送消息 `POST /api/conversations/{id}/messages`

**描述**: 发送用户消息并获取助手回复（SSE流式）

**请求体**:
```json
{
  "content": "我要选择第一个模板",
  "entities": {}
}
```

**SSE 响应格式**:
```
data: {"type": "start", "message_id": 3}

data: {"type": "intent", "intent": "TEMPLATE_SELECTED", "confidence": 0.98}

data: {"type": "tool_call", "tool": "get_form_fields", "args": {"template_id": 101}}

data: {"type": "tool_result", "tool": "get_form_fields", "result": {...}}

data: {"type": "content", "content": "好的，您选择了..."}

data: {"type": "done"}

data: {"type": "usage", "tokens": 1500}
```

---

## 6. RAG 法律问答接口

### 6.1 法律知识检索 `POST /api/rag/search`

**描述**: 基于法律知识库的问答检索

**请求体**:
```json
{
  "query": "违约后怎么处理？",
  "top_k": 5,
  "category": null
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `query` | string | 是 | 用户问题 |
| `top_k` | int | 否 | 返回相关条文数量，默认5 |
| `category` | string | 否 | 法律类别筛选 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "answer": "根据《民法典》第五百七十七条规定，当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担违约责任。\n\n具体处理方式包括：\n1. 继续履行\n2. 采取补救措施\n3. 赔偿损失\n\n建议您根据合同具体情况选择合适的处理方式。",
    "sources": [
      {
        "law": "《中华人民共和国民法典》",
        "article": "第五百七十七条",
        "content": "当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担违约责任。"
      },
      {
        "law": "《中华人民共和国民法典》",
        "article": "第五百八十四条",
        "content": "当事人一方不履行合同义务或者履行合同义务不符合约定，造成对方损失的，损失赔偿额应当相当于因违约所造成的损失..."
      }
    ],
    "related_questions": [
      "违约金一般是多少？",
      "解除合同的条件是什么？",
      "不可抗力条款如何认定？"
    ]
  }
}
```

---

## 7. Schema 定义

### 7.1 通用响应

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    message: str = "操作成功"
    data: Optional[T] = None
    error: Optional[str] = None
```

### 7.2 模板相关

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TemplateSearchRequest(BaseModel):
    keywords: List[str] = Field(..., description="搜索关键词")
    template_type: Optional[str] = Field(None, description="模板类型")
    page: int = Field(1, ge=1)
    page_size: int = Field(5, ge=1, le=20)

class TemplateResponse(BaseModel):
    id: int
    name: str
    description: str
    template_type: str
   适用场景: Optional[str] = None
    预览图: Optional[str] = None
    字段数量: int
    created_at: datetime

class FieldDefinition(BaseModel):
    field_name: str
    display_name: str
    field_type: str  # text/number/date/select
    required: bool
    placeholder: Optional[str] = None
    description: Optional[str] = None
    options: Optional[List[dict]] = None  # select类型的选项
    validation: Optional[dict] = None

class TemplateFieldsResponse(BaseModel):
    template_id: int
    template_name: str
    fields: List[FieldDefinition]
    total_fields: int
    required_fields: int
```

### 7.3 草稿相关

```python
class SaveDraftRequest(BaseModel):
    template_id: int
    draft_name: Optional[str] = None
    form_data: dict
    conversation_id: str

class DraftResponse(BaseModel):
    draft_id: str
    template_id: int
    template_name: Optional[str] = None
    draft_name: str
    status: str  # draft/completed
    filled_fields: int
    total_fields: int
    completion_rate: float
    created_at: datetime
    updated_at: datetime
```

### 7.4 会话相关

```python
class CreateConversationRequest(BaseModel):
    user_id: int

class ConversationResponse(BaseModel):
    conversation_id: str
    user_id: int
    status: str  # active/completed
    current_intent: Optional[str] = None
    created_at: datetime

class MessageResponse(BaseModel):
    id: int
    role: str  # user/assistant
    content: str
    intent: Optional[str] = None
    sub_intent: Optional[str] = None
    confidence: Optional[float] = None
    entities: Optional[dict] = None
    tool_calls: Optional[List[dict]] = None
    created_at: datetime
```

### 7.5 RAG 相关

```python
class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = Field(5, ge=1, le=10)
    category: Optional[str] = None

class LawSource(BaseModel):
    law: str
    article: str
    content: str

class RAGSearchResponse(BaseModel):
    answer: str
    sources: List[LawSource]
    related_questions: List[str]
```

---

## 8. 错误码定义

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或Token过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

**错误响应示例**:
```json
{
  "success": false,
  "message": "模板不存在",
  "error": "TEMPLATE_NOT_FOUND",
  "data": null
}
```
