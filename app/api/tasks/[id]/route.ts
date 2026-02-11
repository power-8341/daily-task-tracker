/**
 * GET /api/tasks/[id]
 * 获取单个任务详情
 * 
 * Path参数:
 * - id: 任务ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskRepo, initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = TaskRepo.findById(params.id);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]
 * 更新任务信息
 * 
 * 支持部分更新，只更新提供的字段
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // 检查任务是否存在
    const existingTask = TaskRepo.findById(params.id);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 验证优先级
    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // 验证状态
    if (body.status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const updatedTask = TaskRepo.update(params.id, {
      title: body.title,
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

    return NextResponse.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * 删除任务
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingTask = TaskRepo.findById(params.id);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const deleted = TaskRepo.delete(params.id);
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
