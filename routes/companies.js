const express = require('express');
const Company = require('../models/Company');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json({ companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Create new company
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const company = await Company.create({ name });
    res.status(201).json({ 
      message: 'Company created successfully',
      company 
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Get company users
router.get('/:id/users', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if user belongs to this company
    if (req.user.companyId !== company.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await company.getUsers();
    const basicProfiles = users.map(user => user.getBasicProfile());
    
    res.json({ users: basicProfiles });
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({ error: 'Failed to fetch company users' });
  }
});

module.exports = router;
