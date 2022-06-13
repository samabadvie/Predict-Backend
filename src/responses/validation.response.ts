import { ApiProperty } from '@nestjs/swagger';

class Validation {
  @ApiProperty({
    example: 'email value (EMAIL_VALUE) does not exists',
    type: 'string',
    description: 'error message on the failed property',
  })
  message!: string;

  @ApiProperty({
    example: 'email',
    type: 'string',
    description: 'name of the field that failed',
  })
  field!: string;

  @ApiProperty({
    example: 'Exists',
    type: 'string',
    description: 'name of validation rule that failed',
  })
  validation!: string;
}

export class ValidationResponse {
  @ApiProperty({
    default: true,
    type: 'boolean',
    description: 'determine if there was an error or not',
  })
  error!: boolean;

  @ApiProperty({
    default: 'Please provide all required fields',
    type: 'string',
    description: 'Error message',
  })
  message!: string;

  @ApiProperty({
    default: 'VALIDATION',
    type: 'string',
    description: 'Error type',
  })
  type!: string;

  @ApiProperty({
    description: 'Array of error happened in request',
    type: Validation,
    isArray: true,
  })
  validation!: Validation[];
}
