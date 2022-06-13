/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { ClassType } from './interfaces';
import { Connection, In, Not, ObjectType } from 'typeorm';
import { ConnectionsEnum } from './connections.enum';

export class Holder {
  private static connections: Record<ConnectionsEnum, Connection>;

  public static setConnections(c: Record<ConnectionsEnum, Connection>): void {
    Holder.connections = c;
  }

  static getConnection(type: ConnectionsEnum): Connection {
    return Holder.connections[type];
  }
}

type RunnerFn = (object: unknown, propertyName: string) => void;

type RunnerType = (
  name: string,
  connectio: ConnectionsEnum,
  fn: (conn: Connection, val: unknown, opt: ValidationArguments) => boolean | Promise<boolean>,
  defaultMessageFunction: (args: ValidationArguments) => string,
  validationOptions?: ValidationOptions,
) => RunnerFn;

export const runner: RunnerType = (name, connection, fn, defaultMessageFunction, validationOptions?) =>
  function (object, propertyName): void {
    registerDecorator({
      name: name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (object as any).constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate: (value: unknown, opt: ValidationArguments): boolean | Promise<boolean> =>
          fn(Holder.getConnection(connection), value, opt),
        defaultMessage: (args: ValidationArguments): string => {
          return defaultMessageFunction(args);
        },
      },
    });
  };

type ExistsType = (
  entity: ObjectType<unknown>,
  column: string,
  connection: ConnectionsEnum,
  _with?: string,
  where?: { [k: string]: unknown },
) => RunnerFn;

export const Exists: ExistsType = (entity, column, connection, _with?, where?) =>
  runner(
    'Exists',
    connection,
    async (conn, value, validationObject) => {
      if (Number.isNaN(value) || value == 0) return false;

      column = column || validationObject.property;
      if (_with) {
        const withValue: string = (validationObject.object as Record<string, unknown>)[_with] as string;
        where = {
          ...where,
          [_with]: Array.isArray(withValue) ? In(withValue) : withValue,
        };
      }
      if (Array.isArray(value) && typeof value[0] === 'object') {
        value = value.map((i) => i[column]);
      }
      const records = await conn.getRepository(entity).find({
        select: [column],
        where: {
          ...where,
          [column]: Array.isArray(value) ? In(value) : value,
        },
        take: 1,
      });
      return records.length > 0;
    },
    (args) => {
      return `${args.value} not exist in "${column}" column!`;
    },
  );

type UniqueType = (
  entity: ObjectType<unknown>,
  column: string,
  connection: ConnectionsEnum,
  ignoreSelf?: boolean,
) => RunnerFn;
export const Unique: UniqueType = (entity, column, connection, ignoreSelf = false) =>
  runner(
    'Unique',
    connection,
    async (conn, value, validationObject) => {
      column = column || validationObject.property;
      const records = await conn.getRepository(entity).find({
        select: [column],
        where: {
          [column]: typeof value === 'string' ? value.trim().toLowerCase() : value,
          ...(ignoreSelf
            ? {
                id: Not((validationObject.object as Record<string, unknown>)['id']),
              }
            : {}),
        },
        take: 1,
      });
      return records.length === 0;
    },
    (args) => {
      return `${args.property} value (${JSON.stringify(args.value)}) must be unique`;
    },
  );

type RawUniqueType = (
  entity: ObjectType<unknown>,
  column: string,
  connection: ConnectionsEnum,
  ignoreSelf?: boolean,
  valueAccessor?: (v: unknown) => unknown,
) => RunnerFn;
export const RawUnique: RawUniqueType = (entity, column, connection: ConnectionsEnum, ignoreSelf?, valueAccessor?) =>
  runner(
    'RawUnique',
    connection,
    async (conn, value, { object }) => {
      const record = conn.getRepository(entity).createQueryBuilder().where('deleted_at IS NULL');

      if (valueAccessor) {
        value = valueAccessor(value);
      }
      record.andWhere(`${column} = :column`, { column: value });

      if (ignoreSelf && (object as Record<string, number>).id) {
        record.andWhere('id != :id', { id: (object as Record<string, number>).id });
      }

      const instance = await record.getOne();
      return instance == undefined;
    },
    (args) => {
      return `${args.property} value (${JSON.stringify(args.value)}) must be unique`;
    },
  );

type RawExistsType = (entity: ObjectType<unknown>, column: string, connection: ConnectionsEnum) => RunnerFn;
export const RawExists: RawExistsType = (entity, column, connection) =>
  runner(
    'RawExists',
    connection,
    async (conn, value, _) => {
      const records = await conn
        .getRepository(entity)
        .createQueryBuilder()
        .where(`${column} = :value AND deleted_at IS NULL`, { value: value })
        .getOne();

      return records != undefined;
    },
    (args) => {
      return `${column} value (${JSON.stringify(args.value)}) does not exists `;
    },
  );

type OnlyType = (check: string, field: string, list: string[], connection: ConnectionsEnum) => RunnerFn;
export const Only: OnlyType = (check, field, list, connection) =>
  runner(
    'Only',
    connection,
    (_, __, { object }) => {
      if (list.includes((object as Record<string, string>)[field])) {
        return true;
      } else {
        if (!(object as Record<string, unknown>)[check]) return true;
      }

      return false;
    },
    () => {
      return `${check} can have value only ${field} be on of ${list} list`;
    },
  );

type CustomRequiredWhenType = (check: string, field: string, list: string[], connection: ConnectionsEnum) => RunnerFn;
export const CustomRequiredWhen: CustomRequiredWhenType = (check, field, list, connection) =>
  runner(
    'CustomRequiredWhen',
    connection,
    (_, value, { object }) => {
      if (!list.includes((object as Record<string, string>)[field])) {
        return true;
      }
      const _value = (object as Record<string, unknown>)[check];
      if (_value == null) {
        return false;
      }
      if (!(value as string | number).toString().trim()) {
        return false;
      }
      return true;
    },
    () => {
      return `${check} is required`;
    },
  );

export const IsOnlyDate = (connection: ConnectionsEnum = ConnectionsEnum.MYSQL): RunnerFn =>
  runner(
    'IsOnlyDate',
    connection,
    (__, value, _) => {
      if (isNaN(value as number)) {
        // invalid date is NaN
        return false;
      }
      return (value as Date).getHours() + (value as Date).getMinutes() + (value as Date).getSeconds() === 0;
    },
    () => {
      return `provide only date like YYYY-MM-DD`;
    },
  );

export function ToClass<U>(klass: ClassType<U>, isList = false): MethodDecorator {
  const t = isList ? (r: Partial<U>[]): U[] => r.map((u) => new klass(u)) : (r: Partial<U>): U => new klass(r);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (__: unknown, _: string | symbol, descriptor: TypedPropertyDescriptor<any>): void {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]): U | U[] | Promise<U | U[]> {
      const result = originalMethod.apply(this, args);
      const isPromise =
        !!result && (typeof result === 'object' || typeof result === 'function') && typeof result.then === 'function';
      return isPromise
        ? result.then((data: Partial<U> | Partial<U>[]) => t(data as Partial<U> & Partial<U>[]))
        : t(result);
    };
  };
}
