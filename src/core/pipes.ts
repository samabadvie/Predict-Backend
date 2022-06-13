import { PipeTransform, Injectable, Type, ArgumentMetadata } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationException } from './exceptions';
import { IFlatError, IErrors } from './interfaces';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  static _types: Set<Type<unknown>> = new Set([String, Boolean, Number, Object, Array]);

  async transform<T>(value: T, { metatype }: ArgumentMetadata): Promise<T> {
    if (metatype == undefined || ValidationPipe._types.has(metatype)) {
      return value;
    }
    const obj = plainToClass(metatype, value);
    const errors = await validate(obj);
    if (errors.length > 0) {
      throw new ValidationException(this.reduceErrors(errors));
    }
    return obj;
  }

  private extract(e: Required<ValidationError>, parent: string[]): IErrors[] {
    return Object.keys(e.constraints).map((validation: string) => ({
      message: e.constraints[validation],
      field: [...parent, e.property],
      validation: validation,
    }));
  }

  private flattenErrors(errors: ValidationError[], parent: string[]): IErrors[] {
    return errors
      .map((e) =>
        e.constraints === undefined && e.children
          ? this.flattenErrors(e.children, [...parent, e.property])
          : this.extract(e as Required<ValidationError>, parent),
      )
      .reduce((t, i) => t.concat(i), []);
  }

  private reduceErrors(e: ValidationError[]): IFlatError[] {
    return this.flattenErrors(e, []).map((i) => ({
      ...i,
      field: i.field.join('.'),
    }));
  }
}
