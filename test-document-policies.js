const { Oso } = require('oso-cloud');
const config = require('./config');

// Test your Document policies
async function testDocumentPolicies() {
  const osoUrl = 'https://cloud.osohq.com';
  const oso = new Oso(osoUrl, config.osoApiKey, { environment: config.nodeEnv });

  // Test data
  const alice = { type: "User", id: "alice" };
  const bob = { type: "User", id: "bob" };
  const sarah = { type: "User", id: "sarah" };
  
  const document1 = { type: "Document", id: "doc1" };
  const document2 = { type: "Document", id: "doc2" };
  const document3 = { type: "Document", id: "doc3" };

  try {
    console.log('🧪 Testing Document policies...\n');

    // Insert test facts - assign roles to users for documents
    console.log('📝 Inserting test facts...');
    
    // Alice is owner of document1
    await oso.insert(["has_role", alice, "owner", document1]);
    
    // Bob is generalViewer of document1
    await oso.insert(["has_role", bob, "generalViewer", document1]);
    
    // Sarah is managerViewer of document2
    await oso.insert(["has_role", sarah, "managerViewer", document2]);
    
    // Alice has no role for document3 (should be denied)
    
    console.log('✅ Facts inserted successfully\n');

    // Test basic view permissions
    console.log('🔍 Testing basic view permissions...');
    
    const aliceCanViewDoc1 = await oso.authorize(alice, "view", document1);
    console.log(`Alice can view document1 (owner): ${aliceCanViewDoc1}`);
    
    const bobCanViewDoc1 = await oso.authorize(bob, "view", document1);
    console.log(`Bob can view document1 (generalViewer): ${bobCanViewDoc1}`);
    
    const sarahCanViewDoc2 = await oso.authorize(sarah, "view", document2);
    console.log(`Sarah can view document2 (managerViewer): ${sarahCanViewDoc2}`);
    
    const aliceCanViewDoc3 = await oso.authorize(alice, "view", document3);
    console.log(`Alice can view document3 (no role): ${aliceCanViewDoc3}\n`);

    // Test salary view permissions
    console.log('💰 Testing salary view permissions...');
    
    const aliceCanViewSalaryDoc1 = await oso.authorize(alice, "salary.view", document1);
    console.log(`Alice can view salary for document1 (owner): ${aliceCanViewSalaryDoc1}`);
    
    const bobCanViewSalaryDoc1 = await oso.authorize(bob, "salary.view", document1);
    console.log(`Bob can view salary for document1 (generalViewer): ${bobCanViewSalaryDoc1}`);
    
    const sarahCanViewSalaryDoc2 = await oso.authorize(sarah, "salary.view", document2);
    console.log(`Sarah can view salary for document2 (managerViewer): ${sarahCanViewSalaryDoc2}\n`);

    // Test SSN view permissions
    console.log('🔒 Testing SSN view permissions...');
    
    const aliceCanViewSSNDoc1 = await oso.authorize(alice, "ssn.view", document1);
    console.log(`Alice can view SSN for document1 (owner): ${aliceCanViewSSNDoc1}`);
    
    const bobCanViewSSNDoc1 = await oso.authorize(bob, "ssn.view", document1);
    console.log(`Bob can view SSN for document1 (generalViewer): ${bobCanViewSSNDoc1}`);
    
    const sarahCanViewSSNDoc2 = await oso.authorize(sarah, "ssn.view", document2);
    console.log(`Sarah can view SSN for document2 (managerViewer): ${sarahCanViewSSNDoc2}\n`);

    console.log('🎉 Document policy testing complete!');

  } catch (error) {
    console.error('❌ Error testing policies:', error.message);
    console.error('Make sure your OSO_AUTH_API_KEY is set correctly');
    console.error('Full error:', error);
  }
}

// Run the test
testDocumentPolicies();
