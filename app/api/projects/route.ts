/**
 * GET /api/projects
 * 获取项目列表
 * 
 * Query参数:
 * - status: 按状态筛选 (planning, active, completed, archived)
 * - page: 页码 (默认 1)
 * - pageSize: 每页数量 (默认 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepo, initDatabase } from '@/lib/db';

initDatabase();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '100', 10)
    };

    // 验证分页参数
    if (filters.page < 1 || filters.pageSize < 1 || filters.pageSize > 500) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // 验证状态值
    const validStatuses = ['planning', 'active', 'completed', 'archived'];
    if (filters.status && !validStatuses.includes(filters.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const result = ProjectRepo.findAll(filters);

    return NextResponse.json({
      success: true,
      data: result.projects,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * 创建新项目
 * 
 * Body参数:
 * - name: 项目名称 (必填)
 * - description: 项目描述
 * - status: 状态 (默认 planning)
 * - team_members: 团队成员ID数组
 * - progress: 进度 0-100
 * - start_date: 开始日期
 * - end_date: 结束日期
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // 验证状态
    const validStatuses = ['planning', 'active', 'completed', 'archived'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // 验证进度
    if (body.progress !== undefined && (body.progress < 0 || body.progress > 100)) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    const project = ProjectRepo.create({
      name: body.name,
      description: body.description,
      status: body.status,
      team_members: body.team_members,
      progress: body.progress,
      start_date: body.start_date,
      end_date: body.end_date,
      meta: body.meta
    });

    return NextResponse.json({
      success: true,
      data: project
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
