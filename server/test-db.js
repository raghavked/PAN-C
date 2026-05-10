require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
console.log('URI set:', !!uri);
console.log('DB:', process.env.MONGODB_DATABASE);

const client = new MongoClient(uri);
client.connect()
  .then(() => {
    console.log('✅ MongoDB connected!');
    return client.close();
  })
  .catch(e => {
    console.error('❌ Connection error:', e.message);
    process.exit(1);
  });
