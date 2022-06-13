import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

export class UploadResponseSchema {
  @ApiProperty({
    type: 'string',
    description: 'Uploaded file name',
    example: 'image.jpg',
  })
  name!: string;

  @ApiProperty({
    description: 'Path to view uploaded file',
    type: 'string',
    example: 'http://site.com/image.jpg',
  })
  path!: string;

  userData?: UserEntity;
}
