/**
 * GET /api/stats
 * 获取系统统计数据（优化版本）
 * 
 * 返回数据:
 * - totalAgents: 代理总数
 * - totalTasks: 任务总数
 * - completedTasks: 已完成任务数
 * - inProgressTasks: 进行中任务数
 * - pendingTasks: 待处理任务数
 * - totalProjects: 项目总数
 * - activeProjects: 活跃项目数
 * - totalAchievements: 成就总数
 * - taskCompletionRate: 任务完成率
 * - agentStats: 各代理的统计详情（包含技能统计）
 * 
 * Query参数:
 * - detailed: 是否返回详细信息 (默认 true)
 */

import { NextRequest } from 'next/server';
import { initDatabase } from '@/lib/db';
import { getOptimizedStats } from '@/lib/db-optimized';
import { 
  createSuccessResponse, 
  withErrorHandler 
} from '@/lib/api-utils';

// 初始化数据库
initDatabase();

/**
 * 获取统计信息处理器
 */
async function getStatsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') !== 'false';

  // 使用优化的统计查询
  const stats = getOptimizedStats();

  // 如果不需要详细信息，简化返回
  if (!detailed) {
    const { agentStats, ...simpleStats } = stats;
    return createSuccessResponse(simpleStats);
  }

  return createSuccessResponse(stats);
}

export const GET = withErrorHandler(getStatsHandler);

/**
 * 响应示例:
 * 
 * {
 *   "success": true,
 *   "data": {
 *     "totalAgents": 5,
 *     "totalTasks": 100,
 *     "completedTasks": 80,
 *     "inProgressTasks": 15,
 *     "pendingTasks": 5,
 *     "totalProjects": 3,
 *     "activeProjects": 2,
 *     "totalAchievements": 20,
 *     "taskCompletionRate": 80,
 *     "agentStats": [
 *       {
 *         "agentId": "agent_xxx",
 *         "agentName": "代码哥",
 *         "totalTasks": 25,
 *         "completedTasks": 20,
 *         "inProgressTasks": 3,
 *         "pendingTasks": 2,
 *         "completionRate": 80,
 *         "totalAchievements": 5,
 *         "totalSkills": 8,
 *         "masteredSkills": 5
 *       }
 *     ]
 *   },
 *   "meta": {
 *     "timestamp": "2026-02-11T01:52:00.000Z",
 *     "requestId": "xxxx-xxxx"
 *   }
 * }
 */
