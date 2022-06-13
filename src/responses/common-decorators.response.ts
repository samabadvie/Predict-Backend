/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UnauthorizedResponse } from './unauthorized.response';
import { ValidationResponse } from './validation.response';

export function CommonApiDecorators() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'You are not authorized to view this resource',
      type: UnauthorizedResponse,
    }),
    ApiBadRequestResponse({
      description: 'validation failed',
      type: ValidationResponse,
    }),
  );
}
