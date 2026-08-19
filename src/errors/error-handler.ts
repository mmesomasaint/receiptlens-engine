// src/errors/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from './app-error';
import { config } from '../config';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      error = new AppError('A record with this identifier already exists.', 409);
    } else if (err.code === 'P2025') {
      error = new AppError('Requested record not found.', 404);
    } else {
      error = new AppError('Database operation error.', 400);
    }
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal Server Execution Fault.';

  if (statusCode === 500) {
    logger.error('CRITICAL INTERNAL FAULT:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(config.env === 'development' && {
      stack: err.stack,
      rawError: err,
    }),
  });
};
