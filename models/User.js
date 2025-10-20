const bcrypt = require('bcryptjs');
const Database = require('./database');
const FactSyncService = require('../services/fact-sync');

class User {
  constructor(data) {
    this.id = data.id;
    this.companyId = data.company_id;
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.location = data.location;
    this.managerId = data.manager_id;
    this.salary = data.salary;
    this.ssn = data.ssn;
    this.role = data.role || 'employee';
    this.createdAt = data.created_at;
  }

  // Get basic profile information (safe for all users)
  getBasicProfile() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      location: this.location,
      managerId: this.managerId,
      role: this.role
    };
  }

  // Get sensitive profile information (only for managers)
  getSensitiveProfile() {
    return {
      ...this.getBasicProfile(),
      salary: this.salary,
      ssn: this.ssn
    };
  }

  // Get full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Static methods for database operations
  static async create(userData) {
    const db = new Database();
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const result = await db.run(`
        INSERT INTO users (company_id, email, password_hash, first_name, last_name, location, manager_id, salary, ssn, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.companyId,
        userData.email,
        hashedPassword,
        userData.firstName,
        userData.lastName,
        userData.location,
        userData.managerId || null,
        userData.salary || null,
        userData.ssn || null,
        userData.role || 'employee'
      ]);

      const newUser = await User.findById(result.id);
      
      // Sync facts to Oso Cloud
      const factSync = new FactSyncService();
      await factSync.syncUserCreated(newUser);
      
      return newUser;
    } finally {
      db.close();
    }
  }

  static async findById(id) {
    const db = new Database();
    try {
      const row = await db.get('SELECT * FROM users WHERE id = ?', [id]);
      return row ? new User(row) : null;
    } finally {
      db.close();
    }
  }

  static async findByEmail(email) {
    const db = new Database();
    try {
      const row = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      return row ? new User(row) : null;
    } finally {
      db.close();
    }
  }

  static async findAll() {
    const db = new Database();
    try {
      const rows = await db.all('SELECT * FROM users');
      return rows.map(row => new User(row));
    } finally {
      db.close();
    }
  }

  static async findByCompany(companyId) {
    const db = new Database();
    try {
      const rows = await db.all('SELECT * FROM users WHERE company_id = ?', [companyId]);
      return rows.map(row => new User(row));
    } finally {
      db.close();
    }
  }

  static async findDirectReports(managerId) {
    const db = new Database();
    try {
      const rows = await db.all('SELECT * FROM users WHERE manager_id = ?', [managerId]);
      return rows.map(row => new User(row));
    } finally {
      db.close();
    }
  }

  static async findAllReports(managerId) {
    const db = new Database();
    try {
      // Get all direct and indirect reports using recursive CTE
      const rows = await db.all(`
        WITH RECURSIVE reports AS (
          SELECT * FROM users WHERE manager_id = ?
          UNION ALL
          SELECT u.* FROM users u
          INNER JOIN reports r ON u.manager_id = r.id
        )
        SELECT * FROM reports
      `, [managerId]);
      return rows.map(row => new User(row));
    } finally {
      db.close();
    }
  }

  async verifyPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  async update(data) {
    const db = new Database();
    try {
      const fields = [];
      const values = [];

      if (data.firstName) {
        fields.push('first_name = ?');
        values.push(data.firstName);
      }
      if (data.lastName) {
        fields.push('last_name = ?');
        values.push(data.lastName);
      }
      if (data.location !== undefined) {
        fields.push('location = ?');
        values.push(data.location);
      }
      if (data.managerId !== undefined) {
        fields.push('manager_id = ?');
        values.push(data.managerId);
      }
      if (data.salary !== undefined) {
        fields.push('salary = ?');
        values.push(data.salary);
      }
      if (data.ssn !== undefined) {
        fields.push('ssn = ?');
        values.push(data.ssn);
      }
      if (data.role) {
        fields.push('role = ?');
        values.push(data.role);
      }

      if (fields.length === 0) return this;

      values.push(this.id);
      await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
      
      return await User.findById(this.id);
    } finally {
      db.close();
    }
  }
}

module.exports = User;
