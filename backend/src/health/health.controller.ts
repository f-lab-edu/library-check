import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  private readonly healthCheckName: string;
  private readonly healthCheckUrl: string;

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private configService: ConfigService,
  ) {
    this.healthCheckName = this.configService.get<string>(
      'HEALTH_CHECK_NAME',
      'Local_Health_Check',
    );
    this.healthCheckUrl = this.configService.get<string>(
      'HEALTH_CHECK_URL',
      'http://localhost:3000/ping',
    );
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck(this.healthCheckName, this.healthCheckUrl),
    ]);
  }
}
