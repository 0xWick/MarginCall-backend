# MarginCall Frontend

A beautiful Next.js React dashboard for displaying real-time financial data from companies.

## Features

- 📊 **Company Dashboard**: View all companies with their metrics
- 📈 **Financial Metrics**: Detailed view of each company's financial data
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- ⚡ **Real-time Updates**: Live data from the Python microservice
- 📱 **Mobile Responsive**: Works on all device sizes

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Development

### Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Dashboard page
│   ├── company/[id]/      # Company detail pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── CompanyCard.tsx    # Company card component
│   └── MetricCard.tsx     # Metric display component
├── lib/                   # Utilities and API
│   ├── api.ts            # API client
│   └── utils.ts          # Utility functions
└── types/                # TypeScript types
    └── index.ts          # Type definitions
```

### Key Components

- **CompanyCard**: Displays company summary on dashboard
- **MetricCard**: Shows individual financial metrics
- **Dashboard**: Main page with company grid
- **CompanyPage**: Detailed view of company metrics

## API Integration

The frontend connects to the NestJS backend API:

- `GET /companies` - Get all companies
- `GET /companies/:id` - Get specific company
- `GET /financial-data?companyId=:id` - Get financial data

## Styling

Uses Tailwind CSS with custom components:
- `.card` - Standard card styling
- `.metric-card` - Financial metric cards
- `.metric-value` - Large metric values
- `.metric-label` - Metric labels

## Data Formatting

The app includes smart formatting for different metric types:
- **Currency**: $1.2B, $500M, etc.
- **Percentages**: 15.5%
- **Ratios**: 1.25
- **Large Numbers**: 1.2B, 500M, etc. 