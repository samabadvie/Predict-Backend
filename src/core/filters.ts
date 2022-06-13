import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IFlatError } from './interfaces';
import { Response } from 'express';
import { FlowException, ValidationException, ConflictException } from 'core/exceptions';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedErrorFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    if (exception.message.includes('duplicate key')) {
      host.switchToHttp().getResponse<Response>().status(400).json({
        message: `مقدار ورودی تکراریست`,
        error: true,
        type: 'FLOWEXCEPTION',
        error_type: 'query',
      });
    } else {
      throw exception;
    }
  }
}

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(exception.getStatus()).json(exception.getResponse());
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const extra: Record<string, unknown> = { type: host.getType() };
    switch (extra.type) {
      case 'http':
        const ctx = host.switchToHttp();
        extra.request = ctx.getRequest();
        extra.response = ctx.getResponse();
        break;
      case 'ws':
        const wtx = host.switchToWs();
        extra.client = wtx.getClient();
        extra.data = wtx.getData();
        break;
      default:
        extra.data = 'unknown type!';
        break;
    }

    console.log(exception);

    try {
      const validation = (exception.getResponse() as { errors: IFlatError[] })['errors'];
      host
        .switchToHttp()
        .getResponse<Response>()
        .status(exception.getStatus())
        .json({
          error: true,
          message: validation[0].message,
          type: exception.message,
          error_type: extra.type,
          validation: (exception.getResponse() as { errors: IFlatError[] })['errors'],
        });
    } catch (e) {
      host.switchToHttp().getResponse<Response>().status(500).json({
        error: true,
        message: exception.message,
        type: 'INTERNAL',
        error_type: extra.type,
      });
    }
  }
}

@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(401).json({
      error: true,
      message: exception.message,
    });
  }
}

@Catch(FlowException)
export class FlowExceptionFilter implements ExceptionFilter {
  catch(exception: FlowException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(400)
      .json({
        error: true,
        message: 'FlowException message',
        type: 'FlowException',
        validation: (exception.getResponse() as { errors: IFlatError[] })['errors'],
      });
  }
}

@Catch(ConflictException)
export class ConflictExceptionFilter implements ExceptionFilter {
  catch(exception: ConflictException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(409)
      .json({
        error: true,
        message: 'ConflictException message',
        type: 'ConflictException',
        validation: (exception.getResponse() as { errors: IFlatError[] })['errors'],
      });
  }
}

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(400)
      .json({
        error: true,
        message: 'Please provide all required fields',
        type: 'VALIDATION',
        validation: (exception.getResponse() as { errors: IFlatError[] })['errors'],
      });
  }
}

@Catch(BadRequestException)
export class BadRequestExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(exception.getStatus()).json(exception.getResponse());
  }
}
