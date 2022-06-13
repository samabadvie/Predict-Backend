import { ApiProperty } from '@nestjs/swagger';

export class UnauthorizedResponse {
  @ApiProperty({
    default: true,
    type: 'boolean',
    description: 'determine if there was an error or not',
  })
  error!: boolean;

  @ApiProperty({
    default: 'Unauthorized',
    type: 'string',
    description: 'Error message',
  })
  message!: string;
}
