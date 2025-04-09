import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  // HttpStatus // Not currently used, keep for potential future use or remove if definitively unused
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches HttpExceptions and formats the response.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let responseMessage: string | object;

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse &&
      (typeof (exceptionResponse as any).message === 'string' ||
        typeof (exceptionResponse as any).message === 'object') // Check if message is string or object
    ) {
      responseMessage = (exceptionResponse as any).message;
    } else if (typeof exceptionResponse === 'string') {
      responseMessage = exceptionResponse;
    } else {
      responseMessage = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: responseMessage,
    });
  }
} 