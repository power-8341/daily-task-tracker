/**
 * GET /api/projects/[id]
 * 获取单个项目详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepo, TaskRepo, initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = ProjectRepo.findById(params.id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 获取项目相关任务
    const { tasks } = TaskRepo.findAll({ project: params.id });

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        tasks
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * 更新项目信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // 检查项目是否存在
    const existingProject = ProjectRepo.findById(params.id);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 验证状态
    if (body.status) {
      const validStatuses = ['planning', 'active', 'completed', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // 验证进度
    if (body.progress !== undefined && (body.progress < 0 || body.progress > 100)) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    const updatedProject = ProjectRepo.update(params.id, {
      name: body.name,
      description: body.description,
      status: body.status,
      team_members: body.team_members,
      progress: body.progress,
      end_date: body.end_date,
      meta: body.meta
    });

    return NextResponse.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * 删除项目
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingProject = ProjectRepo.findById(params.id);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const deleted = ProjectRepo.delete(params.id);
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
