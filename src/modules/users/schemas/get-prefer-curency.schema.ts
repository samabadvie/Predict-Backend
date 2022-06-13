import { ApiProperty } from '@nestjs/swagger';

export class GetPreferCurrencySchema {
  @ApiProperty({
    type: 'string',
    description: 'name of currency',
    example: 'USD',
  })
  name!: string;

  description!: string;

  image_path!: string;
}
