import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Dependency } from './entities/dependency.entity';
import { Vulnerability } from './entities/vulnerability.entity';
import { HttpModule } from '@nestjs/axios';
import { PackageJsonPipe } from 'src/pipes/package-json.pipe';
import { OsvBatchService } from 'src/osv-api/osv-batch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Dependency, Vulnerability]),
    HttpModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, OsvBatchService, PackageJsonPipe],
  exports: [ProjectService],

})
export class ProjectModule {}
