import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('gastrologix.db');
const db = new Database(dbPath);

const users = db.prepare('SELECT * FROM users').all();
console.log('Users:', users);
