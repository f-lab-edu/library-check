import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FileUploadModule } from './file-upload/file-upload.module';

const ENV = process.env.NODE_ENV || 'development';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${ENV}`,
    }),
    FileUploadModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
