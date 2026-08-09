import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/pool.db');

class DBService {
  constructor() {
    this.db = null;
  }

  initialize() {
    try {
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();
      console.log('✅ SQLite Database initialized');
    } catch (err) {
      console.error('❌ Database error:', err);
    }
  }

  createTables() {
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        last_login_at TEXT
      )
    `;

    const logsTable = `
      CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        access_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        notes TEXT
      )
    `;

    this.db.exec(usersTable);
    this.db.exec(logsTable);

    // Insert admin if not exists
    const adminExists = this.db.prepare('SELECT * FROM users WHERE email = ?').get('admin@pool.local');
    if (!adminExists) {
      this.db.prepare(`
        INSERT INTO users (email, password_hash, full_name, phone, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('admin@pool.local', 'Admin@123!', 'Administrador', null, 'admin', 'active', new Date().toISOString());
    }
  }

  getUsers() {
    return this.db.prepare('SELECT * FROM users').all();
  }

  createUser(email, password, full_name, phone) {
    return this.db.prepare(`
      INSERT INTO users (email, password_hash, full_name, phone, role, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(email, password, full_name, phone || null, 'user', 'active', new Date().toISOString());
  }

  updateUser(id, updates) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.prepare(sql).run(...values);
  }

  deleteUser(id) {
    return this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  getLogs() {
    return this.db.prepare('SELECT * FROM access_logs').all();
  }

  createLog(user_id, access_type, notes) {
    return this.db.prepare(`
      INSERT INTO access_logs (user_id, access_type, timestamp, notes)
      VALUES (?, ?, ?, ?)
    `).run(user_id, access_type, new Date().toISOString(), notes || null);
  }
}

export default new DBService();
