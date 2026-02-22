/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const userId = request?.user?.id || 'unauthenticated';

    this.logger.log(
      `${method} ${url} | User: ${userId} | User-Agent ${userAgent}`,
    );

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.log(
            `[${method} ${url} | ${duration}ms | Response size - ${JSON.stringify(data)?.length || 0} bytes]`,
          );
        },
        error: (err) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.log(
            `[${method} ${url} | ${duration}ms | Error: ${err.message}]`,
          );
        },
      }),
    );
  }
}
