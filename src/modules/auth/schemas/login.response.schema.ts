import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'modules/users/entities/user.entity';

export class LoginResponseSchema {
  @ApiProperty({
    type: 'string',
    description: 'JWT token generated for front-end',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Inhhc2hheWFyc2hhQGdtYWlsLmNvbSIsImlkIjo4Niwicm9sZSI6ImJhc2ljIiwiZXhwaXJlcyI6MzYwMDAwMDAwMDAsImlhdCI6MTYxNDk0NDQxNywiZXhwIjozNzYxNDk0NDQxN30.f0qZB6YPZio2IF6Z_DtO_tWxdNywXSJIrprlX1x6jAM',
  })
  token!: string;

  userData?: UserEntity;
}
