import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('gastrologix.db');
const db = new Database(dbPath);

console.log('Initializing database...');

// Users Table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'bodega', 'proveedor')),
    supplier_id INTEGER,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  )
`);

// Products Table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stock REAL DEFAULT 0,
    stock_minimo REAL DEFAULT 0,
    unidad_medida TEXT NOT NULL
  )
`);

// Suppliers Table
db.exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
  )
`);

// Supplier Products (Many-to-Many)
db.exec(`
  CREATE TABLE IF NOT EXISTS supplier_products (
    supplier_id INTEGER,
    product_id INTEGER,
    PRIMARY KEY (supplier_id, product_id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);

// Orders Table
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'enviado', 'recibido', 'cancelado')),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  )
`);

// Order Details Table
db.exec(`
  CREATE TABLE IF NOT EXISTS order_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);

// Movements Table
db.exec(`
  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('entrada', 'salida')),
    quantity REAL NOT NULL,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);

// Seed Data
const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, username, password, role, supplier_id) VALUES (?, ?, ?, ?, ?)');
const insertProduct = db.prepare('INSERT OR IGNORE INTO products (name, stock, stock_minimo, unidad_medida) VALUES (?, ?, ?, ?)');
const insertSupplier = db.prepare('INSERT OR IGNORE INTO suppliers (name, company, phone, email, address) VALUES (?, ?, ?, ?, ?)');
const insertSupplierProduct = db.prepare('INSERT OR IGNORE INTO supplier_products (supplier_id, product_id) VALUES (?, ?)');

// Create Notifications Table
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    supplier_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  )
`);

const salt = bcrypt.genSaltSync(10);
const hashAdmin = bcrypt.hashSync('admin123', salt);
const hashBodega = bcrypt.hashSync('bodega123', salt);
const hashProveedor = bcrypt.hashSync('proveedor123', salt);

// Insert Suppliers first
insertSupplier.run('Juan Pérez', 'AgroFresh', '555-0101', 'ventas@agrofresh.com', 'Calle Falsa 123');
insertSupplier.run('Maria Lopez', 'Verduras del Valle', '555-0202', 'contacto@verdurasvalle.com', 'Av. Siempre Viva 742');

// Insert Users (referencing suppliers)
insertUser.run('Administrador', 'admin', hashAdmin, 'admin', null);
insertUser.run('Encargado Bodega', 'bodega', hashBodega, 'bodega', null);
insertUser.run('Proveedor Principal', 'proveedor', hashProveedor, 'proveedor', 1);

insertProduct.run('Tomate', 12, 20, 'kg');
insertProduct.run('Lechuga', 50, 30, 'unidad');
insertProduct.run('Cebolla', 40, 15, 'kg');
insertProduct.run('Papa', 100, 50, 'kg');

// Assign products to suppliers (assuming IDs 1 and 2 for suppliers, and 1-4 for products)
// AgroFresh supplies Tomate (1) and Lechuga (2)
insertSupplierProduct.run(1, 1);
insertSupplierProduct.run(1, 2);
// Verduras del Valle supplies Cebolla (3) and Papa (4)
insertSupplierProduct.run(2, 3);
insertSupplierProduct.run(2, 4);

// Create a sample order for Supplier 1 (AgroFresh)
const insertOrder = db.prepare('INSERT INTO orders (supplier_id, status, date) VALUES (?, ?, ?)');
const insertOrderDetail = db.prepare('INSERT INTO order_details (order_id, product_id, quantity) VALUES (?, ?, ?)');

const orderInfo = insertOrder.run(1, 'pendiente', new Date().toISOString());
insertOrderDetail.run(orderInfo.lastInsertRowid, 1, 10); // 10kg Tomate
insertOrderDetail.run(orderInfo.lastInsertRowid, 2, 5);  // 5 units Lechuga

console.log('Database initialized successfully.');
