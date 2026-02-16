import { HttpException } from '@nestjs/common';

export class AppError extends HttpException {
  constructor(statusCode: number, message: string) {
    super(message, statusCode);
  }
}
