/**
 * Database Schema Definition
 * 
 * V2.0 重构 - 支持无限代理的可扩展架构
 * 使用 SQLite + better-sqlite3
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 确保数据目录存在
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'growth.db');

// 数据库连接实例
let db: Database.Database | null = null;

/**
 * 获取数据库连接（单例模式）
 */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // 启用WAL模式，提高并发性能
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================================
// 类型定义
// ============================================================

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  skills: Array<{ skill_name: string; proficiency: number; status: 'learning' | 'practicing' | 'mastered' }>; // JSON存储
  personality: string;
  created_at: string;
  updated_at: string;
  // 扩展字段
  meta?: Record<string, any>; // JSON存储，预留扩展
}

export interface Task {
  id: string;
  title: string;
  agent_id: string;
  category: string;
  project_id: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  description?: string;
  estimated_hours?: number;
  actual_hours?: number;
  // 扩展字段
  meta?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  team_members: string[]; // JSON存储，agent_id数组
  progress: number; // 0-100
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  // 扩展字段
  meta?: Record<string, any>;
}

export interface Skill {
  id: string;
  agent_id: string;
  skill_name: string;
  proficiency: number; // 1-10
  status: 'learning' | 'practicing' | 'mastered';
  expected_date: string | null;
  created_at: string;
  updated_at: string;
  // 扩展字段
  meta?: Record<string, any>;
}

export interface Achievement {
  id: string;
  agent_id: string;
  badge_name: string;
  description: string;
  earned_at: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  // 扩展字段
  meta?: Record<string, any>;
}

// 统计结果类型
export interface Stats {
  totalAgents: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalProjects: number;
  activeProjects: number;
  totalAchievements: number;
  taskCompletionRate: number;
  agentStats: AgentStat[];
}

export interface AgentStat {
  agentId: string;
  agentName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  achievements: number;
}

// ============================================================
// 数据库初始化
// ============================================================

const INIT_SQL = `
-- agents 表：AI代理/团队成员信息
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  avatar TEXT,
  role TEXT NOT NULL,
  description TEXT,
  skills TEXT DEFAULT '[]', -- JSON数组
  personality TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  meta TEXT DEFAULT '{}' -- 扩展字段，JSON对象
);

-- tasks 表：任务信息
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  project_id TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  description TEXT,
  estimated_hours REAL,
  actual_hours REAL,
  meta TEXT DEFAULT '{}', -- 扩展字段
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- projects 表：项目信息
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'active', 'completed', 'archived')),
  team_members TEXT DEFAULT '[]', -- JSON数组，存储agent_id
  progress REAL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  meta TEXT DEFAULT '{}' -- 扩展字段
);

-- skills 表：技能详细信息
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency INTEGER DEFAULT 1 CHECK(proficiency >= 1 AND proficiency <= 10),
  status TEXT DEFAULT 'learning' CHECK(status IN ('learning', 'practicing', 'mastered')),
  expected_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  meta TEXT DEFAULT '{}', -- 扩展字段
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- achievements 表：成就徽章
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  icon TEXT,
  rarity TEXT DEFAULT 'common' CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
  meta TEXT DEFAULT '{}', -- 扩展字段
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_skills_agent ON skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_achievements_agent ON achievements(agent_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 更新时间戳触发器
CREATE TRIGGER IF NOT EXISTS update_agents_timestamp 
AFTER UPDATE ON agents
BEGIN
  UPDATE agents SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
AFTER UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_skills_timestamp 
AFTER UPDATE ON skills
BEGIN
  UPDATE skills SET updated_at = datetime('now') WHERE id = NEW.id;
END;
`;

/**
 * 初始化数据库（创建表结构）
 */
export function initDatabase(): void {
  const db = getDb();
  db.exec(INIT_SQL);
  console.log('✅ Database initialized successfully');
}

/**
 * 重置数据库（删除所有数据，用于开发测试）
 */
export function resetDatabase(): void {
  const db = getDb();
  db.exec(`
    DROP TABLE IF EXISTS achievements;
    DROP TABLE IF EXISTS skills;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS agents;
  `);
  initDatabase();
  console.log('✅ Database reset successfully');
}

// ============================================================
// Agents 数据操作
// ============================================================

export const AgentRepo = {
  /**
   * 创建代理
   */
  create(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Agent {
    const db = getDb();
    const id = agent.id || generateId();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO agents (id, name, avatar, role, description, skills, personality, created_at, updated_at, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      agent.name,
      agent.avatar || '',
      agent.role,
      agent.description || '',
      JSON.stringify(agent.skills || []),
      agent.personality || '',
      now,
      now,
      JSON.stringify(agent.meta || {})
    );
    
    return AgentRepo.findById(id)!;
  },

  /**
   * 根据ID查找代理
   */
  findById(id: string): Agent | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
    return row ? parseAgent(row) : null;
  },

  /**
   * 根据名称查找代理
   */
  findByName(name: string): Agent | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM agents WHERE name = ?').get(name) as any;
    return row ? parseAgent(row) : null;
  },

  /**
   * 获取所有代理（支持分页）
   */
  findAll(options?: { page?: number; pageSize?: number }): { agents: Agent[]; total: number } {
    const db = getDb();
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 100;
    const offset = (page - 1) * pageSize;
    
    const agents = db.prepare('SELECT * FROM agents ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(pageSize, offset) as any[];
    
    const { total } = db.prepare('SELECT COUNT(*) as total FROM agents').get() as { total: number };
    
    return {
      agents: agents.map(parseAgent),
      total
    };
  },

  /**
   * 更新代理
   */
  update(id: string, updates: Partial<Agent>): Agent | null {
    const db = getDb();
    const agent = AgentRepo.findById(id);
    if (!agent) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.avatar !== undefined) { fields.push('avatar = ?'); values.push(updates.avatar); }
    if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.skills !== undefined) { fields.push('skills = ?'); values.push(JSON.stringify(updates.skills)); }
    if (updates.personality !== undefined) { fields.push('personality = ?'); values.push(updates.personality); }
    if (updates.meta !== undefined) { fields.push('meta = ?'); values.push(JSON.stringify(updates.meta)); }

    if (fields.length === 0) return agent;

    values.push(id);
    db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    
    return AgentRepo.findById(id);
  },

  /**
   * 删除代理
   */
  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    return result.changes > 0;
  },

  /**
   * 获取代理统计
   */
  getStats(agentId: string): AgentStat | null {
    const db = getDb();
    const agent = AgentRepo.findById(agentId);
    if (!agent) return null;

    const taskStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks WHERE agent_id = ?
    `).get(agentId) as { total: number; completed: number };

    const { achievements } = db.prepare(`
      SELECT COUNT(*) as achievements FROM achievements WHERE agent_id = ?
    `).get(agentId) as { achievements: number };

    return {
      agentId,
      agentName: agent.name,
      totalTasks: taskStats.total || 0,
      completedTasks: taskStats.completed || 0,
      completionRate: taskStats.total ? Math.round((taskStats.completed / taskStats.total) * 100) : 0,
      achievements
    };
  }
};

// ============================================================
// Tasks 数据操作
// ============================================================

export const TaskRepo = {
  /**
   * 创建任务
   */
  create(task: Omit<Task, 'id' | 'created_at' | 'completed_at'> & { id?: string; completed_at?: string | null }): Task {
    const db = getDb();
    const id = task.id || generateId();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, agent_id, category, project_id, priority, status, created_at, completed_at, description, estimated_hours, actual_hours, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      task.title,
      task.agent_id,
      task.category || 'general',
      task.project_id || null,
      task.priority || 'medium',
      task.status || 'pending',
      now,
      task.status === 'completed' ? now : task.completed_at || null,
      task.description || null,
      task.estimated_hours || null,
      task.actual_hours || null,
      JSON.stringify(task.meta || {})
    );
    
    return TaskRepo.findById(id)!;
  },

  /**
   * 根据ID查找任务
   */
  findById(id: string): Task | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    return row ? parseTask(row) : null;
  },

  /**
   * 查询任务（支持多种筛选条件）
   */
  findAll(options?: {
    agent?: string;
    project?: string;
    status?: string;
    category?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): { tasks: Task[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const values: any[] = [];

    if (options?.agent) {
      conditions.push('agent_id = ?');
      values.push(options.agent);
    }
    if (options?.project) {
      conditions.push('project_id = ?');
      values.push(options.project);
    }
    if (options?.status) {
      conditions.push('status = ?');
      values.push(options.status);
    }
    if (options?.category) {
      conditions.push('category = ?');
      values.push(options.category);
    }
    if (options?.priority) {
      conditions.push('priority = ?');
      values.push(options.priority);
    }
    if (options?.dateFrom) {
      conditions.push('created_at >= ?');
      values.push(options.dateFrom);
    }
    if (options?.dateTo) {
      conditions.push('created_at <= ?');
      values.push(options.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 100;
    const offset = (page - 1) * pageSize;

    const tasks = db.prepare(`
      SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset) as any[];

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM tasks ${whereClause}
    `).get(...values) as { total: number };

    return { tasks: tasks.map(parseTask), total };
  },

  /**
   * 更新任务
   */
  update(id: string, updates: Partial<Task>): Task | null {
    const db = getDb();
    const task = TaskRepo.findById(id);
    if (!task) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.agent_id !== undefined) { fields.push('agent_id = ?'); values.push(updates.agent_id); }
    if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.project_id !== undefined) { fields.push('project_id = ?'); values.push(updates.project_id); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
    if (updates.status !== undefined) { 
      fields.push('status = ?'); 
      values.push(updates.status);
      // 自动设置完成时间
      if (updates.status === 'completed' && task.status !== 'completed') {
        fields.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
    }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.estimated_hours !== undefined) { fields.push('estimated_hours = ?'); values.push(updates.estimated_hours); }
    if (updates.actual_hours !== undefined) { fields.push('actual_hours = ?'); values.push(updates.actual_hours); }
    if (updates.meta !== undefined) { fields.push('meta = ?'); values.push(JSON.stringify(updates.meta)); }

    if (fields.length === 0) return task;

    values.push(id);
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    
    return TaskRepo.findById(id);
  },

  /**
   * 删除任务
   */
  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  /**
   * 获取今日任务
   */
  getTodayTasks(): Task[] {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const rows = db.prepare(`
      SELECT * FROM tasks WHERE date(created_at) = date(?)
    `).all(today) as any[];
    return rows.map(parseTask);
  }
};

// ============================================================
// Projects 数据操作
// ============================================================

export const ProjectRepo = {
  create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Project {
    const db = getDb();
    const id = project.id || generateId();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO projects (id, name, description, status, team_members, progress, start_date, end_date, created_at, updated_at, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      project.name,
      project.description || '',
      project.status || 'planning',
      JSON.stringify(project.team_members || []),
      project.progress || 0,
      project.start_date || now,
      project.end_date || null,
      now,
      now,
      JSON.stringify(project.meta || {})
    );
    
    return ProjectRepo.findById(id)!;
  },

  findById(id: string): Project | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    return row ? parseProject(row) : null;
  },

  findAll(options?: { status?: string; page?: number; pageSize?: number }): { projects: Project[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const values: any[] = [];

    if (options?.status) {
      conditions.push('status = ?');
      values.push(options.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 100;
    const offset = (page - 1) * pageSize;

    const projects = db.prepare(`
      SELECT * FROM projects ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset) as any[];

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM projects ${whereClause}
    `).get(...values) as { total: number };

    return { projects: projects.map(parseProject), total };
  },

  update(id: string, updates: Partial<Project>): Project | null {
    const db = getDb();
    const project = ProjectRepo.findById(id);
    if (!project) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.team_members !== undefined) { fields.push('team_members = ?'); values.push(JSON.stringify(updates.team_members)); }
    if (updates.progress !== undefined) { fields.push('progress = ?'); values.push(updates.progress); }
    if (updates.end_date !== undefined) { fields.push('end_date = ?'); values.push(updates.end_date); }
    if (updates.meta !== undefined) { fields.push('meta = ?'); values.push(JSON.stringify(updates.meta)); }

    if (fields.length === 0) return project;

    values.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    
    return ProjectRepo.findById(id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// ============================================================
// Skills 数据操作
// ============================================================

export const SkillRepo = {
  create(skill: Omit<Skill, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Skill {
    const db = getDb();
    const id = skill.id || generateId();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO skills (id, agent_id, skill_name, proficiency, status, expected_date, created_at, updated_at, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      skill.agent_id,
      skill.skill_name,
      skill.proficiency || 1,
      skill.status || 'learning',
      skill.expected_date || null,
      now,
      now,
      JSON.stringify(skill.meta || {})
    );
    
    return SkillRepo.findById(id)!;
  },

  findById(id: string): Skill | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as any;
    return row ? parseSkill(row) : null;
  },

  findByAgent(agentId: string): Skill[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM skills WHERE agent_id = ? ORDER BY created_at DESC').all(agentId) as any[];
    return rows.map(parseSkill);
  },

  update(id: string, updates: Partial<Skill>): Skill | null {
    const db = getDb();
    const skill = SkillRepo.findById(id);
    if (!skill) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.skill_name !== undefined) { fields.push('skill_name = ?'); values.push(updates.skill_name); }
    if (updates.proficiency !== undefined) { fields.push('proficiency = ?'); values.push(updates.proficiency); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.expected_date !== undefined) { fields.push('expected_date = ?'); values.push(updates.expected_date); }
    if (updates.meta !== undefined) { fields.push('meta = ?'); values.push(JSON.stringify(updates.meta)); }

    if (fields.length === 0) return skill;

    values.push(id);
    db.prepare(`UPDATE skills SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    
    return SkillRepo.findById(id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// ============================================================
// Achievements 数据操作
// ============================================================

export const AchievementRepo = {
  create(achievement: Omit<Achievement, 'id' | 'earned_at'> & { id?: string; earned_at?: string }): Achievement {
    const db = getDb();
    const id = achievement.id || generateId();
    const earned_at = achievement.earned_at || new Date().toISOString();
    
    db.prepare(`
      INSERT INTO achievements (id, agent_id, badge_name, description, earned_at, icon, rarity, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      achievement.agent_id,
      achievement.badge_name,
      achievement.description || '',
      earned_at,
      achievement.icon || null,
      achievement.rarity || 'common',
      JSON.stringify(achievement.meta || {})
    );
    
    return AchievementRepo.findById(id)!;
  },

  findById(id: string): Achievement | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id) as any;
    return row ? parseAchievement(row) : null;
  },

  findByAgent(agentId: string): Achievement[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM achievements WHERE agent_id = ? ORDER BY earned_at DESC').all(agentId) as any[];
    return rows.map(parseAchievement);
  },

  findAll(options?: { rarity?: string; page?: number; pageSize?: number }): { achievements: Achievement[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const values: any[] = [];

    if (options?.rarity) {
      conditions.push('rarity = ?');
      values.push(options.rarity);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 100;
    const offset = (page - 1) * pageSize;

    const achievements = db.prepare(`
      SELECT * FROM achievements ${whereClause} ORDER BY earned_at DESC LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset) as any[];

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM achievements ${whereClause}
    `).get(...values) as { total: number };

    return { achievements: achievements.map(parseAchievement), total };
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM achievements WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// ============================================================
// 统计数据
// ============================================================

export const StatsRepo = {
  getStats(): Stats {
    const db = getDb();
    
    const { totalAgents } = db.prepare('SELECT COUNT(*) as totalAgents FROM agents').get() as { totalAgents: number };
    const { totalTasks } = db.prepare('SELECT COUNT(*) as totalTasks FROM tasks').get() as { totalTasks: number };
    const { completedTasks } = db.prepare(`SELECT COUNT(*) as completedTasks FROM tasks WHERE status = 'completed'`).get() as { completedTasks: number };
    const { inProgressTasks } = db.prepare(`SELECT COUNT(*) as inProgressTasks FROM tasks WHERE status = 'in_progress'`).get() as { inProgressTasks: number };
    const { totalProjects } = db.prepare('SELECT COUNT(*) as totalProjects FROM projects').get() as { totalProjects: number };
    const { activeProjects } = db.prepare(`SELECT COUNT(*) as activeProjects FROM projects WHERE status = 'active'`).get() as { activeProjects: number };
    const { totalAchievements } = db.prepare('SELECT COUNT(*) as totalAchievements FROM achievements').get() as { totalAchievements: number };

    const agentStats = db.prepare(`
      SELECT 
        a.id as agentId,
        a.name as agentName,
        COUNT(t.id) as totalTasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedTasks
      FROM agents a
      LEFT JOIN tasks t ON a.id = t.agent_id
      GROUP BY a.id
    `).all() as any[];

    return {
      totalAgents,
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalProjects,
      activeProjects,
      totalAchievements,
      taskCompletionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      agentStats: agentStats.map(stat => ({
        agentId: stat.agentId,
        agentName: stat.agentName,
        totalTasks: stat.totalTasks || 0,
        completedTasks: stat.completedTasks || 0,
        completionRate: stat.totalTasks ? Math.round((stat.completedTasks / stat.totalTasks) * 100) : 0,
        achievements: 0 // 简化处理，需要单独查询
      }))
    };
  }
};

// ============================================================
// 工具函数
// ============================================================

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseAgent(row: any): Agent {
  return {
    ...row,
    skills: JSON.parse(row.skills || '[]'),
    meta: JSON.parse(row.meta || '{}')
  };
}

function parseTask(row: any): Task {
  return {
    ...row,
    meta: JSON.parse(row.meta || '{}')
  };
}

function parseProject(row: any): Project {
  return {
    ...row,
    team_members: JSON.parse(row.team_members || '[]'),
    meta: JSON.parse(row.meta || '{}')
  };
}

function parseSkill(row: any): Skill {
  return {
    ...row,
    meta: JSON.parse(row.meta || '{}')
  };
}

function parseAchievement(row: any): Achievement {
  return {
    ...row,
    meta: JSON.parse(row.meta || '{}')
  };
}

// 初始化数据库（如果直接运行此文件）
if (require.main === module) {
  initDatabase();
  console.log('Database initialized at:', DB_PATH);
}
