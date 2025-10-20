const User = require('../models/User');
const FactSyncService = require('../services/fact-sync');

async function syncExistingUsers() {
  console.log('🔄 Syncing existing users to Oso Cloud...');
  
  const factSync = new FactSyncService();
  
  try {
    // Get all users
    const users = await User.findAll();
    console.log(`Found ${users.length} users to sync`);
    
    for (const user of users) {
      console.log(`Syncing user: ${user.getFullName()} (ID: ${user.id})`);
      await factSync.syncUserCreated(user);
    }
    
    console.log('✅ All users synced to Oso Cloud successfully!');
  } catch (error) {
    console.error('❌ Error syncing users:', error);
  }
}

// Run the sync
syncExistingUsers();
