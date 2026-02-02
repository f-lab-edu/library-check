export class ProjectResponseDto {
  id: number;
  name: string;
  userId: number;
  scanStatus: string;
  createdAt: Date;
  updatedAt: Date;
  dependencyCount?: number;
  vulnerabilityCount?: number;
}

export class ProjectDetailResponseDto extends ProjectResponseDto {
  dependencies: DependencyResponseDto[];
  vulnerabilities: VulnerabilityResponseDto[];
}

export class DependencyResponseDto {
  id: number;
  name: string;
  version: string;
  type: string;
  createdAt: Date;
}

export class VulnerabilityResponseDto {
  id: number;
  packageName: string;
  packageVersion: string;
  severity: string;
  osvResponse: Record<string, any>;
  scannedAt: Date;
}