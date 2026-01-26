import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { osv } from '../config/app.config';
import { PackageVersionDto } from './dto/package-version.dto';
import { OsvBatchQueryDto, OsvQueryDto } from './dto/osv-batch-query.dto';
import {
  OsvBatchResponseDto,
  OsvBatchResultDto,
} from './dto/osv-batch-response.dto';
import { VulnerabilityResult } from './interfaces/vulnerability-result.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OsvBatchService {
  private readonly logger = new Logger(OsvBatchService.name);
  private readonly osvApiUrl: string;
  private readonly maxBatchSize: number;
  private readonly timeout: number;

  constructor(private readonly httpService: HttpService) {
    const { apiUrl, batchEndpoint } = osv;
    this.osvApiUrl = `${apiUrl}${batchEndpoint}`;
    this.maxBatchSize = osv.maxBatchSize;
    this.timeout = osv.timeout;

    this.logger.log(`OSV API URL: ${this.osvApiUrl}`);
    this.logger.log(`Max batch size: ${this.maxBatchSize}`);
  }

  buildBatchQuery(packages: PackageVersionDto[]): OsvBatchQueryDto {
    const queries: OsvQueryDto[] = packages.map((pkg) => ({
      package: {
        name: pkg.name,
        ecosystem: pkg.ecosystem,
      },
      version: pkg.version,
    }));
    return { queries };
  }

  splitIntoBatches(
    packages: PackageVersionDto[],
    batchSize: number,
  ): PackageVersionDto[][] {
    const batches: PackageVersionDto[][] = [];
    for (let i = 0; i < packages.length; i += batchSize) {
      batches.push(packages.slice(i, i + batchSize));
    }

    return batches;
  }

  async executeBatchQuery(
    query: OsvBatchQueryDto,
  ): Promise<OsvBatchResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<OsvBatchResponseDto>(this.osvApiUrl, query, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to execute OSV API batch query', error);
      throw error;
    }
  }

  parseVulnerabilityResults(
    packages: PackageVersionDto[],
    results: OsvBatchResultDto[],
  ): VulnerabilityResult[] {
    return packages.map((pkg, index) => ({
      package: pkg,
      vulnerabilities: results[index]?.vulns || [],
      scannedAt: new Date(),
    }));
  }

  async queryVulnerabilities(
    packages: PackageVersionDto[],
  ): Promise<VulnerabilityResult[]> {
    this.logger.log(
      `Strarting vulnerability scan for ${packages.length} packages`,
    );
    const batches = this.splitIntoBatches(packages, this.maxBatchSize);
    this.logger.log(`Split into ${batches.length} batches`);

    const allResults: VulnerabilityResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.log(
        `Processing batch ${i + 1}/${batches.length} (${batch.length} packages)`,
      );

      const query = this.buildBatchQuery(batch);
      const response = await this.executeBatchQuery(query);
      const parsed = this.parseVulnerabilityResults(batch, response.results);

      allResults.push(...parsed);
    }

    const vulnerableCount = allResults.filter(
      (r) => r.vulnerabilities.length > 0,
    ).length;

    this.logger.log(
      `Vulnerability scan completed: Found vulnerabilities in ${vulnerableCount}/${packages.length} packages`,
    );
    return allResults;
  }
}
