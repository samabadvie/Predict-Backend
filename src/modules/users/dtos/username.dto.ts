import { IsString, IsOptional, IsArray } from 'class-validator';

export class usernameDto {
  @IsOptional()
  @IsString()
  username!: string;
}

export class usernameListDto {
  @IsOptional()
  @IsArray()
  username_list!: usernameDto[];
}
