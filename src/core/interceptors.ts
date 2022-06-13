import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from './interfaces';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResponse(res: any): any {
  if (!res) return;

  if (res.error || res.data) {
    return res;
  }
  return { data: res };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    // return next.handle().pipe(map(data => mapResponse(data, context.switchToHttp().getRequest().i18nLang)));
    return next.handle().pipe(map(mapResponse));
  }
}
