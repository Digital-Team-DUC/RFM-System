import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class AppController {
  @Get()
  @ApiOperation({ summary: 'System health check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
