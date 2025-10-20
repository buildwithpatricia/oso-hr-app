const { Oso } = require('oso-cloud');
const config = require('./config');

// Test your policies locally
async function testPolicies() {
  const oso = new Oso({
    apiKey: config.osoApiKey,
    environment: config.nodeEnv
  });

  // Test data - simulate your HR app data
  const alice = { type: "User", id: "alice" };
  const bob = { type: "User", id: "bob" };
  const sarah = { type: "User", id: "sarah" };
  const acme = { type: "Company", id: "acme" };

  try {
    console.log('🧪 Testing Oso Cloud policies...\n');

    // Insert test facts
    console.log('📝 Inserting test facts...');
    await oso.insert(["has_role", alice, "employee", acme]);
    await oso.insert(["has_role", bob, "employee", acme]);
    await oso.insert(["has_role", sarah, "employee", acme]);
    
    // Sarah is Alice's manager
    await oso.insert(["has_role", alice, "employee", sarah]);
    
    console.log('✅ Facts inserted successfully\n');

    // Test basic profile viewing
    console.log('🔍 Testing basic profile viewing...');
    const aliceCanViewBob = await oso.authorize(alice, "view_basic", bob);
    console.log(`Alice can view Bob's basic profile: ${aliceCanViewBob}`);

    const aliceCanViewSarah = await oso.authorize(alice, "view_basic", sarah);
    console.log(`Alice can view Sarah's basic profile: ${aliceCanViewSarah}\n`);

    // Test sensitive profile viewing
    console.log('🔒 Testing sensitive profile viewing...');
    const aliceCanViewOwnSensitive = await oso.authorize(alice, "view_sensitive", alice);
    console.log(`Alice can view her own sensitive profile: ${aliceCanViewOwnSensitive}`);

    const aliceCanViewBobSensitive = await oso.authorize(alice, "view_sensitive", bob);
    console.log(`Alice can view Bob's sensitive profile: ${aliceCanViewBobSensitive}`);

    const sarahCanViewAliceSensitive = await oso.authorize(sarah, "view_sensitive", alice);
    console.log(`Sarah can view Alice's sensitive profile: ${sarahCanViewAliceSensitive}`);

    const sarahCanViewBobSensitive = await oso.authorize(sarah, "view_sensitive", bob);
    console.log(`Sarah can view Bob's sensitive profile: ${sarahCanViewBobSensitive}\n`);

    console.log('🎉 Policy testing complete!');

  } catch (error) {
    console.error('❌ Error testing policies:', error.message);
    console.error('Make sure your OSO_AUTH_API_KEY is set correctly');
  }
}

// Run the test
testPolicies();
