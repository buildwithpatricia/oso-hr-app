const { Oso } = require('oso-cloud');
const fs = require('fs');
const config = require('./config');

async function uploadPolicies() {
  const osoUrl = 'https://cloud.osohq.com';
  const oso = new Oso(osoUrl, config.osoApiKey, { environment: config.nodeEnv });

  try {
    console.log('📤 Uploading policies to Oso Cloud...');
    
    // Read the policies file
    const policiesContent = fs.readFileSync('./policies.polar', 'utf8');
    console.log('📄 Policies content:');
    console.log('─'.repeat(50));
    console.log(policiesContent);
    console.log('─'.repeat(50));
    
    // Upload the policies
    await oso.policy(policiesContent);
    
    console.log('✅ Policies uploaded successfully!');
    console.log('🎉 You can now test your policies');
    
  } catch (error) {
    console.error('❌ Error uploading policies:', error.message);
    console.error('Full error:', error);
  }
}

uploadPolicies();
