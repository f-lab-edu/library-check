import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Request, UploadedFile, UseInterceptors, } from '@nestjs/common';
import { ProjectService } from './project.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { PackageJsonPipe } from 'src/pipes/package-json.pipe';
import { ProjectDetailResponseDto, ProjectResponseDto } from './dto/project-response.dto';



@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('scan')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  async scanProject(
    @UploadedFile(PackageJsonPipe) file: Express.Multer.File,
    @Request() req: any,
  ): Promise<{projectId: number; message: string}> {
    const userId = req.user?.id || 1;

    const createProjectDto = this.projectService.parsePackageJson(
      file.buffer,
    );

    const project = await this.projectService.createProject(
      userId,
      createProjectDto,
    );

    this.projectService.scanVulnerabilities(project.id)
    .catch((error) => 
    console.error(`Background scan failed for project ${project.id}`, error),
    );

    return {
      projectId: project.id,
      message: 'Project created and vulnerability scan started',
    };
  }

  @Get()
  async findAll(@Request() req: any): Promise<ProjectResponseDto[]> {
    const userId = req.user?.id || 1;
    return this.projectService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ProjectDetailResponseDto> {
    const userId = req.user?.id || 1;
    return this.projectService.findOneByUser(id, userId);
  }
  //
}
