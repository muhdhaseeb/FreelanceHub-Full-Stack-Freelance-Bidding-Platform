require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const connectDB  = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const initSocket   = require('./socket/socketManager');
const logger       = require('./utils/logger');

connectDB();

const app        = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: [process.env.CLIENT_URL || 'http://localhost:3000', process.env.ADMIN_URL || 'http://localhost:3001'], methods: ['GET','POST'], credentials: true },
});
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000', process.env.ADMIN_URL || 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]({
      msg: 'HTTP request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
      userId: req.user?._id,
    });
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/jobs',          require('./routes/jobRoutes'));
app.use('/api/bids',          require('./routes/bidRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/profiles',      require('./routes/profileRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments',      require('./routes/paymentRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

initSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  logger.info({ msg: 'Server started', port: PORT, env: process.env.NODE_ENV })
);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info({ msg: `${signal} received, shutting down` });
  httpServer.close(() => {
    logger.info({ msg: 'HTTP server closed' });
    process.exit(0);
  });
  setTimeout(() => { logger.error({ msg: 'Forced shutdown after timeout' }); process.exit(1); }, 15000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
