import { IsNotEmpty, IsString } from "class-validator";

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  dependencies: DependencyItemDto[];
}

export class DependencyItemDto {
  @IsString()
  @IsNotEmpty()
  name:string;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  type: 'production' | 'development';
}
