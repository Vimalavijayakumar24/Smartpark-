require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { startLateArrivalJob, stopLateArrivalJob } = require('./services/lateArrivalJob');

const PORT = process.env.PORT || 5000;

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(` SmartPark AI Autonomous Server running on port: ${PORT}`);
  console.log(` Web App URL: http://localhost:${PORT}`);
  console.log(` REST API URL: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);

  // Connect to MongoDB
  await connectDB();

  // Start background monitoring for late arrivals and timer expiries
  startLateArrivalJob();
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\n[Server] Shutting down gracefully...');
  stopLateArrivalJob();
  server.close(() => {
    console.log('[Server] Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
