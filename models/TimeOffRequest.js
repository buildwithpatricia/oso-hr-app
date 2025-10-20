const Database = require('./database');
const FactSyncService = require('../services/fact-sync');

class TimeOffRequest {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.startDate = data.start_date;
    this.endDate = data.end_date;
    this.reason = data.reason;
    this.status = data.status || 'pending';
    this.approvedBy = data.approved_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(requestData) {
    const db = new Database();
    try {
      const result = await db.run(`
        INSERT INTO timeoff_requests (user_id, start_date, end_date, reason, status)
        VALUES (?, ?, ?, ?, ?)
      `, [
        requestData.userId,
        requestData.startDate,
        requestData.endDate,
        requestData.reason,
        requestData.status || 'pending'
      ]);

      const newRequest = await TimeOffRequest.findById(result.id);
      
      // Sync facts to Oso Cloud
      const factSync = new FactSyncService();
      await factSync.syncTimeOffRequestCreated(newRequest);
      
      return newRequest;
    } finally {
      db.close();
    }
  }

  static async findById(id) {
    const db = new Database();
    try {
      const row = await db.get('SELECT * FROM timeoff_requests WHERE id = ?', [id]);
      return row ? new TimeOffRequest(row) : null;
    } finally {
      db.close();
    }
  }

  static async findByUser(userId) {
    const db = new Database();
    try {
      const rows = await db.all(`
        SELECT * FROM timeoff_requests 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `, [userId]);
      return rows.map(row => new TimeOffRequest(row));
    } finally {
      db.close();
    }
  }

  static async findAll() {
    const db = new Database();
    try {
      const rows = await db.all('SELECT * FROM timeoff_requests ORDER BY created_at DESC');
      return rows.map(row => new TimeOffRequest(row));
    } finally {
      db.close();
    }
  }

  static async findByCompany(companyId) {
    const db = new Database();
    try {
      const rows = await db.all(`
        SELECT tor.* FROM timeoff_requests tor
        JOIN users u ON tor.user_id = u.id
        WHERE u.company_id = ?
        ORDER BY tor.created_at DESC
      `, [companyId]);
      return rows.map(row => new TimeOffRequest(row));
    } finally {
      db.close();
    }
  }

  static async findPending() {
    const db = new Database();
    try {
      const rows = await db.all(`
        SELECT tor.*, u.first_name, u.last_name, u.email
        FROM timeoff_requests tor
        JOIN users u ON tor.user_id = u.id
        WHERE tor.status = 'pending'
        ORDER BY tor.created_at DESC
      `);
      return rows.map(row => ({
        ...new TimeOffRequest(row),
        userName: `${row.first_name} ${row.last_name}`,
        userEmail: row.email
      }));
    } finally {
      db.close();
    }
  }

  async approve(approvedBy) {
    const db = new Database();
    try {
      await db.run(`
        UPDATE timeoff_requests 
        SET status = 'approved', approved_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [approvedBy, this.id]);
      
      return await TimeOffRequest.findById(this.id);
    } finally {
      db.close();
    }
  }

  async reject(approvedBy) {
    const db = new Database();
    try {
      await db.run(`
        UPDATE timeoff_requests 
        SET status = 'rejected', approved_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [approvedBy, this.id]);
      
      return await TimeOffRequest.findById(this.id);
    } finally {
      db.close();
    }
  }

  async getUser() {
    const User = require('./User');
    return await User.findById(this.userId);
  }

  async getApprover() {
    if (!this.approvedBy) return null;
    const User = require('./User');
    return await User.findById(this.approvedBy);
  }
}

module.exports = TimeOffRequest;
