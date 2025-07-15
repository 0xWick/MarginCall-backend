import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { Signal, SignalType, ComparisonOperator } from './signal.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('signals')
export class SignalsController {
  constructor(
    private signalsService: SignalsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createSignalDto: {
    ticker: string;
    companyName: string;
    name: string;
    description: string;
    leftMetric: string;
    operator: ComparisonOperator;
    rightMetric: string;
    signalType: SignalType;
    initialValues?: Record<string, any>;
  }, @Request() req) {
    return this.signalsService.createSignal({
      ...createSignalDto,
      userId: req.user.userId,
    });
  }

  @Post(':id/update')
  async updateSignalData(@Param('id') id: number, @Body() data: {
    ticker: string;
    companyName: string;
    lastUpdated: string;
    metrics: Record<string, any>;
  }) {
    return this.signalsService.processSignalUpdate(+id, data);
  }

  @Post(':id/trigger')
  async recordTrigger(@Param('id') id: number, @Body() triggerDto: {
    triggerData: Record<string, any>;
    triggeredAt: string;
  }) {
    return this.signalsService.recordTrigger(id, triggerDto.triggerData);
  }



  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMySignals(@Request() req) {
    return this.signalsService.findByUser(req.user.userId);
  }

  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleSignal(@Param('id') id: number) {
    return this.signalsService.toggleActive(id);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  async getSignalHistory(@Param('id') id: number) {
    return this.signalsService.getSignalHistory(id);
  }

  @Get('available-metrics/:ticker')
  @UseGuards(JwtAuthGuard)
  async getAvailableMetrics(@Param('ticker') ticker: string) {
    return this.signalsService.getAvailableMetrics(ticker);
  }

  @Get('operators')
  @UseGuards(JwtAuthGuard)
  async getOperators() {
    return Object.values(ComparisonOperator);
  }

  @Get('types')
  @UseGuards(JwtAuthGuard)
  async getSignalTypes() {
    return Object.values(SignalType);
  }
} 