# MarginCall Financial Data Pipeline

A comprehensive financial data pipeline that fetches real-time financial metrics for companies using Yahoo Finance data.

## Architecture

- **NestJS Backend**: REST API for managing companies and retrieving financial data
- **Python Microservice**: Data fetcher using yahooquery library, runs every minute
- **PostgreSQL**: Database for storing companies and financial data
- **Docker Compose**: Orchestrates all services

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Running the Application

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f nestjs-backend
   docker-compose logs -f python-microservice
   ```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Submit Company for Tracking

**POST** `/companies`

Submit a company ticker and metrics to track.

```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "metricsToTrack": ["TotalAssets", "Price", "Volume", "Mcap", "CurrentLiabilities"]
}
```

**Response:**
```json
{
  "id": 1,
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "metricsToTrack": ["TotalAssets", "Price", "Volume", "Mcap", "CurrentLiabilities"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Get All Companies

**GET** `/companies`

Returns all active companies.

#### 3. Get Company by ID

**GET** `/companies/:id`

Returns a specific company by ID.

#### 4. Get Financial Data by Company ID

**GET** `/financial-data/company/:companyId`

Returns financial data for a specific company.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 10)

#### 5. Get Latest Financial Data by Company ID

**GET** `/financial-data/company/:companyId/latest`

Returns the most recent financial data for a company.

#### 6. Get Financial Data by Ticker

**GET** `/financial-data/ticker/:ticker`

Returns financial data for a company by ticker symbol.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 10)

#### 7. Get Latest Financial Data by Ticker

**GET** `/financial-data/ticker/:ticker/latest`

Returns the most recent financial data for a company by ticker.

## Available Financial Metrics

The system supports the following financial metrics:

- `TotalAssets` - Total assets
- `Price` - Current stock price
- `Volume` - Trading volume
- `Mcap` - Market capitalization
- `CurrentLiabilities` - Current liabilities
- `TotalRevenue` - Total revenue
- `NetIncome` - Net income
- `TotalEquity` - Total stockholder equity
- `TotalDebt` - Total debt
- `Cash` - Total cash
- `FreeCashFlow` - Free cash flow
- `EBITDA` - EBITDA
- `ROE` - Return on equity
- `ROA` - Return on assets
- `DebtToEquity` - Debt to equity ratio
- `CurrentRatio` - Current ratio
- `QuickRatio` - Quick ratio
- `PEGRatio` - PEG ratio
- `PriceToBook` - Price to book ratio
- `PriceToSales` - Price to sales ratio

## Example Usage

### 1. Submit Apple Inc. for tracking

```bash
curl -X POST http://localhost:3000/companies \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "metricsToTrack": ["TotalAssets", "Price", "Volume", "Mcap", "CurrentLiabilities"]
  }'
```

### 2. Get latest financial data for Apple

```bash
curl http://localhost:3000/financial-data/ticker/AAPL/latest
```

### 3. Get historical financial data for Apple (last 5 records)

```bash
curl "http://localhost:3000/financial-data/ticker/AAPL?limit=5"
```

## Development

### Local Development Setup

1. **Install NestJS CLI globally:**
   ```bash
   npm install -g @nestjs/cli
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Run backend in development mode:**
   ```bash
   npm run start:dev
   ```

4. **Install Python dependencies:**
   ```bash
   cd python-service
   pip install -r requirements.txt
   ```

5. **Run Python service:**
   ```bash
   python main.py
   ```

### Database Schema

The application uses two main tables:

#### Companies Table
- `id` (Primary Key)
- `ticker` (Unique)
- `name`
- `metricsToTrack` (Array of strings)
- `isActive` (Boolean)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### Financial Data Table
- `id` (Primary Key)
- `companyId` (Foreign Key)
- `data` (JSONB - contains the financial metrics)
- `fetchedAt` (Timestamp)
- `createdAt` (Timestamp)

## Monitoring

### View Python Service Logs
```bash
docker-compose logs -f python-microservice
```

### View Backend Logs
```bash
docker-compose logs -f nestjs-backend
```

### View Database Logs
```bash
docker-compose logs -f postgres
```

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure PostgreSQL container is running: `docker-compose ps`
   - Check database logs: `docker-compose logs postgres`

2. **Python service not fetching data:**
   - Check Python service logs: `docker-compose logs python-microservice`
   - Verify company exists in database
   - Check Yahoo Finance API availability

3. **Backend API errors:**
   - Check backend logs: `docker-compose logs nestjs-backend`
   - Verify database connection
   - Check request format and validation

### Reset Database

To reset the database and start fresh:

```bash
docker-compose down -v
docker-compose up -d
```

## Environment Variables

The application uses the following environment variables:

- `DATABASE_HOST` - PostgreSQL host (default: postgres)
- `DATABASE_PORT` - PostgreSQL port (default: 5432)
- `DATABASE_NAME` - Database name (default: margincall)
- `DATABASE_USER` - Database user (default: margincall)
- `DATABASE_PASSWORD` - Database password (default: margincall123)

These are configured in the `docker-compose.yml` file and can be overridden by creating a `.env` file. 