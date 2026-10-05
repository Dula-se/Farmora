import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse<T>['meta']
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errorDetail?: string
): Response {
  const body: ApiResponse<null> = {
    success: false,
    message,
    error: errorDetail,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(body);
}
