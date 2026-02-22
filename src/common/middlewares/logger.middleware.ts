import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';

    this.logger.log(
      `[Incoming] -> ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    req['startTime'] = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - req['startTime'];
      const statusCode = res.statusCode;

      const resMessage = `[RESPONSE] -> ${method} ${originalUrl} - ${statusCode} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(resMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(resMessage);
      } else {
        this.logger.log(resMessage);
      }
    });

    next();
  }
}
