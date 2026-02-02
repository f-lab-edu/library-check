import { OsvBatchService } from './../osv-api/osv-batch.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateProjectDto, DependencyItemDto } from './dto/create-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { Dependency } from './entities/dependency.entity';
import { Vulnerability } from './entities/vulnerability.entity';
import { PackageVersionDto } from 'src/osv-api/dto/package-version.dto';
import { ProjectDetailResponseDto, ProjectResponseDto } from './dto/project-response.dto';


@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Dependency)
    private readonly dependencyRepository: Repository<Dependency>,
    @InjectRepository(Vulnerability)
    private readonly vulnerabilityRepository: Repository<Vulnerability>,
    private readonly osvBatchService: OsvBatchService,
  ){}

  parsePackageJson(fileBuffer: Buffer): CreateProjectDto {
    const content = fileBuffer.toString('utf-8').replace(/^\uFEFF/, '');
    const packageJson = JSON.parse(content);

    const name = packageJson.name || 'Unnamed Project';
    const dependencies = this.extractDependencies(
      packageJson.dependencies,
      'production',
    );

    const devDependencies = this.extractDependencies(
      packageJson.devDependencies,
      'development'
    );

    const mergedDependencies = this.mergeDependencies(
      dependencies,
      devDependencies,
    )
    
    return {
      name,
      dependencies: mergedDependencies,
    };
  }

  private extractDependencies(
    deps: Record<string, string> | undefined,
    type: 'production' | 'development',
  ): DependencyItemDto[] {
    if (!deps) return [];

    return Object.entries(deps).map(([name, version]) => ({
      name,
      version: this.cleanVersion(version),
      type,
    }));
  }

  private cleanVersion(version: string): string{
    return version.replace(/^[\^~>=<]/, '');
  }

  private mergeDependencies(
    production: DependencyItemDto[],
    development: DependencyItemDto[],
  ): DependencyItemDto[] {
    const map = new Map<string, DependencyItemDto>();

    production.forEach((dep) => {
      const key = `${dep.name}@${dep.version}`;
      map.set(key, dep);
    });

    development.forEach((dep) => {
      const key = `${dep.name}@${dep.version}`;
      if (!map.has(key)) {
        map.set(key, dep);
      }
    });

    return Array.from(map.values());
  }

  async createProject(
    userId: number,
    createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    const project = this.projectRepository.create({
      name: createProjectDto.name,
      userId,
      scanStatus: 'pending',
    });

    const savedProject = await this.projectRepository.save(project);

    const dependencies = createProjectDto.dependencies.map((dep) => 
    this.dependencyRepository.create({
      projectId: savedProject.id,
      name: dep.name,
      version: dep.version,
      type: dep.type,
    }),
  );

  await this.dependencyRepository.save(dependencies);

  return savedProject;
  }

  async scanVulnerabilities(projectId: number): Promise<void> {
    await this.updateScanStatus(projectId, 'scanning');

    try {
      const dependencies = await this.dependencyRepository.find({
        where: {projectId}
      });

      const packages: PackageVersionDto[] = dependencies.map((dep) => ({
        name: dep.name,
        version: dep.version,
        ecosystem: 'npm',
      }));

      const results = await this.osvBatchService.queryVulnerabilities(packages);

      const vulnerabilities = results
      .filter((result) => result.vulnerabilities.length > 0)
      .flatMap((result) => result.vulnerabilities.map((vuln) => 
      this.vulnerabilityRepository.create({
        projectId,
        packageName: result.package.name,
        packageVersion: result.package.version,
        osvResponse: vuln,
        severity: this.extractSeverity(vuln),
      }),
    ),
  );

  if (vulnerabilities.length > 0) {
    await this.vulnerabilityRepository.save(vulnerabilities);
  }

  await this.updateScanStatus(projectId, 'completed');
  this.logger.log(`Scan completed for project ${projectId}: ${vulnerabilities.length} vulnerabilities found`
      );
    } catch (error) {
      this.logger.error(`Scan failed for project ${projectId}`, error);
      await this.updateScanStatus(projectId, 'failed');
      throw error;
    }
  }

  private extractSeverity(osvResponse:any): string {
    if (osvResponse.severity) {
      return Array.isArray(osvResponse.severity)
      ? osvResponse.severity[0]?.type || 'UNKNOWN'
      : osvResponse.severity.type || 'UNKNOWN';
    }
    return 'UNKNOWN';
  }

  private async updateScanStatus(
    projectId: number,
    status: string,
  ): Promise<void> {
    await this.projectRepository.update(projectId, { scanStatus: status });
  }

  async findAllByUser(userId: number): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository
    .createQueryBuilder('project')
    .leftJoin('project.dependencies', 'dependency')
    .leftJoin('project.vulnerabilities', 'vulnerability')
    .where('project.userId = :userId', {userId})
    .select([
      'project.id',
      'project.name',
      'project.userId',
      'project.scanStatus',
      'project.createdAt',
      'project.updatedAt',
    ])
    .addSelect('COUNT(DISTINCT dependency.id)', 'dependencyCount')
    .addSelect('COUNT(DISTINCT vulnerability.id)', 'vulnerabilityCount')
    .groupBy('project.id')
    .getRawMany();

    return projects.map((project) => ({
      id: project.project_id,
      name: project.project_name,
      userId: project.project_userId,
      scanStatus: project.project_scanStatus,
      createdAt: project.project_createdAt,
      updatedAt: project.project_updatedAt,
      dependencyCount: parseInt(project.dependencyCount, 10),
      vulnerabilityCount: parseInt(project.vulnerabilityCount, 10)
    }));
  }

  async findOneByUser(
    projectId: number,
    userId: number
  ): Promise<ProjectDetailResponseDto>{
    const project = await this.projectRepository.findOne({
      where: {id: projectId, userId },
      relations: ['dependencies, vulnerabilities'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      id: project.id,
      name: project.name,
      userId: project.userId,
      scanStatus: project.scanStatus,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      dependencyCount: project.dependencies.length,
      vulnerabilityCount: project.vulnerabilities.length,
      dependencies: project.dependencies.map((dep) => ({
        id: dep.id,
        name: dep.name,
        version: dep.version,
        type: dep.type,
        createdAt: dep.createdAt,
      })),
      vulnerabilities: project.vulnerabilities.map((vuln) => ({
        id: vuln.id,
        packageName: vuln.packageName,
        packageVersion: vuln.packageVersion,
        severity: vuln.severity,
        osvResponse: vuln.osvResponse,
        scannedAt: vuln.scannedAt,
      }))
    }
  }
  
}
