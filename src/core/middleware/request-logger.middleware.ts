import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP'); // Use a specific context for HTTP logs

  use(request: Request, response: Response, next: NextFunction) {
    const { method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '-';
    const ip = request.ip || request.connection.remoteAddress || '-';

    const startTime = process.hrtime();

    // Log start of request
    // this.logger.log(`--> ${method} ${originalUrl} - ${userAgent} ${ip}`);

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || '-';
      const diff = process.hrtime(startTime);
      const responseTime = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to ms

      // Log end of request with status code and response time
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${responseTime.toFixed(2)}ms - ${contentLength} - ${userAgent} ${ip}`
      );
    });

    next();
  }
} 