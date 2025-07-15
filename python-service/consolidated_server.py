"""
Consolidated Python web server for MarginCall.
Handles both field validation and data tracking with cron functionality.
"""

import os
import time
import schedule
import logging
import threading
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from yahooquery import Ticker
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import random
import requests
import math
from typing import Dict, List, Optional, Any

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class ConsolidatedService:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DATABASE_HOST', 'postgres'),
            'port': os.getenv('DATABASE_PORT', '5432'),
            'database': os.getenv('DATABASE_NAME', 'margincall'),
            'user': os.getenv('DATABASE_USER', 'margincall'),
            'password': os.getenv('DATABASE_PASSWORD', 'margincall123'),
        }
        
        # NestJS API URL
        self.nestjs_url = os.getenv('NESTJS_API_URL', 'http://nestjs-backend:3000')
        
        # Field mapping from our snake_case to Yahoo Finance camelCase
        self.field_mapping = {
            # Market Data
            'regularMarketPrice': 'regularMarketPrice',
            'displayName': 'displayName',
            'marketCap': 'marketCap',
            'volume': 'regularMarketVolume',
            'priceChange': 'regularMarketChange',
            'priceChangePercent': 'regularMarketChangePercent',
            
            # Financial Ratios
            'currentRatio': 'currentRatio',
            'quickRatio': 'quickRatio',
            'debtToEquity': 'debtToEquity',
            'returnOnAssets': 'returnOnAssets',
            'returnOnEquity': 'returnOnEquity',
            'priceToBook': 'priceToBook',
            'trailingPE': 'trailingPE',
            'forwardPE': 'forwardPE',
            
            # Cash & Debt
            'totalCash': 'totalCash',
            'totalDebt': 'totalDebt',
            'freeCashflow': 'freeCashflow',
            'operatingCashflow': 'operatingCashflow',
            
            # Revenue & Profits
            'totalRevenue': 'totalRevenue',
            'grossProfits': 'grossProfits',
            'profitMargins': 'profitMargins',
            'operatingMargins': 'operatingMargins',
            'grossMargins': 'grossMargins',
            
            # Growth Metrics
            'revenueGrowth': 'revenueGrowth',
            'earningsGrowth': 'earningsGrowth',
            
            # Per Share Metrics
            'revenuePerShare': 'revenuePerShare',
            'totalCashPerShare': 'totalCashPerShare',
            
            # Analyst Ratings
            'targetMeanPrice': 'targetMeanPrice',
            'targetMedianPrice': 'targetMedianPrice',
            'recommendationMean': 'recommendationMean',
            'numberOfAnalystOpinions': 'numberOfAnalystOpinions'
        }

    def get_db_connection(self):
        """Create database connection"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None

    def get_available_fields(self, ticker: str) -> Dict[str, List[Dict]]:
        """
        Get all available fields for a ticker, categorized by type, with their current values.
        Excludes NA and null values.
        
        Returns:
        {
            "marketData": [{"field": "regularMarketPrice", "value": 150.25}, ...],
            "financialMetrics": [{"field": "currentRatio", "value": 1.5}, ...],
            "incomeStatement": [{"field": "totalRevenue", "value": 1000000}, ...],
            "balanceSheet": [{"field": "totalCash", "value": 500000}, ...],
            "cashFlow": [{"field": "operatingCashflow", "value": 200000}, ...]
        }
        """
        try:
            logger.info(f"Getting available fields for {ticker}")
            
            ticker_obj = Ticker(ticker)
            
            # Get quote data
            quote_data = ticker_obj.quotes
            quote = None
            if isinstance(quote_data, dict):
                if ticker in quote_data:
                    quote = quote_data[ticker]
                elif len(quote_data) > 0:
                    quote = list(quote_data.values())[0]
            
            # Get financial data
            financial_data = ticker_obj.financial_data
            financial_metrics = {}
            if isinstance(financial_data, dict):
                financial_metrics = financial_data.get(ticker, {}) if financial_data else {}
            
            # Categorize fields
            categories = {
                'marketData': [],
                'financialMetrics': [],
                'incomeStatement': [],
                'balanceSheet': [],
                'cashFlow': []
            }
            
            # Define field categories
            market_fields = ['regularMarketPrice', 'displayName', 'marketCap', 'volume', 'priceChange', 'priceChangePercent']
            financial_fields = ['currentRatio', 'quickRatio', 'debtToEquity', 'returnOnAssets', 'returnOnEquity', 'priceToBook', 'trailingPE', 'forwardPE']
            income_fields = ['totalRevenue', 'grossProfits', 'profitMargins', 'operatingMargins', 'grossMargins', 'revenueGrowth', 'earningsGrowth']
            balance_fields = ['totalCash', 'totalDebt', 'revenuePerShare', 'totalCashPerShare']
            cash_fields = ['freeCashflow', 'operatingCashflow']
            
            # Check all fields in our mapping
            for field in self.field_mapping.keys():
                yahoo_field = self.field_mapping[field]
                value = None
                
                # Check in quote data first
                if quote and yahoo_field in quote and quote[yahoo_field] is not None:
                    value = quote[yahoo_field]
                # Check in financial data
                elif financial_metrics and yahoo_field in financial_metrics and financial_metrics[yahoo_field] is not None:
                    value = financial_metrics[yahoo_field]
                
                # Only include fields with valid values (not None, not NaN, not empty string)
                if value is not None and value != '' and str(value).lower() != 'nan':
                    field_info = {
                        "field": field,
                        "value": value,
                        "formattedValue": self.format_field_value(field, value)
                    }
                    
                    if field in market_fields:
                        categories['marketData'].append(field_info)
                    elif field in financial_fields:
                        categories['financialMetrics'].append(field_info)
                    elif field in income_fields:
                        categories['incomeStatement'].append(field_info)
                    elif field in balance_fields:
                        categories['balanceSheet'].append(field_info)
                    elif field in cash_fields:
                        categories['cashFlow'].append(field_info)
            
            logger.info(f"Available fields for {ticker}: {categories}")
            return categories
            
        except Exception as e:
            logger.error(f"Error getting available fields for {ticker}: {e}")
            return {
                'marketData': [],
                'financialMetrics': [],
                'incomeStatement': [],
                'balanceSheet': [],
                'cashFlow': []
            }

    def format_field_value(self, field: str, value: any) -> str:
        """Format field value for display"""
        try:
            if value is None:
                return 'N/A'
            
            num_value = float(value)
            if math.isnan(num_value):
                return str(value)
            
            # Format based on field type
            if field in ['regularMarketPrice', 'marketCap', 'totalCash', 'totalRevenue', 'grossProfits', 'freeCashflow', 'operatingCashflow']:
                if num_value >= 1e9:
                    return f"${num_value/1e9:.2f}B"
                elif num_value >= 1e6:
                    return f"${num_value/1e6:.2f}M"
                elif num_value >= 1e3:
                    return f"${num_value/1e3:.2f}K"
                else:
                    return f"${num_value:.2f}"
            elif field in ['currentRatio', 'quickRatio', 'debtToEquity', 'returnOnAssets', 'returnOnEquity', 'priceToBook', 'trailingPE', 'forwardPE']:
                return f"{num_value:.2f}"
            elif field in ['profitMargins', 'operatingMargins', 'grossMargins', 'revenueGrowth', 'earningsGrowth', 'priceChangePercent']:
                return f"{num_value:.2f}%"
            elif field in ['volume', 'priceChange']:
                if num_value >= 1e6:
                    return f"{num_value/1e6:.1f}M"
                else:
                    return f"{num_value:,.0f}"
            else:
                return f"{num_value:.2f}"
        except:
            return str(value)

    def get_signals_needing_update(self) -> List[Dict]:
        """Get signals that haven't been updated in the last 1 minute"""
        conn = self.get_db_connection()
        if not conn:
            logger.error("DB connection failed in get_signals_needing_update")
            return []
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                one_minute_ago = datetime.now() - timedelta(minutes=1)
                logger.info(f"[DB] Query: SELECT ... FROM signals WHERE isActive=true AND (lastUpdated IS NULL OR lastUpdated < %s) | Param: {one_minute_ago}")
                sql = '''
                    SELECT s.id, s."leftMetric", s."rightMetric", s.operator, s."signalType",
                           s."companyTicker", s."companyName", s."isActive", s."lastUpdated"
                    FROM signals s
                    WHERE s."isActive" = true 
                    AND (s."lastUpdated" IS NULL OR s."lastUpdated" < %s)
                    ORDER BY s.id
                '''
                cursor.execute(sql, (one_minute_ago,))
                signals = cursor.fetchall()
                logger.info(f"[DB] Raw signals fetched: {signals}")
                logger.info(f"Found {len(signals)} signals needing update")
                for signal in signals:
                    logger.info(f"Signal {signal['id']}: {signal['companyTicker']} - lastUpdated: {signal['lastUpdated']}")
                return [dict(signal) for signal in signals]
        except Exception as e:
            logger.error(f"Error fetching signals needing update: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
        finally:
            conn.close()

    def fetch_financial_data(self, ticker: str, metrics: List[str]) -> Optional[Dict]:
        """Fetch financial data for specific metrics"""
        try:
            logger.info(f"Fetching financial data for {ticker}, metrics: {metrics}")
            
            # Add random delay to avoid rate limiting
            delay = random.uniform(2.0, 5.0)
            logger.info(f"Waiting {delay:.2f} seconds before API call...")
            time.sleep(delay)
            
            ticker_obj = Ticker(ticker)
            
            # Get quote data
            quote_data = ticker_obj.quotes
            quote = None
            if isinstance(quote_data, dict):
                if ticker in quote_data:
                    quote = quote_data[ticker]
                elif len(quote_data) > 0:
                    quote = list(quote_data.values())[0]
            
            # Get financial data
            financial_data = ticker_obj.financial_data
            financial_metrics = {}
            if isinstance(financial_data, dict):
                financial_metrics = financial_data.get(ticker, {}) if financial_data else {}
            
            # Build data structure with only requested metrics
            data = {
                'ticker': ticker,
                'companyName': quote.get('displayName', ticker) if quote else ticker,
                'lastUpdated': datetime.now().isoformat(),
                'metrics': {}
            }
            
            # Extract only the requested metrics
            for metric in metrics:
                yahoo_field = self.field_mapping.get(metric, metric)
                value = None
                
                # Check in quote data first
                if quote and yahoo_field in quote and quote[yahoo_field] is not None:
                    value = quote[yahoo_field]
                # Check in financial data
                elif financial_metrics and yahoo_field in financial_metrics and financial_metrics[yahoo_field] is not None:
                    value = financial_metrics[yahoo_field]
                
                if value is not None and str(value).lower() != 'nan':
                    data['metrics'][metric] = value
            
            logger.info(f"Fetched data for {ticker}: {data}")
            return data
            
        except Exception as e:
            logger.error(f"Error fetching financial data for {ticker}: {e}")
            return None

    def post_update_to_nestjs(self, signal_id: int, data: Dict):
        """Post updated data to NestJS for processing"""
        try:
            url = f"{self.nestjs_url}/signals/{signal_id}/update"
            response = requests.post(url, json=data, timeout=10)
            
            if response.status_code in [200, 201]:  # Accept both 200 and 201 as success
                logger.info(f"Successfully posted update for signal {signal_id} (status: {response.status_code})")
                return True
            else:
                logger.error(f"Failed to post update for signal {signal_id}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error posting update to NestJS for signal {signal_id}: {e}")
            return False

    def process_signals(self):
        """Main cron job to process signals"""
        logger.info("[CRON] Starting signal processing...")
        signals = self.get_signals_needing_update()
        logger.info(f"[CRON] Signals returned for processing: {signals}")
        logger.info(f"[CRON] Found {len(signals)} signals needing update")
        for signal in signals:
            try:
                logger.info(f"[CRON] Processing signal {signal['id']}: {signal['companyTicker']} - {signal['leftMetric']} {signal['operator']} {signal['rightMetric']}")
                metrics = [signal['leftMetric']]
                if signal['signalType'] == 'metric_to_metric':
                    metrics.append(signal['rightMetric'])
                logger.info(f"[CRON] Fetching metrics for {signal['companyTicker']}: {metrics}")
                data = self.fetch_financial_data(signal['companyTicker'], metrics)
                if not data:
                    logger.warning(f"[CRON] No data fetched for {signal['companyTicker']}")
                    continue
                success = self.post_update_to_nestjs(signal['id'], data)
                if success:
                    logger.info(f"[CRON] Successfully processed signal {signal['id']}")
                else:
                    logger.error(f"[CRON] Failed to process signal {signal['id']}")
                time.sleep(random.uniform(1.0, 3.0))
            except Exception as e:
                logger.error(f"[CRON] Error processing signal {signal['id']}: {e}")
                import traceback
                logger.error(traceback.format_exc())

# Global service instance
service = ConsolidatedService()

# Flask routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy111', 'service': 'consolidated-margincall'})

@app.route('/available-fields/<ticker>', methods=['GET'])
def get_available_fields(ticker):
    """Get all available fields for a ticker"""
    try:
        fields = service.get_available_fields(ticker.upper())
        return jsonify({
            'success': True,
            'data': fields
        })
    except Exception as e:
        logger.error(f"Error in get_available_fields: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/fetch-initial-values', methods=['POST'])
def fetch_initial_values():
    """Fetch initial values for signal creation"""
    try:
        data = request.get_json()
        ticker = data.get('ticker')
        metrics = data.get('metrics', [])
        
        if not ticker or not metrics:
            return jsonify({
                'success': False,
                'error': 'Ticker and metrics are required'
            }), 400
        
        logger.info(f"Fetching initial values for {ticker}, metrics: {metrics}")
        
        # Fetch financial data for the specified metrics
        financial_data = service.fetch_financial_data(ticker, metrics)
        
        if not financial_data:
            return jsonify({
                'success': False,
                'error': f'Failed to fetch data for {ticker}'
            }), 400
        
        # Return only the metrics values as initial values
        initial_values = financial_data.get('metrics', {})
        
        logger.info(f"Initial values for {ticker}: {initial_values}")
        
        return jsonify({
            'success': True,
            'data': {
                'ticker': ticker,
                'initialValues': initial_values,
                'fetchedAt': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error in fetch_initial_values: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def run_scheduler():
    """Run the scheduler in a separate thread"""
    logger.info("=" * 30)
    logger.info("SCHEDULER FUNCTION STARTED")
    logger.info("=" * 30)
    
    try:
        logger.info("Setting up signal processing job...")
        schedule.every(1).minutes.do(service.process_signals)
        logger.info("Signal processing job scheduled for every 1 minute")
        
        logger.info("Starting scheduler loop...")
        loop_count = 0
        while True:
            loop_count += 1
            logger.info(f"Scheduler loop iteration {loop_count}")
            
            # Check pending jobs
            pending_jobs = schedule.get_jobs()
            logger.info(f"Pending jobs: {len(pending_jobs)}")
            
            # Run pending jobs
            schedule.run_pending()
            logger.info("Checked for pending jobs")
            
            # Sleep for 60 seconds
            logger.info("Sleeping for 60 seconds...")
            time.sleep(60)
            
    except Exception as e:
        logger.error(f"Error in scheduler: {e}")
        import traceback
        logger.error(f"Scheduler traceback: {traceback.format_exc()}")
        raise

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("STARTING CONSOLIDATED SERVER")
    logger.info("=" * 50)
    
    try:
        # Start scheduler in a separate thread
        logger.info("Creating scheduler thread...")
        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        logger.info("Starting scheduler thread...")
        scheduler_thread.start()
        logger.info("Scheduler thread started successfully")
        
        # Test if scheduler is working
        logger.info("Testing scheduler - adding a test job...")
        schedule.every(10).seconds.do(lambda: logger.info("TEST: Scheduler is working!"))
        
        # Run Flask app
        logger.info("Starting Flask app...")
        logger.info("Flask will run on host=0.0.0.0, port=5001")
        app.run(host='0.0.0.0', port=5001, debug=False)
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}") 