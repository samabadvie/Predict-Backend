// import { Request } from 'express';
import { UserEntity } from '../modules/users/entities/user.entity';

interface Response<T> {
  data: T;
}

interface IFlatError {
  message: string;
  field: string;
  validation: string;
}

interface IErrors {
  message: string;
  field: string[];
  validation: string;
}

interface Error {
  type: string;
  message?: string;
  validation?: IFlatError[];
  error_type?: string | undefined;
  code?: number;
}

interface IError {
  error?: Error;
  data?: {
    key: string;
  };
}

export { Error, IError, IFlatError, Response, IErrors };
export interface ClassType<T> {
  new (args?: Partial<T>): T;
}

export interface IReq extends Request {
  user: UserEntity;
}

export interface IResponse {
  count?: number;
  error?: boolean;
  message?: string;
  status?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  type?: 'FLOWEXCEPTION' | 'INTERNAL' | 'VALIDATION';
  validation?: IFlatError[];
}
