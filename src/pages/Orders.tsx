import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface OrderDetail {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
}

interface Order {
  id: number;
  supplier_id: number;
  supplier_name: string;
  supplier_company: string;
  date: string;
  status: 'pendiente' | 'enviado' | 'recibido' | 'cancelado';
  details: OrderDetail[];
}

interface Supplier {
  id: number;
  company: string;
  products: { id: number; name: string }[];
}

export default function Orders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  
  // Create Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<{ product_id: number; quantity: number }[]>([]);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [ordersData, suppliersData] = await Promise.all([
        api.getOrders(token),
        api.getSuppliers(token)
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateOrder = async () => {
    if (!token || !selectedSupplierId || orderItems.length === 0) return;
    try {
      await api.createOrder(token, {
        supplier_id: selectedSupplierId,
        products: orderItems
      });
      setIsCreateModalOpen(false);
      setOrderItems([]);
      setSelectedSupplierId(null);
      fetchData();
    } catch (error) {
      console.error("Failed to create order", error);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    if (!token) return;
    try {
      await api.updateOrderStatus(token, orderId, status);
      fetchData();
    } catch (error) {
      console.error("Failed to update order status", error);
    }
  };

  const addItemToOrder = (productId: number) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.product_id === productId);
      if (existing) {
        return prev.map(item => item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product_id: productId, quantity: 1 }];
    });
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.product_id !== productId));
    } else {
      setOrderItems(prev => prev.map(item => item.product_id === productId ? { ...item, quantity } : item));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'enviado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'recibido': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'cancelado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente': return <Clock className="w-4 h-4" />;
      case 'enviado': return <Truck className="w-4 h-4" />;
      case 'recibido': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === Number(selectedSupplierId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-emerald-600" />
            {user?.role === 'proveedor' ? 'Solicitudes Recibidas' : 'Gestión de Pedidos'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {user?.role === 'proveedor' 
              ? 'Administra los pedidos recibidos del restaurante.' 
              : 'Administra y rastrea tus pedidos a proveedores.'}
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'bodega') && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Pedido
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID Pedido</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {user?.role === 'proveedor' ? 'Cliente' : 'Proveedor'}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Cargando pedidos...</td></tr>
              ) : orders.length > 0 ? (
                orders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{order.id}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {user?.role === 'proveedor' ? 'GastroLogix' : order.supplier_company}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(order.status))}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            className="text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            {expandedOrderId === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          
                          {/* Role-based actions */}
                          {user?.role === 'bodega' && order.status === 'enviado' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'recibido')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md shadow-sm transition-colors"
                            >
                              Recibir
                            </button>
                          )}
                          {user?.role === 'proveedor' && order.status === 'pendiente' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'enviado')}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md shadow-sm transition-colors"
                            >
                              Enviar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="text-sm">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Detalle del Pedido:</h4>
                            <ul className="space-y-1">
                              {order.details.map((detail, idx) => (
                                <li key={idx} className="flex justify-between max-w-md text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1 last:border-0">
                                  <span>{detail.product_name}</span>
                                  <span className="font-medium">{detail.quantity} unid.</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No hay pedidos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Crear Nuevo Pedido</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Step 1: Select Supplier */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seleccionar Proveedor</label>
                <select 
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  onChange={(e) => {
                    setSelectedSupplierId(Number(e.target.value));
                    setOrderItems([]); // Reset items when supplier changes
                  }}
                  value={selectedSupplierId || ''}
                >
                  <option value="">-- Seleccione un proveedor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Products */}
              {selectedSupplier && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-3">Productos Disponibles</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSupplier.products.map(product => {
                      const currentItem = orderItems.find(i => i.product_id === product.id);
                      const quantity = currentItem?.quantity || 0;
                      
                      return (
                        <div key={product.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{product.name}</span>
                          <div className="flex items-center gap-2">
                            {quantity > 0 ? (
                              <>
                                <button 
                                  onClick={() => updateItemQuantity(product.id, quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                                >-</button>
                                <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                                <button 
                                  onClick={() => updateItemQuantity(product.id, quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                >+</button>
                              </>
                            ) : (
                              <button 
                                onClick={() => addItemToOrder(product.id)}
                                className="px-3 py-1 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100"
                              >
                                Agregar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              {orderItems.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Resumen del Pedido</h4>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    {orderItems.map(item => {
                      const product = selectedSupplier?.products.find(p => p.id === item.product_id);
                      return (
                        <li key={item.product_id} className="flex justify-between">
                          <span>{product?.name}</span>
                          <span>x {item.quantity}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={!selectedSupplierId || orderItems.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
