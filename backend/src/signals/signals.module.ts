import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { Signal } from './signal.entity';
import { SignalHistory } from './signal-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Signal, SignalHistory]),
  ],
  controllers: [SignalsController],
  providers: [SignalsService],
  exports: [SignalsService],
})
export class SignalsModule {} 