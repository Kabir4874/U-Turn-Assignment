import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isDev = process.env.NODE_ENV === 'development';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong!';
    let errorSources: Array<{ path: string; message: string }> = [];

    if (exception instanceof NotFoundException) {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Route Not Found';
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseObject = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        if (Array.isArray(responseObject.message)) {
          message = 'Validation Error';
          errorSources = responseObject.message.map((msg) => ({
            path: 'body',
            message: msg,
          }));
        } else {
          message = responseObject.message ?? responseObject.error ?? message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(statusCode).json({
      success: false,
      path: request.url,
      message,
      errorSources,
      error: isDev ? exception : undefined,
      stack: isDev && exception instanceof Error ? exception.stack : undefined,
    });
  }
}
