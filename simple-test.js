const { Oso } = require('oso-cloud');
const config = require('./config');

async function testConnection() {
  console.log('Testing Oso Cloud connection...');
  console.log('API Key:', config.osoApiKey ? 'Set' : 'Not set');
  console.log('Environment:', config.nodeEnv);

  try {
    // Oso Cloud URL for the development environment
    const osoUrl = 'https://cloud.osohq.com';
    const oso = new Oso(osoUrl, config.osoApiKey, { environment: config.nodeEnv });
    
    console.log('✅ Oso client created successfully');
    
    // Try a simple authorization test
    const testUser = { type: "User", id: "test" };
    const testResource = { type: "Document", id: "test" };
    
    console.log('Testing authorization...');
    const result = await oso.authorize(testUser, "view", testResource);
    console.log('Authorization result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
