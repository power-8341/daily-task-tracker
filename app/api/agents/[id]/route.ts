/**
 * GET /api/agents/[id]
 * 获取单个代理详情
 * 
 * Path参数:
 * - id: 代理ID
 * 
 * Query参数:
 * - withStats: 是否包含统计信息 (默认 true)
 */

import { NextRequest } from 'next/server';
import { AgentRepo, initDatabase } from '@/lib/db';
import { 
  createSuccessResponse, 
  NotFoundError,
  withErrorHandler 
} from '@/lib/api-utils';

// 初始化数据库
initDatabase();

/**
 * 获取单个代理处理器
 */
async function getAgentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const withStats = searchParams.get('withStats') !== 'false'; // 默认true

  const agent = AgentRepo.findById(params.id);
  
  if (!agent) {
    throw new NotFoundError('代理', params.id);
  }

  // 获取代理统计信息
  let data: any = { ...agent };
  if (withStats) {
    const stats = AgentRepo.getStats(params.id);
    data.stats = stats;
  }

  return createSuccessResponse(data);
}

export const GET = withErrorHandler(getAgentHandler as any);

/**
 * PUT /api/agents/[id]
 * 更新代理信息
 * 
 * Body参数: (所有字段可选)
 * - name: 代理名称
 * - avatar: 头像
 * - role: 角色
 * - description: 描述
 * - skills: 技能数组
 * - personality: 个性
 * - meta: 扩展字段
 */
async function updateAgentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  // 检查代理是否存在
  const existingAgent = AgentRepo.findById(params.id);
  if (!existingAgent) {
    throw new NotFoundError('代理', params.id);
  }

  // 如果修改名称，检查是否与其他代理冲突
  if (body.name && body.name !== existingAgent.name) {
    const trimmedName = body.name.trim();
    if (!trimmedName) {
      throw new Error('name 不能为空字符串');
    }
    
    const nameConflict = AgentRepo.findByName(trimmedName);
    if (nameConflict && nameConflict.id !== params.id) {
      const error: any = new Error(`代理名称 "${trimmedName}" 已被使用`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_NAME';
      throw error;
    }
    body.name = trimmedName;
  }

  // 验证skills格式
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills)) {
      throw new Error('skills 必须是数组');
    }
    for (const skill of body.skills) {
      if (!skill.skill_name || typeof skill.proficiency !== 'number') {
        throw new Error('skill 必须包含 skill_name 和 proficiency');
      }
    }
  }

  const updatedAgent = AgentRepo.update(params.id, {
    name: body.name,
    avatar: body.avatar,
    role: body.role,
    description: body.description,
    skills: body.skills,
    personality: body.personality,
    meta: body.meta
  });

  return createSuccessResponse(updatedAgent);
}

export const PUT = withErrorHandler(updateAgentHandler as any);

/**
 * DELETE /api/agents/[id]
 * 删除代理
 */
async function deleteAgentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existingAgent = AgentRepo.findById(params.id);
  if (!existingAgent) {
    throw new NotFoundError('代理', params.id);
  }

  const deleted = AgentRepo.delete(params.id);
  
  if (deleted) {
    return createSuccessResponse({ 
      message: '代理删除成功',
      deletedId: params.id 
    });
  } else {
    throw new Error('删除代理失败');
  }
}

export const DELETE = withErrorHandler(deleteAgentHandler as any);
