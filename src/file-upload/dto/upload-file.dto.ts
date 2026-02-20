import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFilteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
