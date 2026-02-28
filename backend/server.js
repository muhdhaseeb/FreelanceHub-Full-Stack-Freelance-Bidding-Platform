require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const initSocket = require('./socket/socketManager');

connectDB();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
});

app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/jobs',          require('./routes/jobRoutes'));
app.use('/api/bids',          require('./routes/bidRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/profiles',      require('./routes/profileRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments',      require('./routes/paymentRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

initSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
