import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signal, SignalType, ComparisonOperator } from './signal.entity';
import { SignalHistory } from './signal-history.entity';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    @InjectRepository(Signal)
    private signalsRepository: Repository<Signal>,
    @InjectRepository(SignalHistory)
    private signalHistoryRepository: Repository<SignalHistory>,
  ) {}

  async createSignal(createSignalDto: {
    userId: number;
    ticker: string;
    companyName: string;
    name: string;
    description: string;
    leftMetric: string;
    operator: ComparisonOperator;
    rightMetric: string;
    signalType: SignalType;
    initialValues?: Record<string, any>;
  }): Promise<Signal> {
    // Fetch initial values for the signal metrics
    const metrics = [createSignalDto.leftMetric];
    if (createSignalDto.signalType === SignalType.METRIC_TO_METRIC) {
      metrics.push(createSignalDto.rightMetric);
    }

    let initialValues = createSignalDto.initialValues;
    if (!initialValues) {
      try {
        initialValues = await this.fetchInitialValues(createSignalDto.ticker, metrics);
      } catch (error) {
        console.error('Failed to fetch initial values:', error);
        // Continue without initial values if fetch fails
        initialValues = {};
      }
    }

    const signal = this.signalsRepository.create({
      userId: createSignalDto.userId,
      companyTicker: createSignalDto.ticker,
      companyName: createSignalDto.companyName,
      name: createSignalDto.name,
      description: createSignalDto.description,
      leftMetric: createSignalDto.leftMetric,
      operator: createSignalDto.operator,
      rightMetric: createSignalDto.rightMetric,
      signalType: createSignalDto.signalType,
      isActive: true,
      initialValues: initialValues,
    });

    return this.signalsRepository.save(signal);
  }

  async findByUser(userId: number): Promise<Signal[]> {
    return this.signalsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateData: Partial<Signal>): Promise<Signal> {
    await this.signalsRepository.update(id, updateData);
    return this.signalsRepository.findOne({ where: { id } });
  }

  async toggleActive(id: number): Promise<Signal> {
    const signal = await this.signalsRepository.findOne({ where: { id } });
    if (!signal) {
      throw new Error('Signal not found');
    }
    
    signal.isActive = !signal.isActive;
    return this.signalsRepository.save(signal);
  }

  async processSignalUpdate(signalId: number, data: {
    ticker: string;
    companyName: string;
    lastUpdated: string;
    metrics: Record<string, any>;
  }): Promise<{ updated: boolean; triggered: boolean }> {
    this.logger.log(`[TRIGGER] Processing signal update for signalId: ${signalId}`);
    this.logger.log(`[TRIGGER] Received data: ${JSON.stringify(data, null, 2)}`);
    
    // Get the signal
    const signal = await this.signalsRepository.findOne({ where: { id: signalId } });
    if (!signal) {
      this.logger.error(`[TRIGGER] Signal not found for id: ${signalId}`);
      throw new Error('Signal not found');
    }

    this.logger.log(`[TRIGGER] Found signal: ${JSON.stringify({
      id: signal.id,
      leftMetric: signal.leftMetric,
      operator: signal.operator,
      rightMetric: signal.rightMetric,
      signalType: signal.signalType,
      isActive: signal.isActive
    }, null, 2)}`);

    // Update signal with latest data
    await this.signalsRepository.update(signalId, {
      lastUpdated: new Date(),
      lastData: data as any,
    });
    this.logger.log(`[TRIGGER] Updated signal ${signalId} with latest data`);

    // Check if signal should be triggered
    const shouldTrigger = await this.checkSignalTrigger(signal, data);
    this.logger.log(`[TRIGGER] Signal ${signalId} should trigger: ${shouldTrigger}`);
    
    if (shouldTrigger) {
      this.logger.log(`[TRIGGER] Creating trigger record for signal ${signalId}`);
      // Create trigger record
      await this.recordTrigger(signalId, data);
      
      this.logger.log(`[TRIGGER] Updating signal ${signalId} as triggered`);
      // Update signal as triggered
      await this.signalsRepository.update(signalId, {
        isTriggered: true,
        lastTriggeredAt: new Date(),
      });
    }

    return {
      updated: true,
      triggered: shouldTrigger,
    };
  }

  async checkSignalTrigger(signal: Signal, data: any): Promise<boolean> {
    this.logger.log(`[TRIGGER] Checking trigger for signal ${signal.id}`);
    this.logger.log(`[TRIGGER] Signal active: ${signal.isActive}`);
    
    if (!signal.isActive) {
      this.logger.log(`[TRIGGER] Signal ${signal.id} is not active, skipping trigger check`);
      return false;
    }

    const leftValue = this.extractMetricValue(signal.leftMetric, data.metrics);
    this.logger.log(`[TRIGGER] Left metric '${signal.leftMetric}' value: ${leftValue}`);
    
    let rightValue: number | null = null;

    if (signal.signalType === SignalType.METRIC_TO_METRIC) {
      rightValue = this.extractMetricValue(signal.rightMetric, data.metrics);
      this.logger.log(`[TRIGGER] Right metric '${signal.rightMetric}' value: ${rightValue}`);
    } else if (signal.signalType === SignalType.METRIC_TO_PERCENTAGE) {
      // For percentage calculations, use initial values
      const initialValue = signal.initialValues?.[signal.leftMetric];
      this.logger.log(`[TRIGGER] Initial value for '${signal.leftMetric}': ${initialValue}`);
      
      if (!initialValue) {
        this.logger.warn(`[TRIGGER] No initial value found for metric ${signal.leftMetric} in signal ${signal.id}`);
        return false;
      }
      
      const percentage = parseFloat(signal.rightMetric);
      this.logger.log(`[TRIGGER] Percentage change: ${percentage}%`);
      
      if (isNaN(percentage)) {
        this.logger.warn(`[TRIGGER] Invalid percentage value: ${signal.rightMetric}`);
        return false;
      }
      
      // Calculate the target value based on percentage change from initial value
      const targetValue = initialValue * (1 + percentage / 100);
      rightValue = targetValue;
      this.logger.log(`[TRIGGER] Calculated target value: ${targetValue} (${initialValue} + ${percentage}%)`);
    } else if (signal.signalType === SignalType.METRIC_TO_VALUE) {
      // For metric_to_value, rightMetric contains the value
      rightValue = parseFloat(signal.rightMetric);
      this.logger.log(`[TRIGGER] Right value from signal: ${rightValue}`);
    }

    if (leftValue === null || rightValue === null || isNaN(rightValue)) {
      this.logger.warn(`[TRIGGER] Invalid values - leftValue: ${leftValue}, rightValue: ${rightValue}`);
      return false;
    }

    this.logger.log(`[TRIGGER] Comparing: ${leftValue} ${signal.operator} ${rightValue}`);

    let result = false;
    switch (signal.operator) {
      case ComparisonOperator.GREATER_THAN:
        result = leftValue > rightValue;
        break;
      case ComparisonOperator.LESS_THAN:
        result = leftValue < rightValue;
        break;
      case ComparisonOperator.EQUAL:
        result = leftValue === rightValue;
        break;
      case ComparisonOperator.GREATER_THAN_EQUAL:
        result = leftValue >= rightValue;
        break;
      case ComparisonOperator.LESS_THAN_EQUAL:
        result = leftValue <= rightValue;
        break;
      default:
        this.logger.warn(`[TRIGGER] Unknown operator: ${signal.operator}`);
        return false;
    }

    this.logger.log(`[TRIGGER] Comparison result: ${result}`);
    return result;
  }

  private extractMetricValue(metric: string, financialData: any): number | null {
    this.logger.log(`[TRIGGER] Extracting metric value for: ${metric}`);
    this.logger.log(`[TRIGGER] Financial data keys: ${Object.keys(financialData)}`);
    
    // Navigate through the financial data structure
    const keys = metric.split('.');
    let value = financialData;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
        this.logger.log(`[TRIGGER] Found key '${key}', value: ${value}`);
      } else {
        this.logger.warn(`[TRIGGER] Key '${key}' not found in data`);
        return null;
      }
    }
    
    const result = typeof value === 'number' ? value : null;
    this.logger.log(`[TRIGGER] Final extracted value: ${result}`);
    return result;
  }

  async recordTrigger(signalId: number, triggerData: any): Promise<SignalHistory> {
    const history = this.signalHistoryRepository.create({
      signalId,
      triggerData,
      triggeredAt: new Date(),
    });
    
    return this.signalHistoryRepository.save(history);
  }

  async getSignalHistory(signalId: number): Promise<SignalHistory[]> {
    return this.signalHistoryRepository.find({
      where: { signalId },
      order: { triggeredAt: 'DESC' },
    });
  }

  async getActiveSignals(): Promise<Signal[]> {
    return this.signalsRepository.find({
      where: { isActive: true },
    });
  }

  async getSignalsNeedingUpdate(): Promise<Signal[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.signalsRepository.find({
      where: { 
        isActive: true,
        lastUpdated: null, // Signals that have never been updated
      },
    });
  }

  async updateSignalData(signalId: number, data: any): Promise<void> {
    await this.signalsRepository.update(signalId, {
      lastUpdated: new Date(),
      lastData: data,
    });
  }

  async getAvailableMetrics(ticker: string): Promise<any> {
    // Call Python service to get available fields
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://python-service:5001';
    
    try {
      const response = await fetch(`${pythonServiceUrl}/available-fields/${ticker}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available metrics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data; // Return the actual fields data
    } catch (error) {
      throw new Error(`Error fetching available metrics: ${error.message}`);
    }
  }

  async fetchInitialValues(ticker: string, metrics: string[]): Promise<Record<string, any>> {
    // Call Python service to get initial values
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://python-service:5001';
    
    try {
      const response = await fetch(`${pythonServiceUrl}/fetch-initial-values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker, metrics }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch initial values: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.initialValues;
    } catch (error) {
      throw new Error(`Error fetching initial values: ${error.message}`);
    }
  }
} 