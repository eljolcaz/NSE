
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('gastrologix.db');
const db = new Database(dbPath);

const products = db.prepare('SELECT * FROM products').all();
console.log('Products:', products);
