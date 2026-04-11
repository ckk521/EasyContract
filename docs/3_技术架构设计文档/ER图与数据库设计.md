# 技术架构设计文档 - ER图与数据库设计

> 版本：V1.0
> 日期：2026-03-23
> 最后更新：2026-04-08

---

## 1. 系统概述

### 1.1 设计目标

- **配置驱动**：C端智能体的所有行为依赖B端配置，运营人员无需修改代码即可调整Agent策略
- **MVP优先**：快速交付核心功能，支持迭代扩展
- **轻量部署**：单机Docker部署，SQLite存储，降低运维成本

### 1.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + Ant Design 5 | 企业级UI组件库 |
| 后端 | Python 3.11 + FastAPI | 异步高性能，AI生态友好 |
| 数据库 | SQLite | 轻量级本地存储，MVP阶段够用 |
| 向量库 | Chroma | 本地向量数据库，无需额外服务 |
| AI框架 | LangChain | 成熟的LLM应用框架 |
| Embedding | m3e-base | 国产中文模型，本地部署 |
| 部署 | Docker + Docker Compose | 容器化部署，易于管理 |

---

## 2. 数据库ER图

### 2.1 完整ER图

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   users     │       │  chat_sessions   │       │  chat_messages  │
│  (C端用户)   │       │                  │       │                 │
├─────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)     │◄──────│ user_id (FK)     │       │ session_id (FK) │
│ username    │       │ id (PK)          │◄──────│ id (PK)         │
│ password    │       │ contract_id (FK) │       │ role            │
│ nickname    │       │ title            │       │ content         │
│ status      │       │ status           │       │ intent          │
└─────────────┘       │ intent_type      │       │ metadata (JSON) │
                              │ created_at   │       └─────────────────┘
                              │ updated_at   │
                              └──────────────┘
                                     │
                                     ▼
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    contracts    │       │  contract_data   │       │    templates    │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │◄──│ contract_id (FK) │       │ id (PK)         │
│ user_id (FK)    │       │ field_name       │       │ name            │
│ session_id (FK) │       │ field_value      │       │ file_path       │
│ contract_no     │       │ field_type       │       │ contract_type   │
│ contract_type   │       └──────────────────┘       │ content         │
│ status          │                                   │ status          │
│ content          │                                   └─────────────────┘
│ file_path       │                                        │
└─────────────────┘                                        │
        │                                                  │
        │ 审核相关                                         ▼
        ▼                                          ┌─────────────────┐
┌─────────────────┐       ┌─────────────────┐       │ field_library   │
│contract_review  │       │     staff       │       ├─────────────────┤
│    _reports     │       │   (B端员工)      │       │ id (PK)         │
├─────────────────┤       ├─────────────────┤       │ code            │
│ id (PK)         │       │ id (PK)         │       │ name            │
│ contract_id(FK) │       │ username        │       │ field_type      │
│ risk_summary    │       │ password        │       │ category_id(FK) │
│ risk_items (JSON│       │ role            │       │ validation_rule │
│ ai_model        │       │ status          │       │ default_value   │
└─────────────────┘       │ supervisor_id(FK│       └─────────────────┘
                            └─────────────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │    messages      │
                            │   (站内信)       │
                            ├─────────────────┤
                            │ id (PK)         │
                            │ recipient_id    │
                            │ message_type    │
                            │ title           │
                            │ content         │
                            │ related_id      │
                            │ is_read         │
                            └─────────────────┘
```

### 2.2 核心表关系说明

| 关系 | 说明 |
|------|------|
| users 1:N chat_sessions | 一个C端用户可有多个对话会话 |
| chat_sessions 1:N chat_messages | 一个会话可有多个消息 |
| users 1:N contracts | 一个用户可有多个合同 |
| contracts 1:N contract_data | 一个合同可有多个字段数据 |
| contracts 1:N contract_review_reports | 一个合同可有多次审核报告 |
| staff 1:N staff (自引用) | 主管与律师的上下级关系 |
| contract_categories 1:N field_library | 一种合同类型可有多个专属字段 |
| templates 1:N field_library | 一种模板可关联多个字段 |

---

## 3. 详细表结构

### 3.1 users - C端用户表

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login_at DATETIME,
    last_login_ip VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 staff - B端员工表

```sql
CREATE TABLE staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'lawyer',  -- admin/supervisor/lawyer
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    first_login BOOLEAN DEFAULT 1,
    supervisor_id INTEGER,
    work_status VARCHAR(20) DEFAULT 'available',  -- available/pto
    license_number VARCHAR(50),
    years_of_practice INTEGER,
    employee_id VARCHAR(50),
    title VARCHAR(50),
    law_firm VARCHAR(100),
    education VARCHAR(20),
    law_school VARCHAR(100),
    certifications JSON,
    languages JSON,
    specialties JSON,
    last_login_at DATETIME,
    last_login_ip VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_id) REFERENCES staff(id)
);
```

### 3.3 chat_sessions - 对话会话表

```sql
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contract_id INTEGER,
    title VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    intent_type VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL
);
```

### 3.4 chat_messages - 对话消息表

```sql
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    intent VARCHAR(50),
    metadata JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

### 3.5 contracts - 合同表

```sql
CREATE TABLE contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    contract_no VARCHAR(50) UNIQUE,
    contract_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    title VARCHAR(200),
    content TEXT,
    file_path VARCHAR(255),
    ai_polish BOOLEAN DEFAULT 0,
    assigned_lawyer_id INTEGER,
    assigned_by INTEGER,
    assigned_at DATETIME,
    assign_type VARCHAR(20),
    supervisor_reviewed_by INTEGER,
    supervisor_reviewed_at DATETIME,
    supervisor_rejected_at DATETIME,
    supervisor_reject_reason VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3.6 contract_data - 合同字段数据表

```sql
CREATE TABLE contract_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(20),
    is_required BOOLEAN DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);
```

### 3.7 contract_categories - 合同类型表

```sql
CREATE TABLE contract_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.8 field_library - 字段库表

```sql
CREATE TABLE field_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    field_type VARCHAR(20) DEFAULT 'text',
    category_id INTEGER,
    validation_rule VARCHAR(200),
    default_value VARCHAR(200),
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES contract_categories(id)
);
```

### 3.9 templates - 合同模板表

```sql
CREATE TABLE templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    content TEXT,
    category_id INTEGER,
    content_html TEXT,
    content_text TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.10 template_field_mappings - 模板字段映射表

```sql
CREATE TABLE template_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    source_text VARCHAR(200),
    position_index INTEGER,
    field_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id),
    FOREIGN KEY (field_id) REFERENCES field_library(id)
);
```

### 3.11 contract_review_reports - AI审核报告表

```sql
CREATE TABLE contract_review_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    risk_summary JSON,
    risk_items JSON,
    ai_model VARCHAR(50),
    rule_doc_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
);
```

### 3.12 contract_review_items - 审核确认记录表

```sql
CREATE TABLE contract_review_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    risk_item_id INTEGER NOT NULL,
    confirmed_by INTEGER,
    confirmed_at DATETIME,
    reviewer_comment VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (report_id) REFERENCES contract_review_reports(id)
);
```

### 3.13 contract_review_logs - 审核日志表

```sql
CREATE TABLE contract_review_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    operator_id INTEGER NOT NULL,
    operator_role VARCHAR(20),
    detail JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
);
```

### 3.14 messages - 站内信消息表

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'staff',
    message_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    related_id INTEGER,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.15 配置表

```sql
-- config_llm - 大模型配置表
CREATE TABLE config_llm (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key VARCHAR(255),
    base_url VARCHAR(255),
    model_name VARCHAR(100),
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- config_embedding - Embedding配置表
CREATE TABLE config_embedding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name VARCHAR(100) NOT NULL DEFAULT 'm3e-base',
    chunk_size INTEGER DEFAULT 512,
    overlap INTEGER DEFAULT 50,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- config_intent - 核心意图配置表
CREATE TABLE config_intent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    triggers TEXT,
    description TEXT,
    action VARCHAR(50),
    examples TEXT,
    content TEXT,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- config_legal_scope - 法律范围配置表
CREATE TABLE config_legal_scope (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- config_reject_script - 拒绝话术配置表
CREATE TABLE config_reject_script (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- config_sensitive - 敏感信息配置表
CREATE TABLE config_sensitive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    pattern VARCHAR(255),
    mask_rule VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.16 documents - 上传文档表

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    doc_type VARCHAR(50) NOT NULL,  -- case/audit_rule/intent_doc
    content TEXT,
    indexed BOOLEAN DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.17 audit_logs - 审计日志表

```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_role VARCHAR(20),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    detail JSON,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. 数据库索引汇总

```sql
-- users
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);

-- staff
CREATE UNIQUE INDEX idx_staff_username ON staff(username);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_supervisor ON staff(supervisor_id);

-- chat_sessions
CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_sessions_contract ON chat_sessions(contract_id);
CREATE INDEX idx_sessions_status ON chat_sessions(status);
CREATE INDEX idx_sessions_created ON chat_sessions(created_at);

-- chat_messages
CREATE INDEX idx_messages_session ON chat_messages(session_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at);

-- contracts
CREATE UNIQUE INDEX idx_contracts_no ON contracts(contract_no);
CREATE INDEX idx_contracts_user ON contracts(user_id);
CREATE INDEX idx_contracts_session ON contracts(session_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_type ON contracts(contract_type);

-- contract_data
CREATE INDEX idx_contract_data_contract ON contract_data(contract_id);
CREATE UNIQUE INDEX idx_contract_data_field ON contract_data(contract_id, field_name);

-- templates
CREATE INDEX idx_templates_type ON templates(contract_type);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_category ON templates(category_id);

-- field_library
CREATE INDEX idx_field_library_category ON field_library(category_id);

-- config_intent
CREATE INDEX idx_intent_status ON config_intent(status);

-- documents
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_documents_indexed ON documents(indexed);

-- messages
CREATE INDEX idx_recipient ON messages(recipient_id, recipient_type);
CREATE INDEX idx_is_read ON messages(is_read);
CREATE INDEX idx_created_at ON messages(created_at);
CREATE INDEX idx_message_type ON messages(message_type);

-- audit_logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```
