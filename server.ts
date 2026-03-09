import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './src/lib/supabaseClient';

export const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

const apiRouter = express.Router();

// --- Auth Routes ---
apiRouter.post('/login', async (req: any, res: any) => {
  const { username, password } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, supplier_id: user.supplier_id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, supplier_id: user.supplier_id } });
});

// --- SSE Endpoint ---
apiRouter.get('/notifications', (req: any, res: any) => {
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
apiRouter.get('/user/notifications', authenticateToken, async (req: any, res: any) => {
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);

  if (req.user.role === 'proveedor') {
    query = query.eq('supplier_id', req.user.supplier_id);
  } else {
    query = query.is('supplier_id', null);
  }

  const { data: notifs, error } = await query;
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(notifs);
});

apiRouter.post('/notifications/mark-read', authenticateToken, async (req: any, res: any) => {
  let query = supabase.from('notifications').update({ read: true });

  if (req.user.role === 'proveedor') {
    query = query.eq('supplier_id', req.user.supplier_id);
  } else {
    query = query.is('supplier_id', null);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Dashboard Stats ---
apiRouter.get('/dashboard', authenticateToken, async (req: any, res: any) => {
  console.log('Dashboard requested by:', req.user.username, 'Role:', req.user.role);
  const stats: any = {};

  if (req.user.role === 'proveedor') {
    const supplierId = req.user.supplier_id;
    
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .eq('status', 'pendiente');

    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .in('status', ['recibido', 'enviado']);

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('date', { ascending: false })
      .limit(5);
    
    stats.pendingOrders = pendingOrders || 0;
    stats.completedOrders = completedOrders || 0;
    stats.recentOrdersList = recentOrders || [];
    
  } else {
    // Admin / Bodega
    console.log('Fetching admin/bodega stats');
    
    // Total Inventory
    const { data: products } = await supabase.from('products').select('stock');
    const totalInventory = products?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;

    // Low Stock
    const { data: lowStock } = await supabase.from('products').select('*');
    const lowStockList = (lowStock || []).filter((p: any) => p.stock <= p.stock_minimo);

    // Recent Orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('date', sevenDaysAgo.toISOString());

    // Recent Orders List
    const { data: recentOrdersList } = await supabase
      .from('orders')
      .select('*, suppliers(company)')
      .order('date', { ascending: false })
      .limit(5);

    // Recent Movements
    const { data: recentMovements } = await supabase
      .from('movements')
      .select('*, products(name)')
      .order('date', { ascending: false })
      .limit(5);
    
    // Flatten the structure for frontend compatibility
    const formattedOrders = recentOrdersList?.map((o: any) => ({
      ...o,
      supplier_company: o.suppliers?.company
    })) || [];

    const formattedMovements = recentMovements?.map((m: any) => ({
      ...m,
      product_name: m.products?.name
    })) || [];
    
    stats.totalInventory = totalInventory;
    stats.lowStock = lowStockList;
    stats.recentOrders = recentOrdersCount || 0;
    stats.recentOrdersList = formattedOrders;
    stats.recentMovements = formattedMovements;
  }

  res.json(stats);
});

// --- Product Routes ---
apiRouter.get('/products', authenticateToken, async (req: any, res: any) => {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(products);
});

apiRouter.post('/products', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'bodega') return res.sendStatus(403);
  const { name, stock, stock_minimo, unidad_medida } = req.body;
  
  const { data, error } = await supabase
    .from('products')
    .insert([{ name, stock, stock_minimo, unidad_medida }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

apiRouter.put('/products/:id', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'bodega') return res.sendStatus(403);
  const { name, stock, stock_minimo, unidad_medida } = req.body;
  
  const { data, error } = await supabase
    .from('products')
    .update({ name, stock, stock_minimo, unidad_medida })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Supplier Routes ---
apiRouter.get('/suppliers', authenticateToken, async (req: any, res: any) => {
  const { data: suppliers, error } = await supabase.from('suppliers').select('*');
  if (error) return res.status(500).json({ error: error.message });

  // Get products for each supplier
  const { data: suppliersWithProducts, error: joinError } = await supabase
    .from('suppliers')
    .select(`
      *,
      products:supplier_products(
        products(*)
      )
    `);

  if (joinError) return res.status(500).json({ error: joinError.message });

  // Transform to match expected format: supplier.products = [product, product]
  const formatted = suppliersWithProducts?.map((s: any) => ({
    ...s,
    products: s.products.map((sp: any) => sp.products)
  }));

  res.json(formatted);
});

apiRouter.post('/suppliers', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, company, phone, email, address, accessUsername, password } = req.body;
  
  // 1. Create Supplier
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .insert([{ name, company, phone, email: email || null, address }])
    .select()
    .single();

  if (supplierError) return res.status(500).json({ message: supplierError.message });

  // 2. Create User for Supplier if credentials provided
  if (accessUsername && password) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const { error: userError } = await supabase
      .from('users')
      .insert([{ 
        name: company, 
        username: accessUsername, 
        password: hashedPassword, 
        role: 'proveedor', 
        supplier_id: supplier.id 
      }]);
      
    if (userError) {
      console.error('Error creating user for supplier:', userError);
    }
  }

  res.json(supplier);
});

apiRouter.put('/suppliers/:id', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, company, phone, email, address } = req.body;
  const supplierId = req.params.id;
  
  const { data, error } = await supabase
    .from('suppliers')
    .update({ name, company, phone, email, address })
    .eq('id', supplierId)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  
  // Optionally update user name if company name changed
  await supabase
    .from('users')
    .update({ name: company })
    .eq('supplier_id', supplierId);
  
  res.json(data);
});

apiRouter.delete('/suppliers/:id', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const supplierId = req.params.id;
  
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

apiRouter.post('/suppliers/:id/products', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { productIds } = req.body; // Array of product IDs
  const supplierId = req.params.id;
  
  // Delete existing
  await supabase.from('supplier_products').delete().eq('supplier_id', supplierId);
  
  // Insert new
  if (productIds && productIds.length > 0) {
    const rows = productIds.map((pid: number) => ({ supplier_id: supplierId, product_id: pid }));
    const { error } = await supabase.from('supplier_products').insert(rows);
    if (error) return res.status(500).json({ error: error.message });
  }
  
  res.json({ success: true });
});

// --- Order Routes ---
apiRouter.get('/orders', authenticateToken, async (req: any, res: any) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      suppliers (name, company),
      order_details (
        *,
        products (name)
      )
    `)
    .order('date', { ascending: false });
  
  if (req.user.role === 'proveedor' && req.user.supplier_id) {
    query = query.eq('supplier_id', req.user.supplier_id);
  }
  
  const { data: orders, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten/Format for frontend
  const formatted = orders?.map((o: any) => ({
    ...o,
    supplier_name: o.suppliers?.name,
    supplier_company: o.suppliers?.company,
    details: o.order_details?.map((od: any) => ({
      ...od,
      product_name: od.products?.name
    }))
  }));
  
  res.json(formatted);
});

apiRouter.post('/orders', authenticateToken, async (req: any, res: any) => {
  if (req.user.role === 'proveedor') return res.sendStatus(403);
  const { supplier_id, products } = req.body; // products: [{ product_id, quantity }]
  
  // 1. Create Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ supplier_id, status: 'pendiente' }])
    .select()
    .single();

  if (orderError) return res.status(500).json({ error: orderError.message });
  
  // 2. Create Details
  const details = products.map((p: any) => ({
    order_id: order.id,
    product_id: p.product_id,
    quantity: p.quantity
  }));
  
  const { error: detailsError } = await supabase.from('order_details').insert(details);
  if (detailsError) return res.status(500).json({ error: detailsError.message });
  
  // Notify supplier
  const message = `Nuevo pedido #${order.id} creado`;
  await supabase.from('notifications').insert([{ supplier_id, title: 'Nuevo Pedido', message }]);
  
  sendEvent({
    type: 'ORDER_CREATED',
    message: message,
    supplier_id: supplier_id
  });
  
  res.json({ id: order.id, status: 'pendiente' });
});

apiRouter.put('/orders/:id/status', authenticateToken, async (req: any, res: any) => {
  const { status } = req.body;
  const orderId = req.params.id;
  
  // Validate transitions based on role
  if (req.user.role === 'proveedor' && status !== 'enviado') return res.sendStatus(403);
  
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) return res.status(500).json({ error: error.message });
  
  // If received, update stock automatically
  if (status === 'recibido') {
    const { data: details } = await supabase
      .from('order_details')
      .select('*')
      .eq('order_id', orderId);
      
    if (details) {
      for (const item of details) {
        // Update stock (fetch first to add)
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (product) {
          await supabase
            .from('products')
            .update({ stock: (product.stock || 0) + item.quantity })
            .eq('id', item.product_id);
            
          await supabase
            .from('movements')
            .insert([{
              product_id: item.product_id,
              type: 'entrada',
              quantity: item.quantity,
              reason: `Pedido #${orderId} recibido`
            }]);
        }
      }
    }
  }

  // Notify relevant parties
  let targetSupplierId = null;

  // Get supplier ID for this order
  const { data: order } = await supabase.from('orders').select('supplier_id').eq('id', orderId).single();
  if (order) {
    targetSupplierId = order.supplier_id;
  }

  if (status === 'enviado') {
    // Notify Admin/Bodega
    await supabase.from('notifications').insert([{ title: 'Pedido Enviado', message: `El pedido #${orderId} ha sido enviado por el proveedor.` }]);
    sendEvent({ type: 'ORDER_UPDATED', message: `El pedido #${orderId} ha sido enviado.`, supplier_id: null });
  } else if (status === 'recibido') {
    // Notify Supplier
    if (targetSupplierId) {
       await supabase.from('notifications').insert([{ supplier_id: targetSupplierId, title: 'Pedido Recibido', message: `Tu pedido #${orderId} ha sido recibido y procesado.` }]);
       sendEvent({ type: 'ORDER_UPDATED', message: `Tu pedido #${orderId} ha sido recibido.`, supplier_id: targetSupplierId });
    }
  }

  res.json({ success: true });
});

// --- Movement Routes ---
apiRouter.get('/movements', authenticateToken, async (req: any, res: any) => {
  const { data: movements, error } = await supabase
    .from('movements')
    .select('*, products(name)')
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const formatted = movements?.map((m: any) => ({
    ...m,
    product_name: m.products?.name
  }));

  res.json(formatted);
});

apiRouter.post('/movements', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'bodega' && req.user.role !== 'admin') return res.sendStatus(403);
  const { product_id, type, quantity, reason } = req.body;
  
  // Update stock
  const { data: product } = await supabase.from('products').select('stock').eq('id', product_id).single();
  if (!product) return res.status(404).json({ message: 'Product not found' });
  
  const newStock = type === 'entrada' ? (product.stock || 0) + quantity : (product.stock || 0) - quantity;
  
  await supabase.from('products').update({ stock: newStock }).eq('id', product_id);
  
  const { error } = await supabase
    .from('movements')
    .insert([{ product_id, type, quantity, reason }]);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- AI Prediction ---
apiRouter.get('/predict', authenticateToken, async (req: any, res: any) => {
  try {
    const { data: products } = await supabase.from('products').select('*');
    if (!products) return res.status(500).json({ error: 'No products found' });
    
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
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    res.json({ prediction: response.text });
  } catch (error) {
    console.error('AI Prediction Error:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

apiRouter.post('/predict', authenticateToken, async (req: any, res: any) => {
  const { productId } = req.body;
  const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
  const { data: movements } = await supabase
    .from('movements')
    .select('*')
    .eq('product_id', productId)
    .eq('type', 'salida')
    .order('date', { ascending: false })
    .limit(30);
  
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
      model: "gemini-2.5-flash",
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
    const totalOut = (movements || []).reduce((sum: number, m: any) => sum + m.quantity, 0);
    const avgOut = totalOut / ((movements || []).length || 1);
    const shortage = product.stock < avgOut * 7;
    
    res.json({
      prediction: shortage ? "Posible escasez basada en promedio simple." : "Stock suficiente.",
      shortage,
      recommended_order: shortage ? (avgOut * 7) - product.stock : 0
    });
  }
});

// Mount the router at both paths
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

// Start Server (Only if not running as a Netlify function)
const isServerless = !!(
  process.env.IS_SERVERLESS ||
  process.env.LAMBDA_TASK_ROOT || 
  process.env.AWS_EXECUTION_ENV || 
  process.env.NETLIFY ||
  process.env.FUNCTIONS_EMULATOR
);

if (!isServerless) {
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const viteModule = 'vite';
      const { createServer: createViteServer } = await import(viteModule);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const path = await import('path');
      app.use(express.static(path.resolve(process.cwd(), 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  startServer();
}
