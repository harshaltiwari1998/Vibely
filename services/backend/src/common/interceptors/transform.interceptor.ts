import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiEnvelope<unknown>> {
    return next.handle().pipe(
      map((data) => ({ success: true, data } as ApiEnvelope<unknown>)),
    );
  }
}
