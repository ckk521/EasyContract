# 合同智能审核平台 - 技术架构设计

> 版本: v1.0
> 更新日期: 2026-03-21

---

## 一、技术选型

### 1.1 技术栈总览

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | React 18 + TypeScript | Figma生成代码支持 |
| UI组件库 | Ant Design | 企业级后台组件库 |
| 后端框架 | FastAPI | 异步、高性能、自动文档 |
| 数据库 | MySQL 8.0 | 主数据存储 |
| 向量数据库 | Chroma | RAG向量存储，轻量本地 |
| ORM | SQLAlchemy | 数据库操作 |
| AI框架 | LangChain | Agent编排、RAG |
| 大模型 | GLM-4-Flash | 智谱AI，可配置 |
| 认证 | JWT Token | 无状态认证 |
| API风格 | RESTful | 标准化接口设计 |

### 1.2 开发环境

| 项目 | 版本 |
|------|------|
| Python | 3.10+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| Redis | 7.0+（可选，用于缓存） |

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              前端层                                      │
├─────────────────────────────────┬───────────────────────────────────────┤
│         B端管理后台              │            C端智能体                   │
│      (React + Ant Design)       │        (React + Ant Design)           │
└─────────────────────────────────┴───────────────────────────────────────┘
                                    │
                                    ▼ HTTP/REST API
┌─────────────────────────────────────────────────────────────────────────┐
│                              网关层                                      │
│                    Nginx (反向代理 + 静态资源)                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              后端服务层                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     FastAPI Application                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ 用户服务  │ │ 合同服务  │ │ 审核服务  │ │ 通知服务  │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ 配额服务  │ │ 规则服务  │ │ 模板服务  │ │ 文件服务  │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              AI能力层                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     LangChain Agent                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ 意图识别  │ │ 合同生成  │ │ 风险审核  │ │ 法律咨询  │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────┼───────────────────────────────┐   │
│  │                     RAG 检索增强                                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │   │
│  │  │ Chroma   │ │ Embedding│ │ 规则知识库│                        │   │
│  │  │ 向量存储  │ │  模型    │ │  管理    │                        │   │
│  │  └──────────┘ └──────────┘ └──────────┘                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              数据存储层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │    MySQL     │  │   Chroma    │  │   本地文件    │                  │
│  │  业务数据     │  │  向量数据    │  │ 合同/报告     │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 部署架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NAS Docker 环境                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Docker Compose                                │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │  frontend    │  │   backend    │  │    mysql     │           │   │
│  │  │  (Nginx)     │  │  (FastAPI)   │  │   (MySQL 8)  │           │   │
│  │  │   Port: 80   │  │  Port: 8000  │  │  Port: 3306  │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  │                                                                   │   │
│  │  ┌──────────────┐                                               │   │
│  │  │    data      │  ← 数据持久化（挂载到NAS目录）                  │   │
│  │  │  contracts/  │                                               │   │
│  │  │  templates/  │                                               │   │
│  │  │  knowledge/  │                                               │   │
│  │  └──────────────┘                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 三、后端架构

### 3.1 项目目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI 入口
│   ├── config.py                  # 配置管理
│   ├── database.py                # 数据库连接
│   ├── dependencies.py            # 依赖注入
│   │
│   ├── models/                    # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── contract.py
│   │   ├── review.py
│   │   ├── risk_rule.py
│   │   ├── template.py
│   │   └── quota.py
│   │
│   ├── schemas/                   # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── contract.py
│   │   ├── review.py
│   │   └── common.py
│   │
│   ├── api/                       # API 路由
│   │   ├── __init__.py
│   │   ├── auth.py               # 认证相关
│   │   ├── users.py              # 用户管理
│   │   ├── contracts.py          # 合同管理
│   │   ├── reviews.py            # 审核管理
│   │   ├── rules.py              # 风险规则
│   │   ├── templates.py          # 合同模板
│   │   ├── staff.py              # 法务人员
│   │   ├── quotas.py             # 配额管理
│   │   └── agent.py              # Agent 对话接口
│   │
│   ├── services/                  # 业务逻辑
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── contract_service.py
│   │   ├── review_service.py
│   │   ├── rule_service.py
│   │   ├── template_service.py
│   │   ├── quota_service.py
│   │   └── notification_service.py
│   │
│   ├── ai/                        # AI 能力
│   │   ├── __init__.py
│   │   ├── agent.py              # LangChain Agent
│   │   ├── llm.py                # LLM 调用
│   │   ├── rag.py                # RAG 检索
│   │   ├── contract_parser.py    # 合同解析
│   │   ├── risk_analyzer.py      # 风险分析
│   │   └── prompts/              # 提示词模板
│   │       ├── __init__.py
│   │       ├── review_prompt.py
│   │       ├── suggestion_prompt.py
│   │       └── chat_prompt.py
│   │
│   ├── utils/                     # 工具函数
│   │   ├── __init__.py
│   │   ├── security.py           # 密码加密、JWT
│   │   ├── file_handler.py       # 文件处理
│   │   ├── ocr.py                # OCR 处理
│   │   └── logger.py             # 日志配置
│   │
│   └── middleware/                # 中间件
│       ├── __init__.py
│       └── auth_middleware.py
│
├── tests/                         # 测试
│   ├── __init__.py
│   ├── test_api/
│   └── test_services/
│
├── alembic/                       # 数据库迁移
│   ├── versions/
│   └── env.py
│
├── requirements.txt
├── alembic.ini
├── .env.example
└── Dockerfile
```

### 3.2 核心API设计

#### 认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

#### 合同模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/contracts/upload` | 上传合同 |
| GET | `/api/contracts` | 合同列表 |
| GET | `/api/contracts/{id}` | 合同详情 |
| GET | `/api/contracts/{id}/status` | 合同状态 |
| PUT | `/api/contracts/{id}` | 更新合同 |
| DELETE | `/api/contracts/{id}` | 删除合同 |

#### 审核模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/reviews/{contract_id}/submit` | 提交审核 |
| GET | `/api/reviews/tasks` | 审核任务列表 |
| POST | `/api/reviews/{id}/complete` | 完成审核（专员） |
| POST | `/api/reviews/{id}/approve` | 审批通过（Manager） |
| POST | `/api/reviews/{id}/reject` | 审批驳回（Manager） |
| GET | `/api/reviews/{id}/report` | 获取审核报告 |

#### Agent模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/agent/chat` | 发送消息（流式响应） |
| POST | `/api/agent/upload` | 上传文件（对话中） |
| GET | `/api/agent/history/{session_id}` | 对话历史 |

#### 风险规则模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/rules` | 规则列表 |
| POST | `/api/rules` | 新增规则 |
| PUT | `/api/rules/{id}` | 更新规则 |
| DELETE | `/api/rules/{id}` | 删除规则 |
| POST | `/api/rules/upload` | 上传知识库文档 |

#### 其他模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/templates` | 模板列表 |
| POST | `/api/templates` | 新增模板 |
| GET | `/api/staff` | 法务人员列表 |
| PUT | `/api/staff/{id}/tags` | 更新画像标签 |
| GET | `/api/quotas` | 配额查询 |
| POST | `/api/quotas/allocate` | 分配配额 |

---

## 四、数据库设计

### 4.1 ER图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │     │  contracts  │     │   reviews   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │────<│ user_id     │────<│ contract_id │
│ username    │     │ id          │     │ id          │
│ password    │     │ title       │     │ status      │
│ role        │     │ type        │     │ ai_result   │
│ enterprise_id│    │ status      │     │ staff_id    │
│ quota       │     │ file_path   │     │ manager_id  │
│ created_at  │     │ created_at  │     │ created_at  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ enterprises │     │ risk_items  │     │  reports    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ review_id   │     │ review_id   │
│ name        │     │ rule_id     │     │ content     │
│ created_at  │     │ level       │     │ file_path   │
└─────────────┘     │ clause      │     │ signed_at   │
                    │ suggestion  │     └─────────────┘
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ risk_rules  │
                    ├─────────────┤
                    │ id          │
                    │ name        │
                    │ category    │
                    │ level       │
                    │ description │
                    │ legal_basis │
                    │ suggestion  │
                    │ enterprise_id│
                    └─────────────┘
```

### 4.2 完整建表SQL

```sql
-- ============================================
-- 合同智能审核平台 数据库建表脚本
-- 数据库: MySQL 8.0
-- 字符集: utf8mb4
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS easyverify
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE easyverify;

-- ============================================
-- 1. 企业表
-- ============================================
CREATE TABLE enterprises (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '企业名称',
    contact_name VARCHAR(50) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业表';

-- ============================================
-- 2. 用户表
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    role ENUM('admin', 'manager', 'staff', 'user') NOT NULL DEFAULT 'user' COMMENT '角色',
    enterprise_id INT COMMENT '所属企业ID',
    quota INT DEFAULT 500 COMMENT '剩余配额',
    status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
    last_login_at DATETIME COMMENT '最后登录时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_username (username),
    INDEX idx_role (role),
    INDEX idx_enterprise (enterprise_id),
    INDEX idx_status (status),
    CONSTRAINT fk_user_enterprise FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 3. 法务人员画像表
-- ============================================
CREATE TABLE staff_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id INT NOT NULL COMMENT '用户ID',
    contract_types JSON COMMENT '擅长合同类型 ["采购","销售","劳动"]',
    industries JSON COMMENT '擅长行业 ["制造业","互联网","金融"]',
    risk_preference VARCHAR(50) COMMENT '风险偏好: strict/balanced/friendly',
    experience_years INT DEFAULT 0 COMMENT '工作年限',
    current_tasks INT DEFAULT 0 COMMENT '当前任务数',
    total_completed INT DEFAULT 0 COMMENT '累计完成数',
    rating DECIMAL(3,2) DEFAULT 5.00 COMMENT '评分(1-5)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user (user_id),
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='法务人员画像表';

-- ============================================
-- 4. 合同模板表
-- ============================================
CREATE TABLE templates (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    type VARCHAR(50) NOT NULL COMMENT '合同类型',
    description VARCHAR(500) COMMENT '模板描述',
    fields JSON NOT NULL COMMENT '必填字段定义',
    content TEXT COMMENT '模板内容',
    status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同模板表';

-- ============================================
-- 5. 合同表
-- ============================================
CREATE TABLE contracts (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    contract_no VARCHAR(50) COMMENT '合同编号',
    user_id INT NOT NULL COMMENT '提交用户ID',
    title VARCHAR(200) NOT NULL COMMENT '合同标题',
    type VARCHAR(50) COMMENT '合同类型',
    status ENUM(
        'pending',           -- 待初审
        'ai_reviewing',      -- AI审核中
        'pending_assign',    -- 待分配
        'reviewing',         -- 审核中
        'pending_approve',   -- 待审批
        'approved',          -- 已通过
        'user_confirming',   -- 用户确认中
        'completed',         -- 已完成
        'rejected'           -- 已驳回
    ) DEFAULT 'pending' COMMENT '合同状态',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_type VARCHAR(20) COMMENT '文件类型: pdf/docx/image',
    file_size INT COMMENT '文件大小(字节)',
    version INT DEFAULT 1 COMMENT '版本号',
    source ENUM('upload', 'generate') DEFAULT 'upload' COMMENT '来源: 上传/生成',
    template_id INT COMMENT '模板ID(生成的合同)',
    form_data JSON COMMENT '表单数据(生成的合同)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created (created_at),
    CONSTRAINT fk_contract_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同表';

-- ============================================
-- 6. 合同历史版本表
-- ============================================
CREATE TABLE contract_versions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    contract_id INT NOT NULL COMMENT '合同ID',
    version INT NOT NULL COMMENT '版本号',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    change_reason VARCHAR(500) COMMENT '变更原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_contract (contract_id),
    CONSTRAINT fk_version_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同历史版本表';

-- ============================================
-- 7. 审核表
-- ============================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    contract_id INT NOT NULL COMMENT '合同ID',
    status ENUM(
        'ai_reviewing',      -- AI审核中
        'pending_assign',    -- 待分配
        'reviewing',         -- 法务审核中
        'pending_approve',   -- 待审批
        'approved',          -- 已通过
        'rejected'           -- 已驳回
    ) DEFAULT 'ai_reviewing' COMMENT '审核状态',
    -- AI审核相关
    ai_result JSON COMMENT 'AI审核结果',
    ai_suggestions JSON COMMENT 'AI修改建议',
    ai_reviewed_at DATETIME COMMENT 'AI审核完成时间',
    -- 法务专员相关
    staff_id INT COMMENT '法务专员ID',
    staff_result TEXT COMMENT '专员审核结果',
    staff_reviewed_at DATETIME COMMENT '专员审核完成时间',
    -- Manager相关
    manager_id INT COMMENT 'Manager ID',
    manager_comment TEXT COMMENT 'Manager审批意见',
    manager_reviewed_at DATETIME COMMENT 'Manager审批时间',
    -- 推荐法务列表
    recommended_staff JSON COMMENT '推荐的法务人员ID列表',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_contract (contract_id),
    INDEX idx_status (status),
    INDEX idx_staff (staff_id),
    UNIQUE KEY uk_contract (contract_id),
    CONSTRAINT fk_review_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_review_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核表';

-- ============================================
-- 8. 风险规则表
-- ============================================
CREATE TABLE risk_rules (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '规则名称',
    category VARCHAR(50) NOT NULL COMMENT '分类: 违约责任/价款支付/争议解决等',
    level ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium' COMMENT '风险等级',
    description TEXT COMMENT '规则描述',
    legal_basis VARCHAR(500) COMMENT '法律依据',
    suggestion TEXT COMMENT '修改建议',
    detection_keywords JSON COMMENT '检测关键词列表',
    detection_pattern VARCHAR(500) COMMENT '正则匹配模式',
    enterprise_id INT COMMENT '所属企业ID(NULL为公共规则)',
    status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_level (level),
    INDEX idx_enterprise (enterprise_id),
    INDEX idx_status (status),
    CONSTRAINT fk_rule_enterprise FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险规则表';

-- ============================================
-- 9. 风险项表
-- ============================================
CREATE TABLE risk_items (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    review_id INT NOT NULL COMMENT '审核ID',
    rule_id INT COMMENT '规则ID',
    level ENUM('high', 'medium', 'low') NOT NULL COMMENT '风险等级',
    category VARCHAR(50) COMMENT '风险分类',
    title VARCHAR(200) COMMENT '风险标题',
    clause TEXT COMMENT '命中条款原文',
    clause_position JSON COMMENT '条款位置 {start, end, page}',
    description TEXT COMMENT '风险描述',
    suggestion TEXT COMMENT '修改建议',
    status ENUM('pending', 'accepted', 'modified', 'rejected') DEFAULT 'pending' COMMENT '状态',
    user_feedback TEXT COMMENT '用户反馈',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_review (review_id),
    INDEX idx_level (level),
    INDEX idx_status (status),
    CONSTRAINT fk_item_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_rule FOREIGN KEY (rule_id) REFERENCES risk_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险项表';

-- ============================================
-- 10. 审核报告表
-- ============================================
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    review_id INT NOT NULL COMMENT '审核ID',
    content JSON COMMENT '报告内容',
    file_path VARCHAR(500) COMMENT 'PDF文件路径',
    signed_at DATETIME COMMENT '签章时间',
    sign_data JSON COMMENT '签章数据',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_review (review_id),
    CONSTRAINT fk_report_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核报告表';

-- ============================================
-- 11. 用户确认记录表
-- ============================================
CREATE TABLE user_confirmations (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    contract_id INT NOT NULL COMMENT '合同ID',
    user_id INT NOT NULL COMMENT '用户ID',
    action ENUM('confirmed', 'feedback') NOT NULL COMMENT '操作: 确认/反馈',
    feedback TEXT COMMENT '反馈内容',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_contract (contract_id),
    INDEX idx_user (user_id),
    CONSTRAINT fk_confirm_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_confirm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户确认记录表';

-- ============================================
-- 12. 配额记录表
-- ============================================
CREATE TABLE quota_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id INT NOT NULL COMMENT '用户ID',
    type ENUM('use', 'allocate', 'refund') NOT NULL COMMENT '类型: 使用/分配/退回',
    amount INT NOT NULL COMMENT '数量(正数为增加,负数为减少)',
    balance INT NOT NULL COMMENT '操作后余额',
    contract_id INT COMMENT '关联合同ID',
    operator_id INT COMMENT '操作人ID(分配时)',
    remark VARCHAR(200) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_created (created_at),
    CONSTRAINT fk_quota_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_quota_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配额记录表';

-- ============================================
-- 13. Agent会话表
-- ============================================
CREATE TABLE agent_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    session_id VARCHAR(50) NOT NULL COMMENT '会话ID',
    user_id INT NOT NULL COMMENT '用户ID',
    messages JSON COMMENT '对话记录',
    round_count INT DEFAULT 0 COMMENT '对话轮数',
    status ENUM('active', 'closed') DEFAULT 'active' COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_session (session_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Agent会话表';

-- ============================================
-- 14. 知识库文档表
-- ============================================
CREATE TABLE knowledge_docs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    title VARCHAR(200) NOT NULL COMMENT '文档标题',
    category VARCHAR(50) COMMENT '分类: 法律法规/案例/解释等',
    content TEXT COMMENT '文档内容',
    file_path VARCHAR(500) COMMENT '源文件路径',
    doc_type VARCHAR(20) COMMENT '文档类型',
    enterprise_id INT COMMENT '所属企业(NULL为公共)',
    vector_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' COMMENT '向量化状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_enterprise (enterprise_id),
    INDEX idx_vector_status (vector_status),
    CONSTRAINT fk_doc_enterprise FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文档表';

-- ============================================
-- 15. 站内消息表
-- ============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id INT NOT NULL COMMENT '接收用户ID',
    title VARCHAR(200) NOT NULL COMMENT '消息标题',
    content TEXT COMMENT '消息内容',
    type ENUM('system', 'contract', 'quota') DEFAULT 'system' COMMENT '消息类型',
    related_id INT COMMENT '关联ID(合同ID等)',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读: 0未读 1已读',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created (created_at),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内消息表';

-- ============================================
-- 16. 操作日志表
-- ============================================
CREATE TABLE operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id INT COMMENT '操作用户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    resource_type VARCHAR(50) COMMENT '资源类型',
    resource_id INT COMMENT '资源ID',
    detail JSON COMMENT '操作详情',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ============================================
-- 17. 系统配置表
-- ============================================
CREATE TABLE system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(500) COMMENT '配置说明',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- ============================================
-- 初始数据
-- ============================================

-- 插入默认管理员
INSERT INTO users (username, password, real_name, role, quota, status) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qO.1BoWBPfGK2e', '系统管理员', 'admin', 999999, 1);
-- 默认密码: admin123

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('llm_url', 'https://open.bigmodel.cn/api/paas/v4/', '大模型API地址'),
('llm_model', 'glm-4-flash', '大模型名称'),
('llm_key', '', '大模型API密钥'),
('max_chat_rounds', '30', '单次对话最大轮数'),
('default_quota', '500', '新用户默认配额'),
('max_file_size', '2097152', '最大文件大小(字节,默认2MB)');

-- 插入默认合同模板
INSERT INTO templates (name, type, description, fields, status) VALUES
('房屋租赁合同', '租赁合同', '标准房屋租赁合同模板',
 '[{"key":"lessor","label":"出租方","type":"text","required":true},{"key":"lessee","label":"承租方","type":"text","required":true},{"key":"address","label":"租赁物地址","type":"text","required":true},{"key":"area","label":"面积(平方米)","type":"number","required":true},{"key":"rent","label":"月租金(元)","type":"number","required":true},{"key":"deposit","label":"押金(元)","type":"number","required":false},{"key":"period_start","label":"租赁开始日期","type":"date","required":true},{"key":"period_end","label":"租赁结束日期","type":"date","required":true},{"key":"payment_day","label":"每月付款日","type":"number","required":true}]',
 1),
('劳动合同', '劳动合同', '标准劳动合同模板',
 '[{"key":"employer","label":"用人单位","type":"text","required":true},{"key":"employee","label":"劳动者","type":"text","required":true},{"key":"position","label":"职位","type":"text","required":true},{"key":"salary","label":"月薪(元)","type":"number","required":true},{"key":"period_start","label":"合同开始日期","type":"date","required":true},{"key":"period_end","label":"合同结束日期","type":"date","required":true},{"key":"probation","label":"试用期(月)","type":"number","required":false}]',
 1),
('采购合同', '采购合同', '标准采购合同模板',
 '[{"key":"buyer","label":"买方","type":"text","required":true},{"key":"seller","label":"卖方","type":"text","required":true},{"key":"product_name","label":"产品名称","type":"text","required":true},{"key":"quantity","label":"数量","type":"number","required":true},{"key":"unit_price","label":"单价(元)","type":"number","required":true},{"key":"total_price","label":"总价(元)","type":"number","required":true},{"key":"delivery_date","label":"交付日期","type":"date","required":true},{"key":"payment_method","label":"付款方式","type":"select","options":["一次性付款","分期付款","货到付款"],"required":true}]',
 1);

-- 插入示例风险规则
INSERT INTO risk_rules (name, category, level, description, legal_basis, suggestion, detection_keywords) VALUES
('违约金比例过高', '违约责任', 'high', '违约金超过合同总金额30%可能被法院调低', '民法典第585条', '建议调整为不超过合同总金额的20%', '["违约金","违约责任","赔偿"]'),
('争议解决条款不明', '争议解决', 'high', '未明确约定管辖法院或仲裁机构，可能导致管辖权争议', '民事诉讼法第34条', '建议明确约定"由原告方所在地人民法院管辖"或指定仲裁机构', '["争议","管辖","仲裁","法院"]'),
('付款期限过长', '价款支付', 'medium', '付款期限超过90天可能增加收款风险', '民法典第509条', '建议付款期限不超过60天，并可约定逾期违约金', '["付款","支付","期限","天"]'),
('缺少保密条款', '保密条款', 'low', '合同未约定保密义务，可能导致商业秘密泄露', '民法典第509条', '建议增加保密条款，明确保密范围和违约责任', '["保密","秘密","商业"]'),
('劳动合同试用期超长', '劳动用工', 'high', '劳动合同试用期超过法定期限', '劳动合同法第19条', '合同期限3年以上试用期不得超过6个月', '["试用期","劳动"]');

```

### 4.3 表结构说明

| 表名 | 说明 | 记录数预估 |
|------|------|-----------|
| enterprises | 企业信息 | 100+ |
| users | 用户信息 | 1000+ |
| staff_profiles | 法务人员画像 | 50+ |
| templates | 合同模板 | 10+ |
| contracts | 合同主表 | 10000+ |
| contract_versions | 合同历史版本 | 20000+ |
| reviews | 审核记录 | 10000+ |
| risk_rules | 风险规则 | 300+ |
| risk_items | 风险项 | 50000+ |
| reports | 审核报告 | 10000+ |
| user_confirmations | 用户确认记录 | 10000+ |
| quota_logs | 配额流水 | 50000+ |
| agent_sessions | Agent会话 | 10000+ |
| knowledge_docs | 知识库文档 | 1000+ |
| notifications | 站内消息 | 50000+ |
| operation_logs | 操作日志 | 100000+ |
| system_configs | 系统配置 | 20+ |

---

## 五、AI架构设计

### 5.1 Agent 架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LangChain Agent 架构                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           Agent 入口                                     │
│                         (AgentExecutor)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           意图识别层                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 法律咨询    │ │ 合同生成    │ │ 进度查询    │ │ 报告查看    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           工具调用层                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │rag_search   │ │create_      │ │query_       │ │get_report   │       │
│  │             │ │contract     │ │status       │ │             │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       │
│  │upload_file  │ │get_form     │ │submit_      │                       │
│  │             │ │_fields      │ │feedback     │                       │
│  └─────────────┘ └─────────────┘ └─────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           RAG 检索层                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Chroma Vector Store                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │ 风险规则向量  │  │ 法律知识向量  │  │ 案例向量     │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                          Embedding Model                                │
│                     (text-embedding-ada-002 / 本地模型)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           LLM 调用层                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        GLM-4-Flash                               │   │
│  │              https://open.bigmodel.cn/api/paas/v4/              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 核心工具定义

```python
# Agent 工具列表

tools = [
    # 知识检索
    Tool(
        name="rag_search",
        description="检索法律知识、风险规则、相关案例",
        func=rag_search
    ),

    # 合同相关
    Tool(
        name="create_contract",
        description="根据模板生成合同",
        func=create_contract
    ),
    Tool(
        name="upload_file",
        description="用户上传合同文件",
        func=upload_file
    ),
    Tool(
        name="get_form_fields",
        description="获取合同模板的必填字段，返回Form表单",
        func=get_form_fields
    ),

    # 查询相关
    Tool(
        name="query_status",
        description="查询合同审核进度",
        func=query_status
    ),
    Tool(
        name="get_report",
        description="获取审核报告",
        func=get_report
    ),

    # 反馈相关
    Tool(
        name="submit_feedback",
        description="用户提交修改意见",
        func=submit_feedback
    ),
    Tool(
        name="confirm_report",
        description="用户确认接受报告",
        func=confirm_report
    ),
]
```

### 5.3 RAG 流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           RAG 检索流程                                   │
└─────────────────────────────────────────────────────────────────────────┘

用户问题 / 合同条款
        │
        ▼
┌───────────────┐
│   Embedding   │  文本 → 向量
│    模型       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Chroma      │  向量相似度检索
│   向量检索    │  Top-K 相关文档
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   上下文构建  │  问题 + 检索结果 → Prompt
└───────┬───────┘
        │
        ▼
┌───────────────┐
│     LLM       │  生成回答 / 风险判断
└───────────────┘
```

### 5.4 AI审核流程（异步）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI审核异步处理流程                                │
└─────────────────────────────────────────────────────────────────────────┘

用户上传合同
        │
        ▼
┌───────────────┐
│  合同状态更新  │  status = "ai_reviewing"
│  + 返回任务ID  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  后台异步任务  │  asyncio / BackgroundTasks
│  开始AI审核    │
└───────┬───────┘
        │
        ├──► 文档解析 (PDF/Word/OCR)
        │
        ├──► 条款提取
        │
        ├──► RAG风险匹配
        │
        ├──► 生成修改建议
        │
        ▼
┌───────────────┐
│  审核结果存储  │  ai_result, ai_suggestions
│  状态更新      │  status = "pending_assign"
└───────────────┘

用户轮询: GET /api/contracts/{id}/status
```

---

## 六、前端架构

### 6.1 项目目录结构

```
frontend/
├── public/
│   └── index.html
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router/                    # 路由
│   │   ├── index.tsx
│   │   ├── b-end.tsx             # B端路由
│   │   └── c-end.tsx             # C端路由
│   │
│   ├── stores/                    # Zustand 状态管理
│   │   ├── userStore.ts
│   │   ├── contractStore.ts
│   │   └── chatStore.ts
│   │
│   ├── api/                       # API 请求
│   │   ├── request.ts            # Axios 封装
│   │   ├── auth.ts
│   │   ├── contract.ts
│   │   ├── review.ts
│   │   └── agent.ts
│   │
│   ├── pages/                     # 页面
│   │   ├── b-end/                # B端页面
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── contracts/
│   │   │   ├── reviews/
│   │   │   ├── rules/
│   │   │   ├── staff/
│   │   │   ├── templates/
│   │   │   ├── users/
│   │   │   └── quotas/
│   │   │
│   │   └── c-end/                # C端页面
│   │       ├── login/
│   │       ├── chat/             # 智能体对话
│   │       ├── contracts/
│   │       └── profile/
│   │
│   ├── components/                # 组件
│   │   ├── common/               # 通用组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── FormRender.tsx    # 动态Form组件
│   │   │
│   │   ├── contract/             # 合同相关
│   │   │   ├── ContractUpload.tsx
│   │   │   ├── ContractPreview.tsx
│   │   │   └── RiskHighlight.tsx
│   │   │
│   │   ├── review/               # 审核相关
│   │   │   ├── ReviewTask.tsx
│   │   │   ├── RiskPanel.tsx     # 风险侧边栏
│   │   │   └── SuggestionEditor.tsx
│   │   │
│   │   └── agent/                # Agent相关
│   │       ├── ChatWindow.tsx
│   │       ├── MessageItem.tsx
│   │       └── DynamicForm.tsx   # Agent返回的Form
│   │
│   ├── hooks/                     # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useContract.ts
│   │   └── useChat.ts
│   │
│   ├── utils/                     # 工具函数
│   │   ├── auth.ts
│   │   └── format.ts
│   │
│   └── styles/                    # 样式
│       └── main.css
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── Dockerfile
```

### 6.2 核心页面设计

#### B端 - 审核任务页面

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo]  合同智能审核平台                      [通知] [用户头像 ▼]       │
├─────────────┬───────────────────────────────────────────────────────────┤
│             │                                                           │
│  📊 首页    │   审核任务                                                │
│             │   ┌─────────────────────────────────────────────────┐    │
│  📄 合同管理 │   │  状态筛选: [全部] [待分配] [审核中] [待审批]    │    │
│             │   └─────────────────────────────────────────────────┘    │
│  ✅ 审核任务 │   ┌─────────────────────────────────────────────────┐    │
│   └ 待办    │   │ 合同标题      │ 类型   │ 提交人  │ 状态   │ 操作  │    │
│   └ 已完成   │   ├───────────────┼────────┼─────────┼────────┼───────│    │
│             │   │ 采购合同A     │ 采购   │ 张三    │ 审核中 │ [处理]│    │
│  📋 风险规则 │   │ 劳动合同B     │ 劳动   │ 李四    │ 待分配 │ [分配]│    │
│             │   └─────────────────────────────────────────────────────┘    │
│  👥 人员管理 │                                                           │
│             │                                                           │
│  📝 模板管理 │                                                           │
│             │                                                           │
│  👤 用户管理 │                                                           │
│             │                                                           │
│  💰 配额管理 │                                                           │
│             │                                                           │
└─────────────┴───────────────────────────────────────────────────────────┘
```

#### B端 - 审核处理页面

```
┌─────────────────────────────────────────────────────────────────────────┐
│  审核处理 - 采购合同A                                    [返回] [提交]  │
├─────────────────────────────────────────────────┬───────────────────────┤
│                                                 │                       │
│                  合同原文                        │    风险提示           │
│                                                 │                       │
│  ┌─────────────────────────────────────────┐   │  🔴 高风险 (2)        │
│  │                                         │   │  ├─ 违约金比例过高    │
│  │  第一条 甲方...                          │   │  └─ 争议条款不明      │
│  │                                         │   │                       │
│  │  第二条 乙方...                          │   │  🟡 中风险 (1)        │
│  │                                         │   │  └─ 付款期限偏长      │
│  │  第三条 【🔴 违约金为合同总金额50%】     │   │                       │
│  │                                         │   │  🟢 低风险 (3)        │
│  │  ...                                    │   │  ├─ 格式规范          │
│  │                                         │   │  └─ ...               │
│  └─────────────────────────────────────────┘   │                       │
│                                                 ├───────────────────────┤
│                                                 │    修改建议           │
│                                                 │                       │
│                                                 │  ▼ 违约金比例过高     │
│                                                 │  问题: ...            │
│                                                 │  建议: [编辑] [接受]  │
│                                                 │                       │
│                                                 │  ▼ 争议条款不明       │
│                                                 │  问题: ...            │
│                                                 │  建议: [编辑] [接受]  │
│                                                 │                       │
└─────────────────────────────────────────────────┴───────────────────────┘
```

#### C端 - 智能体对话页面

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [←] 法律智能助手                                    [我的合同] [配额]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 您好！我是您的法律智能助手，请问有什么可以帮您？              │   │
│  │    我可以帮您：                                                  │   │
│  │    • 法律咨询                                                    │   │
│  │    • 上传合同审核                                                │   │
│  │    • 生成合同                                                    │   │
│  │    • 查询审核进度                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👤 我想生成一份租赁合同                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 好的，请填写以下信息：                                        │   │
│  │    ┌─────────────────────────────────────────────────────────┐  │   │
│  │    │ 出租方名称: [________________]                          │  │   │
│  │    │ 承租方名称: [________________]                          │  │   │
│  │    │ 租赁物地址: [________________]                          │  │   │
│  │    │ 租赁期限:   [____] 至 [____]                            │  │   │
│  │    │ 月租金:     [________] 元                               │  │   │
│  │    │                                                      │  │   │
│  │    │                           [取消] [确认生成]            │  │   │
│  │    └─────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  [📎 上传文件]  [请输入您的问题...________________________] [发送]      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 七、安全设计

### 7.1 认证与授权

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           JWT 认证流程                                   │
└─────────────────────────────────────────────────────────────────────────┘

用户登录
    │
    ▼
验证用户名/密码
    │
    ▼
生成 JWT Token
┌─────────────────────────────────────┐
│ {                                   │
│   "sub": "user_id",                 │
│   "role": "admin/manager/staff/user"│
│   "exp": "过期时间",                 │
│   "iat": "签发时间"                  │
│ }                                   │
└─────────────────────────────────────┘
    │
    ▼
返回 Token 给客户端

客户端请求携带 Token
    │
    ▼
中间件验证 Token
    │
    ├─ 验证签名
    ├─ 验证过期时间
    ├─ 提取用户信息
    │
    ▼
权限检查（基于角色）
    │
    ▼
允许/拒绝请求
```

### 7.2 权限控制

```python
# 权限装饰器示例
def require_role(roles: List[str]):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user = Depends(get_current_user), **kwargs):
            if current_user.role not in roles:
                raise HTTPException(status_code=403, detail="权限不足")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# 使用示例
@router.post("/contracts/{id}/approve")
@require_role(["admin", "manager"])
async def approve_contract(id: int, current_user = Depends(get_current_user)):
    # 只有 admin 和 manager 可以审批
    pass
```

---

## 八、日志与监控

### 8.1 日志配置

```python
# logger.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logger():
    logger = logging.getLogger("easyverify")
    logger.setLevel(logging.INFO)

    # 文件处理器
    file_handler = RotatingFileHandler(
        "logs/app.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))

    logger.addHandler(file_handler)
    return logger
```

### 8.2 日志类型

| 日志类型 | 文件 | 内容 |
|----------|------|------|
| 应用日志 | logs/app.log | 系统运行日志 |
| 访问日志 | logs/access.log | API访问记录 |
| AI日志 | logs/ai.log | AI调用、审核过程 |
| 操作日志 | logs/operation.log | 用户操作记录 |

---

## 九、部署配置

### 9.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: easyverify
    volumes:
      - mysql_data:/var/lib/mysql
      - ./data:/app/data
    ports:
      - "3306:3306"
    networks:
      - app-network

  backend:
    build: ./backend
    environment:
      DATABASE_URL: mysql+pymysql://root:${MYSQL_ROOT_PASSWORD}@mysql:3306/easyverify
      JWT_SECRET: ${JWT_SECRET}
      LLM_URL: ${LLM_URL}
      LLM_KEY: ${LLM_KEY}
      LLM_MODEL: ${LLM_MODEL}
    volumes:
      - ./data:/app/data
    depends_on:
      - mysql
    ports:
      - "8000:8000"
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mysql_data:

networks:
  app-network:
    driver: bridge
```

### 9.2 环境变量

```bash
# .env
MYSQL_ROOT_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
LLM_URL=https://open.bigmodel.cn/api/paas/v4/
LLM_KEY=sk-cp-a6sqyqlgx3hnfydk
LLM_MODEL=glm-4-flash
```

---

## 十、开发计划

### 10.1 MVP开发阶段

| 阶段 | 内容 | 周期 |
|------|------|------|
| 第一阶段 | 项目搭建、数据库设计、基础API | - |
| 第二阶段 | 用户认证、权限管理、配额管理 | - |
| 第三阶段 | 合同上传、AI审核流程 | - |
| 第四阶段 | RAG知识库、风险规则管理 | - |
| 第五阶段 | Agent对话、C端智能体 | - |
| 第六阶段 | B端管理后台 | - |
| 第七阶段 | 测试、部署 | - |

---

## 更新历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-03-21 | 初始版本 |
