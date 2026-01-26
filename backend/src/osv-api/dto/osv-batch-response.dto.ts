export class OsvVulnerabilityDto {
  id: string;

  summary?: string;

  details?: string;

  serverity?: any[];

  affected?: any[];

  references?: any[];
}

export class OsvBatchResultDto {
  vulns: OsvVulnerabilityDto[];
}

export class OsvBatchResponseDto {
  results: OsvBatchResultDto[];
}
