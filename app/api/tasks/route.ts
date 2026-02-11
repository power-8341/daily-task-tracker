/**
 * GET /api/tasks
 * 获取任务列表（支持多种筛选条件）
 * 
 * Query参数:
 * - agentId: 按代理ID筛选
 * - agentName: 按代理名称筛选（支持模糊匹配）
 * - project: 按项目ID筛选
 * - status: 按状态筛选 (pending, in_progress, completed, cancelled)
 * - category: 按类别筛选
 * - priority: 按优先级筛选 (low, medium, high, urgent)
 * - dateFrom: 开始日期 (ISO格式)
 * - dateTo: 结束日期 (ISO格式)
 * - sortBy: 排序字段 (created_at, updated_at, priority, status)
 * - sortOrder: 排序方向 (asc, desc)
 * - page: 页码 (默认 1)
 * - pageSize: 每页数量 (默认 100, 最大 500)
 */

import { NextRequest } from 'next/server';
import { TaskRepo, AgentRepo, initDatabase, Task } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse,
  ValidationError,
  validatePagination,
  validateEnum,
  withErrorHandler 
} from '@/lib/api-utils';

// 初始化数据库
initDatabase();

// 有效的枚举值
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'priority', 'status', 'title'] as const;
const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * 解析和验证筛选参数
 */
function parseFilters(searchParams: URLSearchParams) {
  const filters: {
    agentId?: string;
    agentName?: string;
    project?: string;
    status?: Task['status'];
    category?: string;
    priority?: Task['priority'];
    dateFrom?: string;
    dateTo?: string;
    sortBy: typeof VALID_SORT_FIELDS[number];
    sortOrder: typeof VALID_SORT_ORDERS[number];
    page: number;
    pageSize: number;
  } = {
    sortBy: (searchParams.get('sortBy') as any) || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '100', 10)
  };

  // 代理筛选 - 支持按ID或名称筛选
  const agentId = searchParams.get('agentId');
  const agentName = searchParams.get('agentName');
  
  if (agentId) {
    filters.agentId = agentId;
  }
  
  if (agentName) {
    // 如果提供了代理名称，查找对应的代理ID
    const agent = AgentRepo.findByName(agentName);
    if (agent) {
      filters.agentId = agent.id;
    } else {
      // 如果找不到代理，返回空结果
      return { ...filters, agentNotFound: true };
    }
  }

  // 其他筛选参数
  if (searchParams.get('project')) {
    filters.project = searchParams.get('project')!;
  }
  
  if (searchParams.get('status')) {
    filters.status = searchParams.get('status') as Task['status'];
  }
  
  if (searchParams.get('category')) {
    filters.category = searchParams.get('category')!;
  }
  
  if (searchParams.get('priority')) {
    filters.priority = searchParams.get('priority') as Task['priority'];
  }
  
  if (searchParams.get('dateFrom')) {
    filters.dateFrom = searchParams.get('dateFrom')!;
  }
  
  if (searchParams.get('dateTo')) {
    filters.dateTo = searchParams.get('dateTo')!;
  }

  return filters;
}

/**
 * 验证筛选参数
 */
function validateFilters(filters: ReturnType<typeof parseFilters>): void {
  // 验证分页参数
  validatePagination(filters.page, filters.pageSize, 500);

  // 验证状态值
  if (filters.status) {
    validateEnum(filters.status, [...VALID_STATUSES], 'status');
  }

  // 验证优先级值
  if (filters.priority) {
    validateEnum(filters.priority, [...VALID_PRIORITIES], 'priority');
  }

  // 验证排序字段
  if (filters.sortBy && !VALID_SORT_FIELDS.includes(filters.sortBy)) {
    throw new ValidationError(
      `sortBy 必须是以下值之一: ${VALID_SORT_FIELDS.join(', ')}`,
      { field: 'sortBy', validValues: [...VALID_SORT_FIELDS], received: filters.sortBy }
    );
  }

  // 验证排序方向
  if (filters.sortOrder && !VALID_SORT_ORDERS.includes(filters.sortOrder)) {
    throw new ValidationError(
      `sortOrder 必须是以下值之一: ${VALID_SORT_ORDERS.join(', ')}`,
      { field: 'sortOrder', validValues: [...VALID_SORT_ORDERS], received: filters.sortOrder }
    );
  }

  // 验证日期格式
  if (filters.dateFrom && isNaN(Date.parse(filters.dateFrom))) {
    throw new ValidationError('dateFrom 必须是有效的ISO日期格式');
  }
  if (filters.dateTo && isNaN(Date.parse(filters.dateTo))) {
    throw new ValidationError('dateTo 必须是有效的ISO日期格式');
  }
}

/**
 * 获取任务列表处理器
 */
async function getTasksHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 解析筛选参数
  const filters = parseFilters(searchParams);
  
  // 验证参数
  validateFilters(filters);
  
  // 如果按名称筛选但找不到代理，返回空结果
  if ('agentNotFound' in filters && filters.agentNotFound) {
    return createSuccessResponse(
      [],
      { page: filters.page, pageSize: filters.pageSize, total: 0 }
    );
  }
  
  // 查询任务
  const result = TaskRepo.findAll({
    agent: filters.agentId,
    project: filters.project,
    status: filters.status,
    category: filters.category,
    priority: filters.priority,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    page: filters.page,
    pageSize: filters.pageSize
  });

  // 根据排序参数排序结果
  let sortedTasks = [...result.tasks];
  if (filters.sortBy) {
    sortedTasks.sort((a, b) => {
      const rawA = a[filters.sortBy as keyof Task];
      const rawB = b[filters.sortBy as keyof Task];
      
      // 处理null值，转换为字符串进行比较
      const aVal = (rawA === null || rawA === undefined) ? '' : String(rawA);
      const bVal = (rawB === null || rawB === undefined) ? '' : String(rawB);
      
      if (filters.sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  return createSuccessResponse(sortedTasks, {
    page: filters.page,
    pageSize: filters.pageSize,
    total: result.total
  });
}

export const GET = withErrorHandler(getTasksHandler);

/**
 * POST /api/tasks
 * 创建新任务
 * 
 * Body参数:
 * - title: 任务标题 (必填)
 * - agent_id: 代理ID (必填)
 * - category: 类别
 * - project_id: 项目ID
 * - priority: 优先级 (默认 medium)
 * - status: 状态 (默认 pending)
 * - description: 描述
 * - estimated_hours: 预计工时
 * - actual_hours: 实际工时
 */
async function createTaskHandler(request: NextRequest) {
  const body = await request.json();

  // 验证必填字段
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    throw new ValidationError('title 是必填字段且不能为空字符串');
  }

  if (!body.agent_id || typeof body.agent_id !== 'string') {
    throw new ValidationError('agent_id 是必填字段');
  }

  // 验证代理是否存在
  const agent = AgentRepo.findById(body.agent_id);
  if (!agent) {
    throw new ValidationError(`代理ID "${body.agent_id}" 不存在`, { field: 'agent_id' });
  }

  // 验证优先级
  if (body.priority) {
    validateEnum(body.priority, [...VALID_PRIORITIES], 'priority');
  }

  // 验证状态
  if (body.status) {
    validateEnum(body.status, [...VALID_STATUSES], 'status');
  }

  // 验证数值字段
  if (body.estimated_hours !== undefined && (typeof body.estimated_hours !== 'number' || body.estimated_hours < 0)) {
    throw new ValidationError('estimated_hours 必须是非负数');
  }
  if (body.actual_hours !== undefined && (typeof body.actual_hours !== 'number' || body.actual_hours < 0)) {
    throw new ValidationError('actual_hours 必须是非负数');
  }

  const task = TaskRepo.create({
    title: body.title.trim(),
    agent_id: body.agent_id,
    category: body.category,
    project_id: body.project_id,
    priority: body.priority,
    status: body.status,
    description: body.description,
    estimated_hours: body.estimated_hours,
    actual_hours: body.actual_hours,
    meta: body.meta
  });

  return createSuccessResponse(task);
}

export const POST = withErrorHandler(createTaskHandler);

/**
 * DELETE /api/tasks/batch
 * 批量删除任务
 * 
 * Body参数:
 * - ids: 任务ID数组 (必填)
 */
export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await request.json();
    
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      throw new ValidationError('ids 必须是非空数组');
    }

    let deletedCount = 0;
    for (const id of body.ids) {
      if (TaskRepo.delete(id)) {
        deletedCount++;
      }
    }

    return createSuccessResponse({ deletedCount });
  })(request);
}
