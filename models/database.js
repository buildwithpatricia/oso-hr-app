const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

class Database {
  constructor() {
    this.db = new sqlite3.Database(config.dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Companies table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          location TEXT,
          manager_id INTEGER,
          salary INTEGER,
          ssn TEXT,
          role TEXT DEFAULT 'employee',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id),
          FOREIGN KEY (manager_id) REFERENCES users (id)
        )
      `);

      // Time-off requests table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS timeoff_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT,
          status TEXT DEFAULT 'pending',
          approved_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (approved_by) REFERENCES users (id)
        )
      `);

      // Create indexes for better performance
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_timeoff_user ON timeoff_requests(user_id)`);
    });
  }

  // Helper method to run queries with promises
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
