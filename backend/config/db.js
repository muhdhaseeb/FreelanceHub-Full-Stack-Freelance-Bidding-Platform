const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info({ msg: 'MongoDB connected', host: conn.connection.host });
  } catch (error) {
    logger.error({ msg: 'MongoDB connection failed', error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
