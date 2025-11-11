import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
    @Public()
    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    healthCheck() {
        return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        };
    }

    @Public()
    @Get('api')
    @ApiOperation({ summary: 'API health check' })
    apiHealthCheck() {
        return {
        status: 'ok',
        message: 'Brainiac Quiz API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        };
    }
}