const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const socketHandler = require('../src/services/socketChat'); 
const ObjectId = mongoose.Types.ObjectId;

const efef = require('./services/chatHandler').getChatsService({ limit: 10 },  ObjectId('67152dc6b29d665c1bcfb48f'));

// Create HTTP server using Express app
const server = http.createServer(app);
console.log(server)
// Attach socket.io to the server
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"]
  }
});

// Initialize socket handler with io
socketHandler(io);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});











// Graceful exit handlers
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

// Handle unexpected errors
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
