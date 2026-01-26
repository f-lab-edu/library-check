import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class OsvPackageDto {
  name: string;

  ecosystem: string;
}

export class OsvQueryDto {
  package: OsvPackageDto;

  version: string;
}

export class OsvBatchQueryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OsvQueryDto)
  queries: OsvQueryDto[];
}
