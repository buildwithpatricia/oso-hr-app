const OsoCloudService = require('../auth/oso-cloud');

class FactSyncService {
  constructor() {
    this.osoService = new OsoCloudService();
  }

  // Sync user facts to Oso Cloud when a user is created
  async syncUserCreated(user) {
    try {
      console.log('🔄 Syncing user creation to Oso Cloud:', user.id);
      
      // Convert user to Oso Cloud format
      const userOso = { type: "User", id: user.id.toString() };
      
      // Add user to company
      await this.osoService.insertFact(["has_role", userOso, "employee", { type: "Company", id: `company_${user.companyId}` }]);
      
      // Add profile ownership
      const userProfile = { type: "Profile", id: `profile_${user.id}` };
      await this.osoService.insertFact(["has_role", userOso, "owner", userProfile]);
      
      // Add coworker relationships with existing users in the same company
      const existingUsers = await this.getUsersInCompany(user.companyId);
      for (const existingUser of existingUsers) {
        if (existingUser.id !== user.id) {
          const existingUserOso = { type: "User", id: existingUser.id.toString() };
          // User is coworker of existing users
          const existingUserProfile = { type: "Profile", id: `profile_${existingUser.id}` };
          await this.osoService.insertFact(["has_role", userOso, "coworker", existingUserProfile]);
          
          // Existing users are coworkers of new user
          await this.osoService.insertFact(["has_role", existingUserOso, "coworker", userProfile]);
        }
      }
      
      // Add manager relationships if user has a manager
      if (user.managerId) {
        const manager = await this.getUserById(user.managerId);
        if (manager) {
          const managerOso = { type: "User", id: manager.id.toString() };
          // User is direct report of manager
          await this.osoService.insertFact(["has_role", userOso, "employee", managerOso]);
          
          // Manager can view user's profile with sensitive data
          await this.osoService.insertFact(["has_role", managerOso, "manager", userProfile]);
        }
      }
      
      // Add CEO relationships if user is CEO or if there are CEOs in the company
      if (user.role === 'ceo') {
        // CEO can view all profiles in the company
        for (const existingUser of existingUsers) {
          if (existingUser.id !== user.id) {
            const existingUserProfile = { type: "Profile", id: `profile_${existingUser.id}` };
            await this.osoService.insertFact(["has_role", userOso, "ceo", existingUserProfile]);
          }
        }
      } else {
        // Check if there are CEOs in the company who should be able to view this user
        const ceos = existingUsers.filter(u => u.role === 'ceo');
        for (const ceo of ceos) {
          const ceoOso = { type: "User", id: ceo.id.toString() };
          await this.osoService.insertFact(["has_role", ceoOso, "ceo", userProfile]);
        }
      }
      
      console.log('✅ User sync completed for:', user.id);
    } catch (error) {
      console.error('❌ Error syncing user to Oso Cloud:', error);
      // Don't throw error - fact syncing shouldn't break user creation
    }
  }

  // Sync user facts when a user is updated (e.g., role change, manager change)
  async syncUserUpdated(oldUser, newUser) {
    try {
      console.log('🔄 Syncing user update to Oso Cloud:', newUser.id);
      
      // If role changed to/from CEO, update CEO relationships
      if (oldUser.role !== newUser.role) {
        if (newUser.role === 'ceo') {
          // User became CEO - can now view all profiles
          const allUsers = await this.getUsersInCompany(newUser.companyId);
          for (const user of allUsers) {
            if (user.id !== newUser.id) {
              const userProfile = { type: "Profile", id: `profile_${user.id}` };
              await this.osoService.insertFact(["has_role", newUser, "ceo", userProfile]);
            }
          }
        } else if (oldUser.role === 'ceo') {
          // User is no longer CEO - remove CEO relationships
          const allUsers = await this.getUsersInCompany(newUser.companyId);
          for (const user of allUsers) {
            if (user.id !== newUser.id) {
              const userProfile = { type: "Profile", id: `profile_${user.id}` };
              await this.osoService.deleteFact(["has_role", newUser, "ceo", userProfile]);
            }
          }
        }
      }
      
      // If manager changed, update manager relationships
      if (oldUser.managerId !== newUser.managerId) {
        // Remove old manager relationship
        if (oldUser.managerId) {
          const oldManager = await this.getUserById(oldUser.managerId);
          if (oldManager) {
            const userProfile = { type: "Profile", id: `profile_${newUser.id}` };
            await this.osoService.deleteFact(["has_role", oldManager, "manager", userProfile]);
            await this.osoService.deleteFact(["has_role", newUser, "employee", oldManager]);
          }
        }
        
        // Add new manager relationship
        if (newUser.managerId) {
          const newManager = await this.getUserById(newUser.managerId);
          if (newManager) {
            await this.osoService.insertFact(["has_role", newUser, "employee", newManager]);
            const userProfile = { type: "Profile", id: `profile_${newUser.id}` };
            await this.osoService.insertFact(["has_role", newManager, "manager", userProfile]);
          }
        }
      }
      
      console.log('✅ User update sync completed for:', newUser.id);
    } catch (error) {
      console.error('❌ Error syncing user update to Oso Cloud:', error);
    }
  }

  // Helper method to get users in a company
  async getUsersInCompany(companyId) {
    const User = require('../models/User');
    return await User.findByCompany(companyId);
  }

  // Helper method to get user by ID
  async getUserById(userId) {
    const User = require('../models/User');
    return await User.findById(userId);
  }

  // Sync time-off request facts to Oso Cloud when a request is created
  async syncTimeOffRequestCreated(request) {
    try {
      console.log('🔄 Syncing time-off request creation to Oso Cloud:', request.id);
      
      // Convert request to Oso Cloud format
      const requestOso = { type: "TimeOffRequest", id: `request_${request.id}` };
      const userOso = { type: "User", id: request.userId.toString() };
      
      // Add owner role for the request creator
      await this.osoService.insertFact(["has_role", userOso, "owner", requestOso]);
      
      // Add approver roles for managers who can approve this request
      const user = await this.getUserById(request.userId);
      if (user && user.managerId) {
        // Direct manager can approve
        const directManager = await this.getUserById(user.managerId);
        if (directManager) {
          const managerOso = { type: "User", id: directManager.id.toString() };
          await this.osoService.insertFact(["has_role", managerOso, "approver", requestOso]);
        }
        
        // Find all managers in the hierarchy (indirect managers)
        const allManagers = await this.findAllManagers(user.managerId);
        for (const manager of allManagers) {
          const managerOso = { type: "User", id: manager.id.toString() };
          await this.osoService.insertFact(["has_role", managerOso, "approver", requestOso]);
        }
      }
      
      // Add CEO approver role if there are CEOs in the company
      const ceos = await this.findCEOsInCompany(user.companyId);
      for (const ceo of ceos) {
        const ceoOso = { type: "User", id: ceo.id.toString() };
        await this.osoService.insertFact(["has_role", ceoOso, "approver", requestOso]);
      }
      
      console.log('✅ Time-off request sync completed for:', request.id);
    } catch (error) {
      console.error('❌ Error syncing time-off request to Oso Cloud:', error);
      // Don't throw error - fact syncing shouldn't break request creation
    }
  }

  // Helper to find all managers in the hierarchy
  async findAllManagers(managerId) {
    const managers = [];
    let currentManagerId = managerId;
    
    while (currentManagerId) {
      const manager = await this.getUserById(currentManagerId);
      if (manager) {
        managers.push(manager);
        currentManagerId = manager.managerId;
      } else {
        break;
      }
    }
    
    return managers;
  }

  // Helper to find CEOs in a company
  async findCEOsInCompany(companyId) {
    const User = require('../models/User');
    const users = await User.findByCompany(companyId);
    return users.filter(user => user.role === 'ceo');
  }
}

module.exports = FactSyncService;
