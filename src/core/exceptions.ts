import { HttpException } from '@nestjs/common';
import { IFlatError } from 'core/interfaces';

export class FlowException extends HttpException {
  constructor(errors: IFlatError[]) {
    super({ errors }, 400);
  }
}

export class ValidationException extends HttpException {
  constructor(errors: IFlatError[]) {
    super({ errors }, 401);
  }
}

export class ConflictException extends HttpException {
  constructor(errors: IFlatError[]) {
    super({ errors }, 409);
  }
}
