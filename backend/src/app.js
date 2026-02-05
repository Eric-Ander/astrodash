require('dotenv').config();

// Expose the backend src root so card plugins can locate shared services
// in both local dev and Docker environments
global.appRoot = __dirname;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const apiRoutes = require('./routes/api');
const cardLoader = require('./card-loader');
const { initializeScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize notification scheduler
initializeScheduler();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development, configure properly in production
}));

// Enable CORS
app.use(cors());

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve frontend path (works in both local dev and Docker)
const fs = require('fs');
const frontendPath = [
  path.join(__dirname, '../../frontend/public'),  // local dev: backend/src -> astrodash/frontend/public
  path.join(__dirname, '../frontend/public'),      // Docker: /app/src -> /app/frontend/public
].find((p) => fs.existsSync(p)) || path.join(__dirname, '../../frontend/public');

// Serve static frontend files
app.use(express.static(frontendPath));

// API routes
app.use('/api', apiRoutes);

// Discover and mount card plugins
cardLoader.discover();
cardLoader.mount(app);

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested API endpoint does not exist'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AstroWeather API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
