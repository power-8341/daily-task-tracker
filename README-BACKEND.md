# 成长网站 V2.0 后端架构

> 可扩展的后端架构，支持无限代理

## 技术栈

- **框架**: Next.js 14 + App Router
- **数据库**: SQLite + better-sqlite3
- **语言**: TypeScript

## 数据库表结构

### 1. agents 表 - 代理/团队成员信息

存储AI代理或团队成员的基本信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT PRIMARY KEY | 唯一标识符 |
| `name` | TEXT NOT NULL UNIQUE | 代理名称 |
| `avatar` | TEXT | 头像/表情符号 |
| `role` | TEXT NOT NULL | 角色/职位 |
| `description` | TEXT | 详细描述 |
| `skills` | TEXT (JSON) | 技能列表（JSON数组） |
| `personality` | TEXT | 性格特点 |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |
| `meta` | TEXT (JSON) | **扩展字段**，预留 |

**skills JSON 格式示例**:
```json
[
  { "skill_name": "前端开发", "proficiency": 9, "status": "mastered" },
  { "skill_name": "后端开发", "proficiency": 8, "status": "practicing" }
]
```

### 2. tasks 表 - 任务信息

存储所有任务数据。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT PRIMARY KEY | 唯一标识符 |
| `title` | TEXT NOT NULL | 任务标题 |
| `agent_id` | TEXT NOT NULL | 负责代理ID（外键） |
| `category` | TEXT | 任务类别 |
| `project_id` | TEXT | 所属项目ID（外键，可为空） |
| `priority` | TEXT | 优先级: `low`, `medium`, `high`, `urgent` |
| `status` | TEXT | 状态: `pending`, `in_progress`, `completed`, `cancelled` |
| `created_at` | TEXT | 创建时间 |
| `completed_at` | TEXT | 完成时间 |
| `description` | TEXT | 详细描述 |
| `estimated_hours` | REAL | 预计工时 |
| `actual_hours` | REAL | 实际工时 |
| `meta` | TEXT (JSON) | **扩展字段**，预留 |

**索引**:
- `idx_tasks_agent` - 代理查询优化
- `idx_tasks_project` - 项目查询优化
- `idx_tasks_status` - 状态筛选优化
- `idx_tasks_created` - 时间范围查询优化

### 3. projects 表 - 项目信息

存储项目数据。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT PRIMARY KEY | 唯一标识符 |
| `name` | TEXT NOT NULL | 项目名称 |
| `description` | TEXT | 项目描述 |
| `status` | TEXT | 状态: `planning`, `active`, `completed`, `archived` |
| `team_members` | TEXT (JSON) | 团队成员ID数组 |
| `progress` | REAL | 进度 0-100 |
| `start_date` | TEXT | 开始日期 |
| `end_date` | TEXT | 结束日期 |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |
| `meta` | TEXT (JSON) | **扩展字段**，预留 |

**team_members JSON 格式示例**:
```json
["agent_power", "agent_daima", "agent_meihua"]
```

### 4. skills 表 - 技能详细信息（独立表）

单独存储技能数据，支持更复杂的技能管理。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT PRIMARY KEY | 唯一标识符 |
| `agent_id` | TEXT NOT NULL | 所属代理ID（外键） |
| `skill_name` | TEXT NOT NULL | 技能名称 |
| `proficiency` | INTEGER | 熟练度 1-10 |
| `status` | TEXT | 状态: `learning`, `practicing`, `mastered` |
| `expected_date` | TEXT | 预计掌握日期 |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |
| `meta` | TEXT (JSON) | **扩展字段**，预留 |

### 5. achievements 表 - 成就徽章

存储成就徽章数据。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT PRIMARY KEY | 唯一标识符 |
| `agent_id` | TEXT NOT NULL | 获得代理ID（外键） |
| `badge_name` | TEXT NOT NULL | 徽章名称 |
| `description` | TEXT | 描述 |
| `earned_at` | TEXT | 获得时间 |
| `icon` | TEXT | 图标 |
| `rarity` | TEXT | 稀有度: `common`, `rare`, `epic`, `legendary` |
| `meta` | TEXT (JSON) | **扩展字段**，预留 |

## API 接口文档

### 代理 API

#### GET /api/agents
获取所有代理列表（支持分页）

**Query 参数**:
- `page` - 页码，默认 1
- `pageSize` - 每页数量，默认 100

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 100,
    "total": 4,
    "totalPages": 1
  }
}
```

#### POST /api/agents
创建新代理

**请求体**:
```json
{
  "name": "新代理",
  "role": "角色描述",
  "avatar": "🤖",
  "description": "详细描述",
  "skills": [...],
  "personality": "性格特点"
}
```

#### GET /api/agents/[id]
获取单个代理详情（包含统计信息）

#### PUT /api/agents/[id]
更新代理信息

#### DELETE /api/agents/[id]
删除代理

---

### 任务 API

#### GET /api/tasks
获取任务列表（支持多种筛选）

**Query 参数**:
- `agent` - 按代理ID筛选
- `project` - 按项目ID筛选
- `status` - 按状态筛选: `pending`, `in_progress`, `completed`, `cancelled`
- `category` - 按类别筛选
- `priority` - 按优先级筛选: `low`, `medium`, `high`, `urgent`
- `dateFrom` - 开始日期 (ISO格式)
- `dateTo` - 结束日期 (ISO格式)
- `page` - 页码
- `pageSize` - 每页数量

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "pagination": { ... }
}
```

#### POST /api/tasks
创建新任务

**请求体**:
```json
{
  "title": "任务标题",
  "agent_id": "agent_power",
  "category": "general",
  "project_id": "proj_xxx",
  "priority": "medium",
  "status": "pending",
  "description": "描述",
  "estimated_hours": 2
}
```

#### GET /api/tasks/[id]
获取单个任务详情

#### PUT /api/tasks/[id]
更新任务信息（支持部分更新）
- 当 `status` 设为 `completed` 时，自动设置 `completed_at`

#### DELETE /api/tasks/[id]
删除任务

---

### 项目 API

#### GET /api/projects
获取项目列表

**Query 参数**:
- `status` - 状态筛选
- `page` - 页码
- `pageSize` - 每页数量

#### POST /api/projects
创建新项目

#### GET /api/projects/[id]
获取项目详情（包含关联任务）

#### PUT /api/projects/[id]
更新项目信息

#### DELETE /api/projects/[id]
删除项目

---

### 统计 API

#### GET /api/stats
获取系统统计数据

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalAgents": 4,
    "totalTasks": 20,
    "completedTasks": 18,
    "inProgressTasks": 2,
    "totalProjects": 2,
    "activeProjects": 1,
    "totalAchievements": 0,
    "taskCompletionRate": 90,
    "agentStats": [...]
  }
}
```

## 扩展性设计

### 预留扩展字段

每张表都包含 `meta` JSON 字段，用于存储动态扩展的数据，无需修改表结构：

```typescript
// 扩展示例：为任务添加标签
TaskRepo.update(taskId, {
  meta: {
    tags: ['紧急', '客户反馈'],
    source: '飞书',
    customerId: 'cust_123'
  }
});
```

### 支持无限代理

- 数据库层面：无代理数量限制
- API层面：分页支持，支持大规模数据
- 索引优化：针对代理查询建立了索引

### 未来扩展方向

1. **标签系统** - 使用 `meta` 字段或新增 tags 表
2. **时间追踪** - 扩展 `actual_hours` 或使用独立时间记录表
3. **评论/讨论** - 新增 comments 表
4. **文件附件** - 新增 attachments 表
5. **通知系统** - 新增 notifications 表

## 数据迁移

运行迁移脚本，将现有数据导入新数据库：

```bash
npm run migrate
# 或
npx ts-node scripts/migrate-data.ts
```

## 开发指南

### 初始化数据库

```typescript
import { initDatabase } from '@/lib/db';
initDatabase();
```

### 使用数据仓库

```typescript
import { AgentRepo, TaskRepo, ProjectRepo } from '@/lib/db';

// 查询代理
const { agents, total } = AgentRepo.findAll({ page: 1, pageSize: 10 });

// 创建任务
const task = TaskRepo.create({
  title: '新任务',
  agent_id: 'agent_power',
  priority: 'high'
});

// 筛选任务
const { tasks } = TaskRepo.findAll({
  agent: 'agent_daima',
  status: 'completed'
});
```

### 数据库位置

开发环境: `./data/growth.db`
生产环境: 通过 `DATA_DIR` 环境变量指定

---

**版本**: V2.0  
**最后更新**: 2026-02-11
