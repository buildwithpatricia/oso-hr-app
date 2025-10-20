const express = require('express');
const TimeOffRequest = require('../models/TimeOffRequest');
const User = require('../models/User');
const { authenticateToken, requireCompany } = require('../middleware/auth');
const OsoCloudService = require('../auth/oso-cloud');

const router = express.Router();
const osoService = new OsoCloudService();

// Get all time-off requests user can view
router.get('/', authenticateToken, requireCompany, async (req, res) => {
  try {
    const requests = await TimeOffRequest.findByCompany(req.user.companyId);
    
    // Filter requests based on Oso Cloud authorization
    const viewableRequests = [];
    const viewerOso = { type: "User", id: req.user.id.toString() };
    
    for (const request of requests) {
      const user = await request.getUser();
      const requestOso = { type: "TimeOffRequest", id: `request_${request.id}` };
      
      // Check if user can view this request using Oso Cloud
      const canView = await osoService.authorize(viewerOso, "view", requestOso);
      if (canView) {
        viewableRequests.push({
          ...request,
          userName: user.getFullName(),
          userEmail: user.email
        });
      }
    }
    
    res.json({ requests: viewableRequests });
  } catch (error) {
    console.error('Error fetching time-off requests:', error);
    res.status(500).json({ error: 'Failed to fetch time-off requests' });
  }
});

// Get user's own time-off requests
router.get('/my-requests', authenticateToken, requireCompany, async (req, res) => {
  try {
    const requests = await TimeOffRequest.findByUser(req.user.id);
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching user time-off requests:', error);
    res.status(500).json({ error: 'Failed to fetch time-off requests' });
  }
});

// Get pending time-off requests (for managers)
router.get('/pending', authenticateToken, requireCompany, async (req, res) => {
  try {
    const pendingRequests = await TimeOffRequest.findPending();
    
    // Filter requests that this user can approve using Oso Cloud
    const approvableRequests = [];
    const viewerOso = { type: "User", id: req.user.id.toString() };
    
    for (const request of pendingRequests) {
      // Get the user for this request
      const user = await User.findById(request.userId);
      
      if (user && user.companyId === req.user.companyId) {
        const requestOso = { type: "TimeOffRequest", id: `request_${request.id}` };
        
        // Check if user can approve this request using Oso Cloud
        const canApprove = await osoService.authorize(viewerOso, "approve", requestOso);
        if (canApprove) {
          approvableRequests.push({
            ...request,
            userName: user.getFullName(),
            userEmail: user.email
          });
        }
      }
    }
    
    res.json({ requests: approvableRequests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// Create new time-off request
router.post('/', authenticateToken, requireCompany, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // Create date-only comparisons (ignore time)
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    if (startDateOnly > endDateOnly) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    if (startDateOnly < todayOnly) {
      return res.status(400).json({ error: 'Cannot request time off for past dates' });
    }

    const requestData = {
      userId: req.user.id,
      startDate,
      endDate,
      reason: reason || ''
    };

    const request = await TimeOffRequest.create(requestData);
    
    res.status(201).json({ 
      message: 'Time-off request submitted successfully', 
      request 
    });
  } catch (error) {
    console.error('Error creating time-off request:', error);
    res.status(500).json({ error: 'Failed to create time-off request' });
  }
});

// Get specific time-off request
router.get('/:id', authenticateToken, requireCompany, async (req, res) => {
  try {
    const request = await TimeOffRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Time-off request not found' });
    }

    // For now, allow viewing if in same company (bypass Oso temporarily)
    const user = await request.getUser();
    if (user.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const approver = await request.getApprover();
    
    res.json({
      request: {
        ...request,
        userName: user.getFullName(),
        userEmail: user.email,
        approverName: approver ? approver.getFullName() : null
      }
    });
  } catch (error) {
    console.error('Error fetching time-off request:', error);
    res.status(500).json({ error: 'Failed to fetch time-off request' });
  }
});

// Approve time-off request
router.post('/:id/approve', authenticateToken, requireCompany, async (req, res) => {
  try {
    const request = await TimeOffRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Time-off request not found' });
    }

    // Check authorization using Oso Cloud
    const user = await request.getUser();
    if (user.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'You are not authorized to approve this request' });
    }

    const viewerOso = { type: "User", id: req.user.id.toString() };
    const requestOso = { type: "TimeOffRequest", id: `request_${request.id}` };
    
    // Check if user can approve this request using Oso Cloud
    const canApprove = await osoService.authorize(viewerOso, "approve", requestOso);
    if (!canApprove) {
      return res.status(403).json({ error: 'You are not authorized to approve this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    const approvedRequest = await request.approve(req.user.id);
    
    res.json({
      message: 'Time-off request approved successfully',
      request: approvedRequest
    });
  } catch (error) {
    console.error('Error approving time-off request:', error);
    res.status(500).json({ error: 'Failed to approve time-off request' });
  }
});

// Reject time-off request
router.post('/:id/reject', authenticateToken, requireCompany, async (req, res) => {
  try {
    const request = await TimeOffRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Time-off request not found' });
    }

    // Check authorization using Oso Cloud
    const user = await request.getUser();
    if (user.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'You are not authorized to reject this request' });
    }

    const viewerOso = { type: "User", id: req.user.id.toString() };
    const requestOso = { type: "TimeOffRequest", id: `request_${request.id}` };
    
    // Check if user can approve this request (same permission as approve for rejection)
    const canReject = await osoService.authorize(viewerOso, "approve", requestOso);
    if (!canReject) {
      return res.status(403).json({ error: 'You are not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    const rejectedRequest = await request.reject(req.user.id);
    
    res.json({
      message: 'Time-off request rejected successfully',
      request: rejectedRequest
    });
  } catch (error) {
    console.error('Error rejecting time-off request:', error);
    res.status(500).json({ error: 'Failed to reject time-off request' });
  }
});

module.exports = router;
