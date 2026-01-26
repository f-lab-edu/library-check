import { osv } from 'src/config/app.config';
import { Module } from '@nestjs/common';
import { OsvBatchService } from './osv-batch.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: osv.timeout,
      maxRedirects: 5,
    }),
  ],
  providers: [OsvBatchService],
  exports: [OsvBatchService],
})
export class OsvBatchModule {}
