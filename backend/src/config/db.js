const mongoose = require('mongoose');
const dns = require('dns');
const { seedMongoDBIfEmpty } = require('./seedMongo');

// Ensure Windows Node resolves MongoDB Atlas SRV records without querySrv ECONNREFUSED issues
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Use system default if restricted
}

let isConnected = false;

const connectDB = async () => {
  let uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartpark').trim();

  // If user pasted an Atlas URI without a database name (ending in .mongodb.net/ or .mongodb.net),
  // automatically target 'smartpark' instead of 'test'
  if (uri.includes('.mongodb.net/') && (uri.endsWith('.mongodb.net/') || uri.match(/\.mongodb\.net\/\?/))) {
    uri = uri.replace('.mongodb.net/', '.mongodb.net/smartpark');
  } else if (uri.endsWith('.mongodb.net')) {
    uri = `${uri}/smartpark?retryWrites=true&w=majority`;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      autoIndex: true,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Automatically create collections & seed initial parking locations, slots, and demo users
    await seedMongoDBIfEmpty();

    return true;
  } catch (error) {
    isConnected = false;
    console.warn(
      `[Database] MongoDB Atlas not reachable (${error.message}). Operating with local high-performance store fallback.`
    );
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = {
  connectDB,
  getIsConnected,
};
