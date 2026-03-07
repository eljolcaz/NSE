import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'gastrologix.db');

// Initialize DB if not exists
if (!fs.existsSync(dbPath)) {
  console.log('Database not found. Initializing...');
  import('./db/init.ts');
}

const db = new Database(dbPath);
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

app.use(cors());
app.use(express.json());

// Middleware to verify token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// SSE Clients
let clients: any[] = [];

// Helper to send events to all clients
const sendEvent = (data: any) => {
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
};

// --- Auth Routes ---
app.post('/api/login', (req: any, res: any) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, supplier_id: user.supplier_id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, supplier_id: user.supplier_id } });
});

// --- SSE Endpoint ---
app.get('/api/notifications', (req: any, res: any) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// --- Notification Routes ---
app.get('/api/user/notifications', authenticateToken, (req: any, res: any) => {
  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params = [];

  if (req.user.role === 'proveedor') {
    query += ' AND supplier_id = ?';
    params.push(req.user.supplier_id);
  } else {
    // Admin and Bodega see general notifications or specific ones
    // For simplicity, let's say they see all non-supplier specific ones or ones for them
    // But currently we only have supplier_id. Let's assume null supplier_id means internal notification.
    query += ' AND (supplier_id IS NULL OR supplier_id = ?)';
    params.push(req.user.supplier_id || -1); // -1 if null to avoid matching nothing if logic requires
    // Actually, let's just show all for admin/bodega for now, or filter by user_id if we had it.
    // Let's keep it simple: Providers see theirs. Admin/Bodega see everything else?
    // Let's just return all for Admin/Bodega for now to ensure they see alerts.
    if (req.user.role === 'admin' || req.user.role === 'bodega') {
       query = 'SELECT * FROM notifications WHERE supplier_id IS NULL'; 
       // Or maybe we want them to see everything?
       // Let's stick to the requested logic: Providers see theirs.
    }
  }
  
  // Better logic:
  if (req.user.role === 'proveedor') {
     const notifs = db.prepare('SELECT * FROM notifications WHERE supplier_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.supplier_id);
     return res.json(notifs);
  } else {
     const notifs = db.prepare('SELECT * FROM notifications WHERE supplier_id IS NULL ORDER BY created_at DESC LIMIT 50').all();
     return res.json(notifs);
  }
});

app.post('/api/notifications/mark-read', authenticateToken, (req: any, res: any) => {
  // Mark all as read for the user context
  if (req.user.role === 'proveedor') {
    db.prepare('UPDATE notifications SET read = 1 WHERE supplier_id = ?').run(req.user.supplier_id);
  } else {
    db.prepare('UPDATE notifications SET read = 1 WHERE supplier_id IS NULL').run();
  }
  res.json({ success: true });
});

// --- Dashboard Stats ---
app.get('/api/dashboard', authenticateToken, (req: any, res: any) => {
  console.log('Dashboard requested by:', req.user.username, 'Role:', req.user.role);
  const stats: any = {};

  if (req.user.role === 'proveedor') {
    const supplierId = req.user.supplier_id;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE supplier_id = ? AND status = 'pendiente'").get(supplierId) as any;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE supplier_id = ? AND (status = 'recibido' OR status = 'enviado')").get(supplierId) as any;
    const recentOrders = db.prepare('SELECT * FROM orders WHERE supplier_id = ? ORDER BY date DESC LIMIT 5').all(supplierId);
    
    stats.pendingOrders = pendingOrders.count;
    stats.completedOrders = completedOrders.count;
    stats.recentOrdersList = recentOrders;
    
  } else {
    // Admin / Bodega
    console.log('Fetching admin/bodega stats');
    const totalInventory = db.prepare('SELECT SUM(stock) as total FROM products').get() as any;
    const lowStock = db.prepare('SELECT * FROM products WHERE stock <= stock_minimo').all();
    const recentOrdersCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date >= date('now', '-7 days')").get() as any;
    const recentOrdersList = db.prepare('SELECT o.*, s.company as supplier_company FROM orders o JOIN suppliers s ON o.supplier_id = s.id ORDER BY o.date DESC LIMIT 5').all();
    
    // Get recent movements for dashboard
    const recentMovements = db.prepare(`
      SELECT m.*, p.name as product_name 
      FROM movements m 
      JOIN products p ON m.product_id = p.id 
      ORDER BY m.date DESC 
      LIMIT 5
    `).all();
    
    console.log('Total Inventory:', totalInventory);
    
    stats.totalInventory = totalInventory.total;
    stats.lowStock = lowStock;
    stats.recentOrders = recentOrdersCount.count;
    stats.recentOrdersList = recentOrdersList;
    stats.recentMovements = recentMovements;
  }

  res.json(stats);
});

// --- Product Routes ---
app.get('/api/products', authenticateToken, (req: any, res: any) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

app.post('/api/products', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'bodega') return res.sendStatus(403);
  const { name, stock, stock_minimo, unidad_medida } = req.body;
  const info = db.prepare('INSERT INTO products (name, stock, stock_minimo, unidad_medida) VALUES (?, ?, ?, ?)').run(name, stock, stock_minimo, unidad_medida);
  res.json({ id: info.lastInsertRowid, ...req.body });
});

app.put('/api/products/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'bodega') return res.sendStatus(403);
  const { name, stock, stock_minimo, unidad_medida } = req.body;
  db.prepare('UPDATE products SET name = ?, stock = ?, stock_minimo = ?, unidad_medida = ? WHERE id = ?').run(name, stock, stock_minimo, unidad_medida, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

// --- Supplier Routes ---
app.get('/api/suppliers', authenticateToken, (req: any, res: any) => {
  const suppliers = db.prepare('SELECT * FROM suppliers').all();
  // Get products for each supplier
  const suppliersWithProducts = suppliers.map(supplier => {
    const products = db.prepare(`
      SELECT p.id, p.name 
      FROM products p 
      JOIN supplier_products sp ON p.id = sp.product_id 
      WHERE sp.supplier_id = ?
    `).all(supplier.id);
    return { ...supplier, products };
  });
  res.json(suppliersWithProducts);
});

app.post('/api/suppliers', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, company, phone, email, address, accessUsername, password } = req.body;
  
  try {
    const transaction = db.transaction(() => {
      // 1. Create Supplier
      const info = db.prepare('INSERT INTO suppliers (name, company, phone, email, address) VALUES (?, ?, ?, ?, ?)').run(name, company, phone, email || '', address);
      const supplierId = info.lastInsertRowid;

      // 2. Create User for Supplier if credentials provided
      if (accessUsername && password) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        db.prepare('INSERT INTO users (name, username, password, role, supplier_id) VALUES (?, ?, ?, ?, ?)').run(company, accessUsername, hashedPassword, 'proveedor', supplierId);
      }
      return supplierId;
    });

    const newSupplierId = transaction();
    res.json({ id: newSupplierId, ...req.body });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'El usuario de acceso ya está registrado.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
});

app.put('/api/suppliers/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, company, phone, email, address } = req.body;
  const supplierId = req.params.id;
  
  db.prepare('UPDATE suppliers SET name = ?, company = ?, phone = ?, email = ?, address = ? WHERE id = ?').run(name, company, phone, email, address, supplierId);
  
  // Optionally update user name if company name changed
  db.prepare('UPDATE users SET name = ? WHERE supplier_id = ?').run(company, supplierId);
  
  res.json({ id: supplierId, ...req.body });
});

app.delete('/api/suppliers/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const supplierId = req.params.id;
  
  const transaction = db.transaction(() => {
    // Delete associated user
    db.prepare('DELETE FROM users WHERE supplier_id = ?').run(supplierId);
    // Delete supplier products
    db.prepare('DELETE FROM supplier_products WHERE supplier_id = ?').run(supplierId);
    // Delete supplier
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(supplierId);
  });
  
  transaction();
  res.json({ success: true });
});

app.post('/api/suppliers/:id/products', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { productIds } = req.body; // Array of product IDs
  const supplierId = req.params.id;
  
  const insert = db.prepare('INSERT OR IGNORE INTO supplier_products (supplier_id, product_id) VALUES (?, ?)');
  const deleteExisting = db.prepare('DELETE FROM supplier_products WHERE supplier_id = ?');
  
  const transaction = db.transaction((ids) => {
    deleteExisting.run(supplierId);
    for (const pid of ids) insert.run(supplierId, pid);
  });
  
  transaction(productIds);
  res.json({ success: true });
});

// --- Order Routes ---
app.get('/api/orders', authenticateToken, (req: any, res: any) => {
  let query = `
    SELECT o.*, s.name as supplier_name, s.company as supplier_company 
    FROM orders o 
    JOIN suppliers s ON o.supplier_id = s.id
  `;
  
  const params: any[] = [];
  if (req.user.role === 'proveedor' && req.user.supplier_id) {
    query += ' WHERE o.supplier_id = ?';
    params.push(req.user.supplier_id);
  }
  
  query += ' ORDER BY o.date DESC';
  
  const orders = db.prepare(query).all(...params);
  
  const ordersWithDetails = orders.map((order: any) => {
    const details = db.prepare(`
      SELECT od.*, p.name as product_name 
      FROM order_details od 
      JOIN products p ON od.product_id = p.id 
      WHERE od.order_id = ?
    `).all(order.id);
    return { ...order, details };
  });
  
  res.json(ordersWithDetails);
});

app.post('/api/orders', authenticateToken, (req: any, res: any) => {
  if (req.user.role === 'proveedor') return res.sendStatus(403);
  const { supplier_id, products } = req.body; // products: [{ product_id, quantity }]
  
  const insertOrder = db.prepare('INSERT INTO orders (supplier_id, status) VALUES (?, ?)');
  const insertDetail = db.prepare('INSERT INTO order_details (order_id, product_id, quantity) VALUES (?, ?, ?)');
  
  const transaction = db.transaction((items) => {
    const info = insertOrder.run(supplier_id, 'pendiente');
    const orderId = info.lastInsertRowid;
    for (const item of items) {
      insertDetail.run(orderId, item.product_id, item.quantity);
    }
    return orderId;
  });
  
  const orderId = transaction(products);
  
  // Notify supplier
  const message = `Nuevo pedido #${orderId} creado`;
  db.prepare('INSERT INTO notifications (supplier_id, title, message) VALUES (?, ?, ?)').run(supplier_id, 'Nuevo Pedido', message);
  
  sendEvent({
    type: 'ORDER_CREATED',
    message: message,
    supplier_id: supplier_id
  });
  
  res.json({ id: orderId, status: 'pendiente' });
});

app.put('/api/orders/:id/status', authenticateToken, (req: any, res: any) => {
  const { status } = req.body;
  const orderId = req.params.id;
  
  // Validate transitions based on role
  if (req.user.role === 'proveedor' && status !== 'enviado') return res.sendStatus(403);
  // Bodega can only mark as received if it was sent
  // Simplified for now
  
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
  
  // If received, update stock automatically?
  if (status === 'recibido') {
    const details = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);
    const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    const insertMovement = db.prepare('INSERT INTO movements (product_id, type, quantity, reason) VALUES (?, ?, ?, ?)');
    
    const stockTransaction = db.transaction((items) => {
      for (const item of items) {
        updateStock.run(item.quantity, item.product_id);
        insertMovement.run(item.product_id, 'entrada', item.quantity, `Pedido #${orderId} recibido`);
      }
    });
    stockTransaction(details);
  }

  // Notify relevant parties
  let targetSupplierId = null;

  // Get supplier ID for this order
  const order = db.prepare('SELECT supplier_id FROM orders WHERE id = ?').get(orderId) as any;
  if (order) {
    targetSupplierId = order.supplier_id;
  }

  if (status === 'enviado') {
    // Notify Admin/Bodega that order is on the way
    db.prepare('INSERT INTO notifications (title, message) VALUES (?, ?)').run('Pedido Enviado', `El pedido #${orderId} ha sido enviado por el proveedor.`);
    sendEvent({ type: 'ORDER_UPDATED', message: `El pedido #${orderId} ha sido enviado.`, supplier_id: null });
  } else if (status === 'recibido') {
    // Notify Supplier that order was received
    if (targetSupplierId) {
       db.prepare('INSERT INTO notifications (supplier_id, title, message) VALUES (?, ?, ?)').run(targetSupplierId, 'Pedido Recibido', `Tu pedido #${orderId} ha sido recibido y procesado.`);
       sendEvent({ type: 'ORDER_UPDATED', message: `Tu pedido #${orderId} ha sido recibido.`, supplier_id: targetSupplierId });
    }
  }

  res.json({ success: true });
});

// --- Movement Routes ---
app.get('/api/movements', authenticateToken, (req: any, res: any) => {
  const movements = db.prepare(`
    SELECT m.*, p.name as product_name 
    FROM movements m 
    JOIN products p ON m.product_id = p.id 
    ORDER BY m.date DESC
  `).all();
  res.json(movements);
});

app.post('/api/movements', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'bodega' && req.user.role !== 'admin') return res.sendStatus(403);
  const { product_id, type, quantity, reason } = req.body;
  
  const updateStock = db.prepare(`UPDATE products SET stock = stock ${type === 'entrada' ? '+' : '-'} ? WHERE id = ?`);
  const insertMovement = db.prepare('INSERT INTO movements (product_id, type, quantity, reason) VALUES (?, ?, ?, ?)');
  
  const transaction = db.transaction(() => {
    updateStock.run(quantity, product_id);
    insertMovement.run(product_id, type, quantity, reason);
  });
  
  transaction();
  res.json({ success: true });
});

// --- Dashboard & AI ---
app.get('/api/dashboard', authenticateToken, (req: any, res: any) => {
  const lowStock = db.prepare('SELECT * FROM products WHERE stock <= stock_minimo').all();
  const totalInventory = db.prepare('SELECT SUM(stock) as total FROM products').get();
  const recentOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE date >= date("now", "-7 days")').get();
  
  res.json({
    lowStock,
    totalInventory: totalInventory.total || 0,
    recentOrders: recentOrders.count || 0
  });
});

app.get('/api/predict', authenticateToken, async (req: any, res: any) => {
  try {
    const products = db.prepare('SELECT * FROM products').all();
    const lowStock = products.filter((p: any) => p.stock <= p.stock_minimo);
    
    const prompt = `
      Analiza el estado del inventario de un restaurante.
      
      Resumen:
      Total de productos: ${products.length}
      Productos con stock bajo: ${lowStock.length}
      
      Lista de productos críticos (Stock <= Mínimo):
      ${JSON.stringify(lowStock.map((p: any) => ({ name: p.name, stock: p.stock, min: p.stock_minimo, unit: p.unidad_medida })))}
      
      Genera un reporte ejecutivo breve (máximo 3 párrafos) en formato Markdown.
      1. Identifica los riesgos más urgentes.
      2. Sugiere acciones de compra inmediatas.
      3. Menciona cualquier patrón preocupante si hay muchos productos bajos.
      
      Usa un tono profesional y directo.
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    res.json({ prediction: response.text });
  } catch (error) {
    console.error('AI Prediction Error:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

app.post('/api/predict', authenticateToken, async (req: any, res: any) => {
  const { productId } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  const movements = db.prepare('SELECT * FROM movements WHERE product_id = ? AND type = "salida" ORDER BY date DESC LIMIT 30').all(productId);
  
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // Use Gemini to predict
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      Analiza los siguientes datos de inventario para el producto "${product.name}":
      Stock actual: ${product.stock} ${product.unidad_medida}
      Stock mínimo: ${product.stock_minimo} ${product.unidad_medida}
      Historial de salidas (últimos movimientos): ${JSON.stringify(movements)}
      
      Predice si habrá escasez en la próxima semana y recomienda una cantidad de reposición.
      Responde en formato JSON con las claves: "prediction" (texto breve), "shortage" (booleano), "recommended_order" (número).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    const text = response.text;
    
    // Attempt to parse JSON from the response
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ prediction: text, shortage: false, recommended_order: 0 });
    }
  } catch (error) {
    console.error('AI Error:', error);
    // Fallback logic
    const totalOut = movements.reduce((sum, m) => sum + m.quantity, 0);
    const avgOut = totalOut / (movements.length || 1);
    const shortage = product.stock < avgOut * 7;
    
    res.json({
      prediction: shortage ? "Posible escasez basada en promedio simple." : "Stock suficiente.",
      shortage,
      recommended_order: shortage ? (avgOut * 7) - product.stock : 0
    });
  }
});

// Start Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
