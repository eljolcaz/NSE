import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.resolve('gastrologix.db');
const db = new Database(dbPath);

const salt = bcrypt.genSaltSync(10);
const hashAdmin = bcrypt.hashSync('admin123', salt);
const hashBodega = bcrypt.hashSync('bodega123', salt);
const hashProveedor = bcrypt.hashSync('proveedor123', salt);

console.log('Resetting passwords...');

try {
  // Update Admin
  const updateAdmin = db.prepare('UPDATE users SET password = ? WHERE email = ?');
  const resultAdmin = updateAdmin.run(hashAdmin, 'admin@gastrologix.com');
  console.log(`Admin password updated: ${resultAdmin.changes} rows affected.`);

  // Update Bodega
  const updateBodega = db.prepare('UPDATE users SET password = ? WHERE email = ?');
  const resultBodega = updateBodega.run(hashBodega, 'bodega@gastrologix.com');
  console.log(`Bodega password updated: ${resultBodega.changes} rows affected.`);

  // Update Proveedor
  const updateProveedor = db.prepare('UPDATE users SET password = ? WHERE email = ?');
  const resultProveedor = updateProveedor.run(hashProveedor, 'proveedor@gastrologix.com');
  console.log(`Proveedor password updated: ${resultProveedor.changes} rows affected.`);

  // Verify users exist
  const users = db.prepare('SELECT id, name, email, role FROM users').all();
  console.log('Current users in DB:', users);

} catch (error) {
  console.error('Error resetting passwords:', error);
}
