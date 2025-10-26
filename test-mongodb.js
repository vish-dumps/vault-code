// Quick MongoDB connection test
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/codevault';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB!');
    
    // List databases
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    console.log('\nAvailable databases:');
    databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // List collections in codevault
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in codevault database:');
    if (collections.length === 0) {
      console.log('  (no collections yet - this is normal for a new database)');
    } else {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MongoDB is installed on your system');
    console.error('2. Start MongoDB service:');
    console.error('   - Windows: net start MongoDB');
    console.error('   - Or run: mongod');
    console.error('3. Check if MongoDB is running on port 27017');
    process.exit(1);
  }
}

testConnection();
