const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartpark';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] MongoDB not reachable at ${uri} (${error.message}). Operating with local high-performance store fallback.`);
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = {
  connectDB,
  getIsConnected,
};
