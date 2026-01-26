import { IsNotEmpty, IsString } from 'class-validator';

export class PackageVersionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  @IsNotEmpty()
  ecosystem: string;
}
