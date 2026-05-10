const { MongoClient } = require('mongodb');

let db = null;
let client = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DATABASE || 'panic');

  // Create indexes
  await createIndexes();

  console.log(`✅ Connected to MongoDB Atlas — database: ${db.databaseName}`);
  return db;
}

async function createIndexes() {
  // users — unique email
  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  // contacts — by userEmail
  await db.collection('contacts').createIndex({ userEmail: 1 });

  // documents — by userEmail
  await db.collection('documents').createIndex({ userEmail: 1 });
  await db.collection('documents').createIndex({ shareableLink: 1 }, { sparse: true });

  // checkInSettings — unique per user
  await db.collection('checkInSettings').createIndex({ userEmail: 1 }, { unique: true });

  // checkInHistory — by userEmail + date
  await db.collection('checkInHistory').createIndex({ userEmail: 1, checkedInAt: -1 });

  // incidents — by userEmail + date
  await db.collection('incidents').createIndex({ userEmail: 1, triggeredAt: -1 });

  // chatbotConversations — unique per user
  await db.collection('chatbotConversations').createIndex({ userEmail: 1 }, { unique: true });

  // appSettings — unique per user
  await db.collection('appSettings').createIndex({ userEmail: 1 }, { unique: true });

  console.log('✅ MongoDB indexes created');
}

function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

module.exports = { connectDB, getDB };
