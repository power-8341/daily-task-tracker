/**
 * GET /api/agents
 * 获取所有代理列表（支持分页）
 * 
 * Query参数:
 * - page: 页码 (默认 1)
 * - pageSize: 每页数量 (默认 100, 最大 500)
 * - withStats: 是否包含统计信息 (默认 false)
 * - role: 按角色筛选
 */

import { NextRequest } from 'next/server';
import { AgentRepo, initDatabase } from '@/lib/db';
import { getOptimizedStats } from '@/lib/db-optimized';
import { 
  createSuccessResponse, 
  validatePagination,
  withErrorHandler 
} from '@/lib/api-utils';

// 初始化数据库
initDatabase();

/**
 * 获取代理列表处理器
 */
async function getAgentsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
  const withStats = searchParams.get('withStats') === 'true';
  const role = searchParams.get('role');

  // 验证参数
  validatePagination(page, pageSize, 500);

  // 获取代理列表
  const result = AgentRepo.findAll({ page, pageSize });
  
  // 按角色筛选（如果指定）
  let agents = result.agents;
  if (role) {
    agents = agents.filter(a => a.role?.toLowerCase().includes(role.toLowerCase()));
  }
  
  // 如果需要统计信息
  let responseData: any = { agents, total: result.total };
  if (withStats) {
    const stats = getOptimizedStats();
    responseData.stats = stats;
  }

  return createSuccessResponse(responseData, {
    page,
    pageSize,
    total: result.total
  });
}

export const GET = withErrorHandler(getAgentsHandler);

/**
 * POST /api/agents
 * 创建新代理
 * 
 * Body参数:
 * - name: 代理名称 (必填, 唯一)
 * - role: 角色 (必填)
 * - avatar: 头像/表情符号
 * - description: 描述
 * - skills: 技能数组 [{ skill_name, proficiency, status }]
 * - personality: 个性特点
 * - meta: 扩展字段
 */
async function createAgentHandler(request: NextRequest) {
  const body = await request.json();
  
  // 验证必填字段
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw new Error('name 是必填字段且不能为空字符串');
  }

  if (!body.role || typeof body.role !== 'string' || body.role.trim() === '') {
    throw new Error('role 是必填字段且不能为空字符串');
  }

  const trimmedName = body.name.trim();

  // 检查名称是否已存在
  const existingAgent = AgentRepo.findByName(trimmedName);
  if (existingAgent) {
    const error: any = new Error(`代理名称 "${trimmedName}" 已存在`);
    error.statusCode = 409;
    error.code = 'DUPLICATE_NAME';
    throw error;
  }

  // 验证skills格式
  let skills = body.skills;
  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      throw new Error('skills 必须是数组');
    }
    // 验证每个skill的格式
    for (const skill of skills) {
      if (!skill.skill_name || typeof skill.proficiency !== 'number') {
        throw new Error('skill 必须包含 skill_name 和 proficiency');
      }
    }
  }

  const agent = AgentRepo.create({
    name: trimmedName,
    avatar: body.avatar,
    role: body.role.trim(),
    description: body.description,
    skills: skills,
    personality: body.personality,
    meta: body.meta
  });

  return createSuccessResponse(agent);
}

export const POST = withErrorHandler(createAgentHandler);
