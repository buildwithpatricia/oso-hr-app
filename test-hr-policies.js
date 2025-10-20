const { Oso } = require('oso-cloud');
const config = require('./config');

// Test HR policies
async function testHRPolicies() {
  const osoUrl = 'https://cloud.osohq.com';
  const oso = new Oso(osoUrl, config.osoApiKey, { environment: config.nodeEnv });

  // Test data - simulating your HR app users
  const alice = { type: "User", id: "alice" }; // Employee
  const bob = { type: "User", id: "bob" };     // Employee  
  const sarah = { type: "User", id: "sarah" }; // Manager
  const john = { type: "User", id: "john" };   // CEO
  
  const acme = { type: "Company", id: "acme" };
  
  const aliceProfile = { type: "Profile", id: "alice_profile" };
  const bobProfile = { type: "Profile", id: "bob_profile" };
  const sarahProfile = { type: "Profile", id: "sarah_profile" };
  const johnProfile = { type: "Profile", id: "john_profile" };

  try {
    console.log('🧪 Testing HR Authorization Policies...\n');

    // Insert test facts
    console.log('📝 Setting up test data...');
    
    // Company relationships
    await oso.insert(["has_role", alice, "employee", acme]);
    await oso.insert(["has_role", bob, "employee", acme]);
    await oso.insert(["has_role", sarah, "employee", acme]);
    await oso.insert(["has_role", john, "ceo", acme]);
    
    // Manager relationships
    await oso.insert(["has_role", alice, "employee", sarah]); // Alice reports to Sarah
    await oso.insert(["has_role", bob, "employee", sarah]);   // Bob reports to Sarah
    
    // Profile ownership
    await oso.insert(["has_role", alice, "owner", aliceProfile]);
    await oso.insert(["has_role", bob, "owner", bobProfile]);
    await oso.insert(["has_role", sarah, "owner", sarahProfile]);
    await oso.insert(["has_role", john, "owner", johnProfile]);
    
    // Coworker relationships (same company, not direct reports)
    await oso.insert(["has_role", alice, "coworker", bobProfile]);
    await oso.insert(["has_role", alice, "coworker", sarahProfile]);
    await oso.insert(["has_role", alice, "coworker", johnProfile]);
    
    await oso.insert(["has_role", bob, "coworker", aliceProfile]);
    await oso.insert(["has_role", bob, "coworker", sarahProfile]);
    await oso.insert(["has_role", bob, "coworker", johnProfile]);
    
    // Manager relationships - Sarah is manager of Alice and Bob's profiles
    await oso.insert(["has_role", sarah, "manager", aliceProfile]);
    await oso.insert(["has_role", sarah, "manager", bobProfile]);
    
    // CEO can see everyone
    await oso.insert(["has_role", john, "ceo", aliceProfile]);
    await oso.insert(["has_role", john, "ceo", bobProfile]);
    await oso.insert(["has_role", john, "ceo", sarahProfile]);
    
    console.log('✅ Test data setup complete\n');

    // Test 1: Employee viewing their own profile
    console.log('👤 Test 1: Employee viewing own profile');
    const aliceCanViewOwnBasic = await oso.authorize(alice, "view_basic", aliceProfile);
    const aliceCanViewOwnSensitive = await oso.authorize(alice, "view_sensitive", aliceProfile);
    console.log(`Alice can view her own basic profile: ${aliceCanViewOwnBasic}`);
    console.log(`Alice can view her own sensitive profile: ${aliceCanViewOwnSensitive}\n`);

    // Test 2: Employee viewing coworker profiles
    console.log('👥 Test 2: Employee viewing coworker profiles');
    const aliceCanViewBobBasic = await oso.authorize(alice, "view_basic", bobProfile);
    const aliceCanViewBobSensitive = await oso.authorize(alice, "view_sensitive", bobProfile);
    console.log(`Alice can view Bob's basic profile: ${aliceCanViewBobBasic}`);
    console.log(`Alice can view Bob's sensitive profile: ${aliceCanViewBobSensitive}\n`);

    // Test 3: Manager viewing direct reports
    console.log('👨‍💼 Test 3: Manager viewing direct reports');
    const sarahCanViewAliceBasic = await oso.authorize(sarah, "view_basic", aliceProfile);
    const sarahCanViewAliceSensitive = await oso.authorize(sarah, "view_sensitive", aliceProfile);
    const sarahCanViewBobBasic = await oso.authorize(sarah, "view_basic", bobProfile);
    const sarahCanViewBobSensitive = await oso.authorize(sarah, "view_sensitive", bobProfile);
    console.log(`Sarah can view Alice's basic profile: ${sarahCanViewAliceBasic}`);
    console.log(`Sarah can view Alice's sensitive profile: ${sarahCanViewAliceSensitive}`);
    console.log(`Sarah can view Bob's basic profile: ${sarahCanViewBobBasic}`);
    console.log(`Sarah can view Bob's sensitive profile: ${sarahCanViewBobSensitive}\n`);

    // Test 4: Manager viewing non-direct reports
    console.log('👨‍💼 Test 4: Manager viewing non-direct reports');
    const sarahCanViewJohnBasic = await oso.authorize(sarah, "view_basic", johnProfile);
    const sarahCanViewJohnSensitive = await oso.authorize(sarah, "view_sensitive", johnProfile);
    console.log(`Sarah can view John's basic profile: ${sarahCanViewJohnBasic}`);
    console.log(`Sarah can view John's sensitive profile: ${sarahCanViewJohnSensitive}\n`);

    // Test 5: CEO viewing everyone
    console.log('👑 Test 5: CEO viewing everyone');
    const johnCanViewAliceBasic = await oso.authorize(john, "view_basic", aliceProfile);
    const johnCanViewAliceSensitive = await oso.authorize(john, "view_sensitive", aliceProfile);
    const johnCanViewBobBasic = await oso.authorize(john, "view_basic", bobProfile);
    const johnCanViewBobSensitive = await oso.authorize(john, "view_sensitive", bobProfile);
    const johnCanViewSarahBasic = await oso.authorize(john, "view_basic", sarahProfile);
    const johnCanViewSarahSensitive = await oso.authorize(john, "view_sensitive", sarahProfile);
    console.log(`John can view Alice's basic profile: ${johnCanViewAliceBasic}`);
    console.log(`John can view Alice's sensitive profile: ${johnCanViewAliceSensitive}`);
    console.log(`John can view Bob's basic profile: ${johnCanViewBobBasic}`);
    console.log(`John can view Bob's sensitive profile: ${johnCanViewBobSensitive}`);
    console.log(`John can view Sarah's basic profile: ${johnCanViewSarahBasic}`);
    console.log(`John can view Sarah's sensitive profile: ${johnCanViewSarahSensitive}\n`);

    console.log('🎉 HR Policy testing complete!');

  } catch (error) {
    console.error('❌ Error testing policies:', error.message);
    console.error('Full error:', error);
  }
}

testHRPolicies();
