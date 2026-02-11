/**
 * API统一错误处理和响应工具
 * 
 * 提供统一的错误处理、响应格式和性能监控
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// 错误类型定义
// ============================================================

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', `${resource}${id ? ` "${id}"` : ''} 不存在`, 404);
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = '未授权访问') {
    super('UNAUTHORIZED', message, 401);
  }
}

// ============================================================
// 统一响应格式
// ============================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

// 生成请求ID
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  pagination?: { page: number; pageSize: number; total: number }
): NextResponse<APIResponse<T>> {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };

  if (pagination) {
    response.meta!.pagination = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.pageSize)
    };
  }

  return NextResponse.json(response);
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  error: APIError | Error | unknown,
  defaultMessage: string = '服务器内部错误'
): NextResponse<APIResponse> {
  let apiError: APIError;

  if (error instanceof APIError) {
    apiError = error;
  } else if (error instanceof Error) {
    apiError = new APIError('INTERNAL_ERROR', error.message || defaultMessage, 500);
  } else {
    apiError = new APIError('INTERNAL_ERROR', defaultMessage, 500);
  }

  const response: APIResponse = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details && { details: apiError.details })
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };

  return NextResponse.json(response, { status: apiError.statusCode });
}

// ============================================================
// 性能监控
// ============================================================

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  queryCount: number;
  queryTime: number;
}

export function createPerformanceMetrics(): PerformanceMetrics {
  return {
    startTime: Date.now(),
    queryCount: 0,
    queryTime: 0
  };
}

export function endPerformanceMetrics(metrics: PerformanceMetrics): PerformanceMetrics {
  metrics.endTime = Date.now();
  metrics.duration = metrics.endTime - metrics.startTime;
  return metrics;
}

export function addQueryMetrics(metrics: PerformanceMetrics, queryTime: number): void {
  metrics.queryCount++;
  metrics.queryTime += queryTime;
}

// ============================================================
// 参数验证工具
// ============================================================

export function validatePagination(
  page: number,
  pageSize: number,
  maxPageSize: number = 500
): { page: number; pageSize: number } {
  if (isNaN(page) || page < 1) {
    throw new ValidationError('page 必须是大于0的数字');
  }
  if (isNaN(pageSize) || pageSize < 1) {
    throw new ValidationError('pageSize 必须是大于0的数字');
  }
  if (pageSize > maxPageSize) {
    throw new ValidationError(`pageSize 不能超过 ${maxPageSize}`);
  }
  return { page, pageSize };
}

export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `缺少必填字段: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

export function validateEnum<T extends string>(
  value: string | undefined,
  validValues: T[],
  fieldName: string
): void {
  if (value !== undefined && !validValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} 必须是以下值之一: ${validValues.join(', ')}`,
      { field: fieldName, validValues, received: value }
    );
  }
}

// ============================================================
// 统一的API处理器包装器
// ============================================================

export type APIHandler = (request: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * 包装API处理器，统一错误处理
 */
export function withErrorHandler(handler: APIHandler): APIHandler {
  return async (request: NextRequest, ...args: any[]) => {
    const metrics = createPerformanceMetrics();
    
    try {
      const response = await handler(request, ...args);
      
      // 添加性能头信息（开发环境）
      if (process.env.NODE_ENV === 'development') {
        endPerformanceMetrics(metrics);
        response.headers.set('X-Response-Time', `${metrics.duration}ms`);
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse(error);
    }
  };
}
