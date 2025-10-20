const Database = require('./database');

class Company {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.created_at;
  }

  static async create(companyData) {
    const db = new Database();
    try {
      const result = await db.run(
        'INSERT INTO companies (name) VALUES (?)',
        [companyData.name]
      );
      return await Company.findById(result.id);
    } finally {
      db.close();
    }
  }

  static async findById(id) {
    const db = new Database();
    try {
      const row = await db.get('SELECT * FROM companies WHERE id = ?', [id]);
      return row ? new Company(row) : null;
    } finally {
      db.close();
    }
  }

  static async findAll() {
    const db = new Database();
    try {
      const rows = await db.all('SELECT * FROM companies ORDER BY name');
      return rows.map(row => new Company(row));
    } finally {
      db.close();
    }
  }

  async getUsers() {
    const db = new Database();
    try {
      const rows = await db.all('SELECT * FROM users WHERE company_id = ?', [this.id]);
      return rows.map(row => new (require('./User'))(row));
    } finally {
      db.close();
    }
  }
}

module.exports = Company;
