import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import cctvRoutes from './routes/cctv.routes.js';
import sentimentRoutes from './routes/sentiment.routes.js';
import riskRoutes from './routes/risk.routes.js';
import configRoutes from './routes/config.routes.js';
import videosRoutes from './routes/videos.routes.js';
import issuesRoutes from './routes/issues.routes.js';
import { initDatabase } from './db/init.js';
import { errorHandler } from './utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// API Routes
app.use('/api/cctv', cctvRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/config', configRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/issues', issuesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling
app.use(errorHandler);

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
