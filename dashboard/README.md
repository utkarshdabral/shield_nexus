# Situational Awareness Dashboard

A production-ready web dashboard that unifies **crowd anomaly detection** from CCTV footage and **sentiment analysis** from textual data into a single, interpretable situational awareness platform.

![Dashboard Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Python](https://img.shields.io/badge/Analytics-Python%20%2B%20YOLO%20%2B%20VADER-yellow)

## 🎯 Features

### CCTV Analytics
- Real-time crowd escalation scoring using optical flow and YOLOv8
- Person detection and density tracking
- Motion intensity analysis with grid-based spatial monitoring
- Historical trend visualization

### Sentiment Analysis
- VADER-based sentiment analysis for text data
- Volatility scoring with crisis keyword detection
- Risk classification (Low, Medium, High)
- Source-tagged and timestamped analysis

### Unified Risk Index
- Configurable weighted fusion of CCTV and sentiment scores
- Real-time combined risk calculation
- Threshold-based alerting
- Correlation analysis between physical and emotional signals

## 📁 Project Structure

```
dashboard/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helpers and middleware
│   │   └── db/                # Database initialization
│   ├── python/                # Analysis wrapper scripts
│   └── data/                  # SQLite database
├── frontend/                  # React dashboard
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client
│   │   └── styles/            # CSS design system
│   └── public/
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.8+ with pip
- Existing analysis pipelines in `../DOT404` and `../senti`

### 1. Install Dependencies

```bash
# From the dashboard directory
cd dashboard

# Install root dependencies (concurrently)
npm install

# Install backend and frontend dependencies
npm run install:all

# Install Python dependencies for analysis scripts
cd backend/python
pip install -r requirements.txt
cd ../..
```

### 2. Start Development Servers

```bash
# Run both backend and frontend concurrently
npm run dev
```

This will start:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

### 3. Open the Dashboard

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

## 📊 API Endpoints

### CCTV Analytics (`/api/cctv`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Analyze a video file |
| GET | `/results` | Get historical results |
| GET | `/results/:videoId` | Get results for specific video |
| GET | `/latest` | Get latest analysis |
| GET | `/videos` | List analyzed videos |

### Sentiment Analytics (`/api/sentiment`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Analyze text data |
| POST | `/batch` | Batch analyze texts |
| GET | `/results` | Get historical results |
| GET | `/latest` | Get latest analyses |
| GET | `/aggregates` | Get aggregated metrics |
| GET | `/distribution` | Get sentiment distribution |
| GET | `/timeseries` | Get time series data |

### Risk Index (`/api/risk`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/current` | Get current unified risk |
| GET | `/history` | Get risk history |
| POST | `/compute` | Force recompute risk |
| GET | `/correlation` | Get correlation data |
| GET | `/summary` | Get dashboard summary |

### Configuration (`/api/config`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all configuration |
| GET | `/:key` | Get specific config value |
| PUT | `/:key` | Update config value |

## 🔧 Configuration

The system can be configured through the API or by modifying default values in the database:

| Key | Default | Description |
|-----|---------|-------------|
| `risk.weight.cctv` | 0.6 | Weight for CCTV score in fusion |
| `risk.weight.sentiment` | 0.4 | Weight for sentiment score in fusion |
| `risk.threshold.high` | 0.7 | Threshold for high-risk classification |
| `risk.threshold.medium` | 0.4 | Threshold for medium-risk classification |
| `refresh.interval` | 5000 | Dashboard auto-refresh interval (ms) |

## 📈 Example Usage

### Analyze Sentiment Data

```bash
curl -X POST http://localhost:3001/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      {"text": "Everything looks calm and peaceful today", "source": "tweet"},
      {"text": "There is a fire and people are panicking!", "source": "report"}
    ]
  }'
```

### Analyze CCTV Video

```bash
curl -X POST http://localhost:3001/api/cctv/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "/path/to/video.mp4",
    "videoId": "cam-001"
  }'
```

### Get Dashboard Summary

```bash
curl http://localhost:3001/api/risk/summary
```

## 🛠️ Development

### Backend Only

```bash
cd backend
npm run dev
```

### Frontend Only

```bash
cd frontend
npm run dev
```

### Build for Production

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## 📊 Data Flow

```
1. CCTV Video → DOT404 Pipeline → Escalation Scores → Database
2. Text Data → VADER Sentiment → Risk Classification → Database
3. Database → Risk Fusion Service → Unified Risk Index
4. API → React Dashboard → Real-time Visualization
```

## 🎨 Dashboard Features

- **Dark theme** with modern glassmorphism design
- **Real-time updates** with configurable refresh intervals
- **Interactive filters** for date range, risk level, and source type
- **Responsive layout** for desktop and tablet
- **SVG gauge** for unified risk visualization
- **Time series charts** using Recharts

## 📝 License

MIT

## 🙏 Acknowledgments

- DOT404 team for the crowd analysis pipeline
- VADER sentiment analysis library
- Ultralytics for YOLOv8
