const path = require('node:path');
const fs = require('node:fs');
const initSqlJs = require('sql.js');

let db = null;

async function getDatabase() {
  if (db) return db;

  const SQL = await initSqlJs();
  const dbPath = path.resolve(process.env.DB_PATH || './data/si-api.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  return db;
}

function saveDatabase() {
  if (!db) return;
  const dbPath = path.resolve(process.env.DB_PATH || './data/si-api.db');
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function execute(sql, params = []) {
  const safeParams = params.map(p => p === undefined ? null : p);
  db.run(sql, safeParams);
  saveDatabase();
}

function executeMulti(sql) {
  db.exec(sql);
  saveDatabase();
}

module.exports = { getDatabase, saveDatabase, closeDatabase, query, execute, executeMulti };
