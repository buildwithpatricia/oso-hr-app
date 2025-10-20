const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireCompany } = require('../middleware/auth');
const OsoCloudService = require('../auth/oso-cloud');

const router = express.Router();
const osoService = new OsoCloudService();

// Get all users in the same company
router.get('/', authenticateToken, requireCompany, async (req, res) => {
  try {
    const users = await User.findByCompany(req.user.companyId);
    
    // Filter users based on Oso Cloud authorization for basic profile viewing
    const authorizedUsers = [];
    const viewerOso = { type: "User", id: req.user.id.toString() };
    
    for (const user of users) {
      const userProfile = { type: "Profile", id: `profile_${user.id}` };
      const canViewBasic = await osoService.authorize(viewerOso, "view_basic", userProfile);
      
      if (canViewBasic) {
        // Check if viewer can see sensitive data (CEO or manager viewing their reports)
        const canViewSensitive = await osoService.authorize(viewerOso, "view_sensitive", userProfile);
        
        if (canViewSensitive) {
          authorizedUsers.push(user.getSensitiveProfile());
        } else {
          authorizedUsers.push(user.getBasicProfile());
        }
      }
    }
    
    res.json({ users: authorizedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user profile by ID
router.get('/:id', authenticateToken, requireCompany, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if users are in the same company
    if (targetUser.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check what level of profile information the viewer can access using Oso Cloud
    const viewerOso = { type: "User", id: req.user.id.toString() };
    const userProfile = { type: "Profile", id: `profile_${targetUser.id}` };
    const canViewSensitive = await osoService.authorize(viewerOso, "view_sensitive", userProfile);
    
    
    const profile = canViewSensitive 
      ? targetUser.getSensitiveProfile()
      : targetUser.getBasicProfile();

    res.json({ user: profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get user's direct reports
router.get('/:id/reports', authenticateToken, requireCompany, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if users are in the same company
    if (targetUser.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if the requesting user can view this user's reports using Oso Cloud
    const viewerOso = { type: "User", id: req.user.id.toString() };
    const userProfile = { type: "Profile", id: `profile_${targetUser.id}` };
    const canViewSensitive = await osoService.authorize(viewerOso, "view_sensitive", userProfile);
    
    if (!canViewSensitive) {
      return res.status(403).json({ error: 'You are not authorized to view reports for this user' });
    }

    const directReports = await User.findDirectReports(targetUser.id);
    const reports = directReports.map(user => user.getSensitiveProfile()); // Managers can see sensitive data
    
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get user's all reports (direct and indirect)
router.get('/:id/all-reports', authenticateToken, requireCompany, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if users are in the same company
    if (targetUser.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if the requesting user can view this user's reports using Oso Cloud
    const viewerOso = { type: "User", id: req.user.id.toString() };
    const userProfile = { type: "Profile", id: `profile_${targetUser.id}` };
    const canViewSensitive = await osoService.authorize(viewerOso, "view_sensitive", userProfile);
    
    if (!canViewSensitive) {
      return res.status(403).json({ error: 'You are not authorized to view reports for this user' });
    }

    const allReports = await User.findAllReports(targetUser.id);
    const reports = allReports.map(user => user.getSensitiveProfile()); // Managers can see sensitive data
    
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ error: 'Failed to fetch all reports' });
  }
});

// Update user profile
router.put('/:id', authenticateToken, requireCompany, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Users can only update their own profile
    if (targetUser.id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { firstName, lastName, location } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (location !== undefined) updateData.location = location;

    const updatedUser = await targetUser.update(updateData);
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser.getBasicProfile()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
