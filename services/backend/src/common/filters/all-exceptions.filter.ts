import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  LoggerService,
} from "@nestjs/common";
import { Request, Response } from "express";
import { createLogger } from "@vibely/shared";

const logger: LoggerService = createLogger("ExceptionFilter");

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as { message?: string }).message ||
          exception.message
        : "Internal server error";

    // Never log request bodies or tokens. Log only safe metadata.
    logger.error(`Request failed`, {
      status,
      path: request.url,
      method: request.method,
      error: exception instanceof Error ? exception.message : "unknown",
    });

    response.status(status).json({
      success: false,
      message,
    });
  }
}
