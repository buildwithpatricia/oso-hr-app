const { Oso } = require('oso-cloud');
const config = require('../config');

class OsoCloudService {
  constructor() {
    const osoUrl = 'https://cloud.osohq.com';
    this.oso = new Oso(osoUrl, config.osoApiKey, { environment: config.nodeEnv });
  }

  // Insert facts to Oso Cloud
  async insertFact(fact) {
    try {
      await this.oso.insert(fact);
    } catch (error) {
      console.error('Error inserting fact:', error);
      throw error;
    }
  }

  // Insert multiple facts in a batch
  async insertFacts(facts) {
    try {
      await this.oso.batch(facts);
    } catch (error) {
      console.error('Error inserting facts:', error);
      throw error;
    }
  }

  // Check authorization
  async authorize(user, action, resource) {
    try {
      return await this.oso.authorize(user, action, resource);
    } catch (error) {
      console.error('Authorization error:', error);
      return false;
    }
  }

  // Check if user can view basic profile
  async canViewBasicProfile(viewer, profileOwner) {
    return await this.authorize(viewer, "view_basic", profileOwner);
  }

  // Check if user can view sensitive profile
  async canViewSensitiveProfile(viewer, profileOwner) {
    return await this.authorize(viewer, "view_sensitive", profileOwner);
  }

  // Sync user data to Oso Cloud
  async syncUser(user) {
    const facts = [
      // User belongs to company
      ["has_role", {type: "User", id: user.id.toString()}, "employee", {type: "Company", id: user.companyId.toString()}],
    ];

    // If user has a manager, add that relationship
    if (user.managerId) {
      facts.push([
        "has_role", 
        {type: "User", id: user.id.toString()}, 
        "employee", 
        {type: "User", id: user.managerId.toString()}
      ]);
    }

    await this.insertFacts(facts);
  }

  // Sync company data to Oso Cloud
  async syncCompany(company) {
    const facts = [
      ["has_role", {type: "Company", id: company.id.toString()}, "organization", {type: "Company", id: company.id.toString()}]
    ];

    await this.insertFacts(facts);
  }
}

module.exports = OsoCloudService;
