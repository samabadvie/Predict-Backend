import { ApiProperty } from '@nestjs/swagger';

export class UploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to be uploaded',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file!: any;
}
