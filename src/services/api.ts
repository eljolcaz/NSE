const API_URL = '/api';

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  getProducts: async (token) => {
    const res = await fetch(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createProduct: async (token, product) => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(product),
    });
    return res.json();
  },

  updateProduct: async (token, id, product) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(product),
    });
    return res.json();
  },

  getSuppliers: async (token) => {
    const res = await fetch(`${API_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createSupplier: async (token, supplier) => {
    const res = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(supplier),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create supplier');
    }
    return res.json();
  },

  updateSupplier: async (token, id, supplier) => {
    const res = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(supplier),
    });
    return res.json();
  },

  deleteSupplier: async (token, id) => {
    const res = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  assignProductsToSupplier: async (token, supplierId, productIds) => {
    const res = await fetch(`${API_URL}/suppliers/${supplierId}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ productIds }),
    });
    return res.json();
  },

  getOrders: async (token) => {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createOrder: async (token, order) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(order),
    });
    return res.json();
  },

  updateOrderStatus: async (token, orderId, status) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  getMovements: async (token) => {
    const res = await fetch(`${API_URL}/movements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createMovement: async (token, movement) => {
    const res = await fetch(`${API_URL}/movements`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(movement),
    });
    return res.json();
  },

  getDashboard: async (token) => {
    const res = await fetch(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getPrediction: async (token) => {
    const res = await fetch(`${API_URL}/predict`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  predict: async (token, productId) => {
    const res = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ productId }),
    });
    return res.json();
  }
};
