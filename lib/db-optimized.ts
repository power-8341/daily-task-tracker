/**
 * 数据库索引和查询优化模块
 * 
 * - 添加性能索引
 * - 查询优化（避免N+1）
 * - 批量操作支持
 */

import { getDb, Agent, Task, Project, Skill, Achievement } from './db';

// ============================================================
// 索引管理
// ============================================================

/**
 * 性能优化索引定义
 */
const PERFORMANCE_INDEXES = [
  // 任务表复合索引 - 优化按agent+status的查询
  { name: 'idx_tasks_agent_status', table: 'tasks', columns: 'agent_id, status' },
  { name: 'idx_tasks_agent_created', table: 'tasks', columns: 'agent_id, created_at DESC' },
  { name: 'idx_tasks_status_created', table: 'tasks', columns: 'status, created_at DESC' },
  { name: 'idx_tasks_project_status', table: 'tasks', columns: 'project_id, status' },
  { name: 'idx_tasks_category', table: 'tasks', columns: 'category' },
  { name: 'idx_tasks_priority', table: 'tasks', columns: 'priority' },
  
  // 代理表索引
  { name: 'idx_agents_name', table: 'agents', columns: 'name' },
  { name: 'idx_agents_role', table: 'agents', columns: 'role' },
  
  // 技能表索引
  { name: 'idx_skills_agent_status', table: 'skills', columns: 'agent_id, status' },
  { name: 'idx_skills_proficiency', table: 'skills', columns: 'proficiency DESC' },
  
  // 成就表索引
  { name: 'idx_achievements_agent_rarity', table: 'achievements', columns: 'agent_id, rarity' },
  { name: 'idx_achievements_earned', table: 'achievements', columns: 'earned_at DESC' },
  
  // 项目表索引
  { name: 'idx_projects_status_progress', table: 'projects', columns: 'status, progress' },
];

/**
 * 创建性能优化索引
 */
export function createPerformanceIndexes(): void {
  const db = getDb();
  
  for (const index of PERFORMANCE_INDEXES) {
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${index.columns})`);
      console.log(`✅ 创建索引: ${index.name}`);
    } catch (error) {
      console.error(`❌ 创建索引失败 ${index.name}:`, error);
    }
  }
  
  console.log('✅ 所有性能索引创建完成');
}

/**
 * 查看当前索引
 */
export function listIndexes(): Array<{ name: string; table: string; columns: string }> {
  const db = getDb();
  const indexes = db.prepare(`
    SELECT name, tbl_name as table, sql 
    FROM sqlite_master 
    WHERE type = 'index' AND name LIKE 'idx_%'
  `).all() as any[];
  
  return indexes.map(idx => ({
    name: idx.name,
    table: idx.table,
    columns: idx.sql?.match(/\((.*)\)/)?.[1] || 'unknown'
  }));
}

/**
 * 分析查询性能
 */
export function analyzeQuery(query: string): any {
  const db = getDb();
  try {
    const plan = db.prepare(`EXPLAIN QUERY PLAN ${query}`).all();
    return plan;
  } catch (error) {
    return { error: String(error) };
  }
}

// ============================================================
// 优化查询 - 避免N+1问题
// ============================================================

export interface AgentWithTasks extends Agent {
  tasks: Task[];
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  };
}

export interface AgentFullDetails extends Agent {
  tasks: Task[];
  skills: Skill[];
  achievements: Achievement[];
  projects: Project[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    completionRate: number;
    totalSkills: number;
    masteredSkills: number;
    learningSkills: number;
    totalAchievements: number;
    rareAchievements: number;
  };
}

/**
 * 获取代理完整详情（单次查询，避免N+1）
 */
export function getAgentFullDetails(agentId: string): AgentFullDetails | null {
  const db = getDb();
  
  // 1. 获取代理基本信息
  const agentRow = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
  if (!agentRow) return null;
  
  const agent: Agent = {
    ...agentRow,
    skills: JSON.parse(agentRow.skills || '[]'),
    meta: JSON.parse(agentRow.meta || '{}')
  };
  
  // 2. 批量获取关联数据
  const tasks = db.prepare(`
    SELECT * FROM tasks WHERE agent_id = ? ORDER BY created_at DESC
  `).all(agentId) as any[];
  
  const skills = db.prepare(`
    SELECT * FROM skills WHERE agent_id = ? ORDER BY proficiency DESC, created_at DESC
  `).all(agentId) as any[];
  
  const achievements = db.prepare(`
    SELECT * FROM achievements WHERE agent_id = ? ORDER BY earned_at DESC
  `).all(agentId) as any[];
  
  // 3. 获取参与的项目（通过任务关联）
  const projectIds = db.prepare(`
    SELECT DISTINCT project_id FROM tasks WHERE agent_id = ? AND project_id IS NOT NULL
  `).all(agentId).map((row: any) => row.project_id);
  
  let projects: Project[] = [];
  if (projectIds.length > 0) {
    const placeholders = projectIds.map(() => '?').join(',');
    projects = db.prepare(`
      SELECT * FROM projects WHERE id IN (${placeholders})
    `).all(...projectIds).map((row: any) => ({
      ...row,
      team_members: JSON.parse(row.team_members || '[]'),
      meta: JSON.parse(row.meta || '{}')
    })) as Project[];
  }
  
  // 4. 计算统计信息
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t: any) => t.status === 'completed').length,
    inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
    pending: tasks.filter((t: any) => t.status === 'pending').length
  };
  
  const skillStats = {
    total: skills.length,
    mastered: skills.filter((s: any) => s.status === 'mastered').length,
    learning: skills.filter((s: any) => s.status === 'learning').length
  };
  
  const achievementStats = {
    total: achievements.length,
    rare: achievements.filter((a: any) => ['rare', 'epic', 'legendary'].includes(a.rarity)).length
  };
  
  return {
    ...agent,
    tasks: tasks.map((t: any) => ({
      ...t,
      meta: JSON.parse(t.meta || '{}')
    })),
    skills: skills.map((s: any) => ({
      ...s,
      meta: JSON.parse(s.meta || '{}')
    })),
    achievements: achievements.map((a: any) => ({
      ...a,
      meta: JSON.parse(a.meta || '{}')
    })),
    projects,
    stats: {
      totalTasks: taskStats.total,
      completedTasks: taskStats.completed,
      inProgressTasks: taskStats.inProgress,
      pendingTasks: taskStats.pending,
      completionRate: taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0,
      totalSkills: skillStats.total,
      masteredSkills: skillStats.mastered,
      learningSkills: skillStats.learning,
      totalAchievements: achievementStats.total,
      rareAchievements: achievementStats.rare
    }
  };
}

/**
 * 批量获取多个代理的详情（使用IN查询避免N+1）
 */
export function getAgentsFullDetails(agentIds: string[]): AgentFullDetails[] {
  if (agentIds.length === 0) return [];
  
  const db = getDb();
  const placeholders = agentIds.map(() => '?').join(',');
  
  // 1. 批量获取所有代理基本信息
  const agents = db.prepare(`
    SELECT * FROM agents WHERE id IN (${placeholders})
  `).all(...agentIds).map((row: any) => ({
    ...row,
    skills: JSON.parse(row.skills || '[]'),
    meta: JSON.parse(row.meta || '{}')
  })) as Agent[];
  
  // 2. 批量获取所有任务
  const tasks = db.prepare(`
    SELECT * FROM tasks WHERE agent_id IN (${placeholders}) ORDER BY created_at DESC
  `).all(...agentIds).map((row: any) => ({
    ...row,
    meta: JSON.parse(row.meta || '{}')
  })) as Task[];
  
  // 3. 批量获取所有技能
  const skills = db.prepare(`
    SELECT * FROM skills WHERE agent_id IN (${placeholders}) ORDER BY proficiency DESC
  `).all(...agentIds).map((row: any) => ({
    ...row,
    meta: JSON.parse(row.meta || '{}')
  })) as Skill[];
  
  // 4. 批量获取所有成就
  const achievements = db.prepare(`
    SELECT * FROM achievements WHERE agent_id IN (${placeholders}) ORDER BY earned_at DESC
  `).all(...agentIds).map((row: any) => ({
    ...row,
    meta: JSON.parse(row.meta || '{}')
  })) as Achievement[];
  
  // 5. 组装数据
  return agents.map(agent => {
    const agentTasks = tasks.filter(t => t.agent_id === agent.id);
    const agentSkills = skills.filter(s => s.agent_id === agent.id);
    const agentAchievements = achievements.filter(a => a.agent_id === agent.id);
    
    const taskStats = {
      total: agentTasks.length,
      completed: agentTasks.filter(t => t.status === 'completed').length,
      inProgress: agentTasks.filter(t => t.status === 'in_progress').length,
      pending: agentTasks.filter(t => t.status === 'pending').length
    };
    
    return {
      ...agent,
      tasks: agentTasks,
      skills: agentSkills,
      achievements: agentAchievements,
      projects: [], // 简化处理
      stats: {
        totalTasks: taskStats.total,
        completedTasks: taskStats.completed,
        inProgressTasks: taskStats.inProgress,
        pendingTasks: taskStats.pending,
        completionRate: taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0,
        totalSkills: agentSkills.length,
        masteredSkills: agentSkills.filter(s => s.status === 'mastered').length,
        learningSkills: agentSkills.filter(s => s.status === 'learning').length,
        totalAchievements: agentAchievements.length,
        rareAchievements: agentAchievements.filter(a => ['rare', 'epic', 'legendary'].includes(a.rarity || 'common')).length
      }
    };
  });
}

// ============================================================
// 优化的统计查询
// ============================================================

export interface OptimizedStats {
  totalAgents: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  totalProjects: number;
  activeProjects: number;
  totalAchievements: number;
  taskCompletionRate: number;
  agentStats: Array<{
    agentId: string;
    agentName: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    completionRate: number;
    totalAchievements: number;
    totalSkills: number;
    masteredSkills: number;
  }>;
}

/**
 * 优化的统计查询（单次查询获取所有数据）
 */
export function getOptimizedStats(): OptimizedStats {
  const db = getDb();
  
  // 使用单次聚合查询获取所有统计信息
  const result = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM agents) as totalAgents,
      (SELECT COUNT(*) FROM tasks) as totalTasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completedTasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as inProgressTasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pendingTasks,
      (SELECT COUNT(*) FROM projects) as totalProjects,
      (SELECT COUNT(*) FROM projects WHERE status = 'active') as activeProjects,
      (SELECT COUNT(*) FROM achievements) as totalAchievements
  `).get() as any;
  
  // 获取代理统计（使用LEFT JOIN优化）
  const agentStats = db.prepare(`
    SELECT 
      a.id as agentId,
      a.name as agentName,
      COUNT(DISTINCT t.id) as totalTasks,
      COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completedTasks,
      COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as inProgressTasks,
      COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pendingTasks,
      COUNT(DISTINCT ac.id) as totalAchievements,
      COUNT(DISTINCT s.id) as totalSkills,
      COUNT(DISTINCT CASE WHEN s.status = 'mastered' THEN s.id END) as masteredSkills
    FROM agents a
    LEFT JOIN tasks t ON a.id = t.agent_id
    LEFT JOIN achievements ac ON a.id = ac.agent_id
    LEFT JOIN skills s ON a.id = s.agent_id
    GROUP BY a.id, a.name
    ORDER BY a.created_at DESC
  `).all() as any[];
  
  return {
    totalAgents: result.totalAgents,
    totalTasks: result.totalTasks,
    completedTasks: result.completedTasks,
    inProgressTasks: result.inProgressTasks,
    pendingTasks: result.pendingTasks,
    totalProjects: result.totalProjects,
    activeProjects: result.activeProjects,
    totalAchievements: result.totalAchievements,
    taskCompletionRate: result.totalTasks > 0 
      ? Math.round((result.completedTasks / result.totalTasks) * 100) 
      : 0,
    agentStats: agentStats.map(stat => ({
      agentId: stat.agentId,
      agentName: stat.agentName,
      totalTasks: stat.totalTasks || 0,
      completedTasks: stat.completedTasks || 0,
      inProgressTasks: stat.inProgressTasks || 0,
      pendingTasks: stat.pendingTasks || 0,
      completionRate: stat.totalTasks > 0 
        ? Math.round((stat.completedTasks / stat.totalTasks) * 100) 
        : 0,
      totalAchievements: stat.totalAchievements || 0,
      totalSkills: stat.totalSkills || 0,
      masteredSkills: stat.masteredSkills || 0
    }))
  };
}

// ============================================================
// 批量操作
// ============================================================

/**
 * 批量创建任务
 */
export function batchCreateTasks(tasks: Array<Omit<Task, 'id' | 'created_at'>>): Task[] {
  const db = getDb();
  const now = new Date().toISOString();
  
  const insert = db.prepare(`
    INSERT INTO tasks (id, title, agent_id, category, project_id, priority, status, created_at, completed_at, description, estimated_hours, actual_hours, meta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const createdTasks: Task[] = [];
  
  db.transaction(() => {
    for (const task of tasks) {
      const id = `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
      insert.run(
        id,
        task.title,
        task.agent_id,
        task.category || 'general',
        task.project_id || null,
        task.priority || 'medium',
        task.status || 'pending',
        now,
        task.status === 'completed' ? now : null,
        task.description || null,
        task.estimated_hours || null,
        task.actual_hours || null,
        JSON.stringify(task.meta || {})
      );
      
      createdTasks.push({
        ...task,
        id,
        created_at: now,
        completed_at: task.status === 'completed' ? now : null,
        category: task.category || 'general',
        priority: (task.priority || 'medium') as Task['priority'],
        status: (task.status || 'pending') as Task['status'],
        meta: task.meta || {}
      } as Task);
    }
  })();
  
  return createdTasks;
}

/**
 * 批量更新任务状态
 */
export function batchUpdateTaskStatus(
  taskIds: string[], 
  status: Task['status']
): number {
  const db = getDb();
  const now = new Date().toISOString();
  const completedAt = status === 'completed' ? now : null;
  
  const placeholders = taskIds.map(() => '?').join(',');
  const result = db.prepare(`
    UPDATE tasks 
    SET status = ?, completed_at = ?
    WHERE id IN (${placeholders})
  `).run(status, completedAt, ...taskIds);
  
  return result.changes;
}

// ============================================================
// 性能分析工具
// ============================================================

export interface PerformanceReport {
  timestamp: string;
  indexes: Array<{ name: string; table: string; columns: string }>;
  tableSizes: Array<{ name: string; rowCount: number }>;
  slowQueries: string[];
}

/**
 * 生成性能报告
 */
export function generatePerformanceReport(): PerformanceReport {
  const db = getDb();
  
  const indexes = listIndexes();
  
  const tableSizes = [
    { name: 'agents', query: 'SELECT COUNT(*) as count FROM agents' },
    { name: 'tasks', query: 'SELECT COUNT(*) as count FROM tasks' },
    { name: 'projects', query: 'SELECT COUNT(*) as count FROM projects' },
    { name: 'skills', query: 'SELECT COUNT(*) as count FROM skills' },
    { name: 'achievements', query: 'SELECT COUNT(*) as count FROM achievements' }
  ].map(({ name, query }) => ({
    name,
    rowCount: (db.prepare(query).get() as any).count
  }));
  
  return {
    timestamp: new Date().toISOString(),
    indexes,
    tableSizes,
    slowQueries: [] // SQLite没有内置慢查询日志
  };
}
