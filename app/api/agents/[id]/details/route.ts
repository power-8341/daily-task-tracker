/**
 * GET /api/agents/:id/details
 * 获取代理完整详情
 * 
 * 返回数据:
 * - 代理基本信息（名字、角色、描述）
 * - 技能列表
 * - 任务统计
 * - 成就列表
 * - 参与的项目
 * 
 * Path参数:
 * - id: 代理ID
 */

import { NextRequest } from 'next/server';
import { initDatabase } from '@/lib/db';
import { getAgentFullDetails } from '@/lib/db-optimized';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  NotFoundError,
  withErrorHandler 
} from '@/lib/api-utils';

// 初始化数据库
initDatabase();

/**
 * 获取代理详情处理器
 */
async function getAgentDetailsHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  // 获取代理完整详情（优化查询，避免N+1）
  const agentDetails = getAgentFullDetails(id);
  
  if (!agentDetails) {
    throw new NotFoundError('代理', id);
  }
  
  return createSuccessResponse(agentDetails);
}

// 导出带错误处理的GET处理器
export const GET = withErrorHandler(getAgentDetailsHandler as any);

/**
 * 代理详情响应示例:
 * 
 * {
 *   "success": true,
 *   "data": {
 *     "id": "agent_xxx",
 *     "name": "代码哥",
 *     "avatar": "👨‍💻",
 *     "role": "全栈工程师",
 *     "description": "负责后端开发和系统架构",
 *     "skills": [
 *       { "skill_name": "TypeScript", "proficiency": 9, "status": "mastered" },
 *       { "skill_name": "Node.js", "proficiency": 8, "status": "practicing" }
 *     ],
 *     "tasks": [
 *       { "id": "task_xxx", "title": "优化API性能", "status": "completed", ... }
 *     ],
 *     "achievements": [
 *       { "id": "ach_xxx", "badge_name": "速度之星", "rarity": "rare", ... }
 *     ],
 *     "projects": [
 *       { "id": "proj_xxx", "name": "成长网站V2", ... }
 *     ],
 *     "stats": {
 *       "totalTasks": 25,
 *       "completedTasks": 20,
 *       "inProgressTasks": 3,
 *       "pendingTasks": 2,
 *       "completionRate": 80,
 *       "totalSkills": 5,
 *       "masteredSkills": 3,
 *       "learningSkills": 2,
 *       "totalAchievements": 4,
 *       "rareAchievements": 2
 *     }
 *   },
 *   "meta": {
 *     "timestamp": "2026-02-11T01:52:00.000Z",
 *     "requestId": "xxxx-xxxx"
 *   }
 * }
 */
