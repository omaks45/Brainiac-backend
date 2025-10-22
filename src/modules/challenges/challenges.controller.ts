
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChallengeStatus } from './schemas/challenge.schema';

@ApiTags('challenges')
@Controller('challenges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new challenge' })
  @ApiResponse({
    status: 201,
    description: 'Challenge created successfully',
    type: ChallengeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createChallenge(
    @CurrentUser() user: any,
    @Body() createChallengeDto: CreateChallengeDto,
  ) {
    return this.challengesService.createChallenge(user._id, createChallengeDto);
  }

  @Patch(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({
    status: 200,
    description: 'Challenge accepted',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async acceptChallenge(@CurrentUser() user: any, @Param('id') id: string) {
    return this.challengesService.acceptChallenge(id, user._id);
  }

  @Patch(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({
    status: 200,
    description: 'Challenge declined',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async declineChallenge(@CurrentUser() user: any, @Param('id') id: string) {
    return this.challengesService.declineChallenge(id, user._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get user challenges' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ChallengeStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of challenges',
  })
  async getUserChallenges(
    @CurrentUser() user: any,
    @Query('status') status?: ChallengeStatus,
  ) {
    return this.challengesService.getUserChallenges(user._id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge by ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns challenge details',
    type: ChallengeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getChallengeById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.challengesService.getChallengeById(id, user._id);
  }
}