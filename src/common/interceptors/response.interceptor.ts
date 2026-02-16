import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type ResponsePayload<T> = {
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((payload: T | ResponsePayload<T>) => {
        if (
          typeof payload === 'object' &&
          payload !== null &&
          ('success' in payload || 'statusCode' in payload)
        ) {
          return payload;
        }

        if (
          typeof payload === 'object' &&
          payload !== null &&
          ('data' in payload || 'message' in payload)
        ) {
          const normalized = payload;
          return {
            success: true,
            message: normalized.message ?? 'Success',
            data: normalized.data ?? null,
            meta: normalized.meta,
          };
        }

        return {
          success: true,
          message: 'Success',
          data: payload,
        };
      }),
    );
  }
}
