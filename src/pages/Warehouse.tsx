import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Plus, 
  Minus, 
  Search,
  Calendar,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface Movement {
  id: number;
  product_id: number;
  product_name: string;
  type: 'entrada' | 'salida';
  quantity: number;
  date: string;
  reason: string;
}

interface Product {
  id: number;
  name: string;
  stock: number;
  unidad_medida: string;
}

export default function Warehouse() {
  const { token } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formType, setFormType] = useState<'entrada' | 'salida'>('entrada');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [movementsData, productsData] = await Promise.all([
        api.getMovements(token),
        api.getProducts(token)
      ]);
      setMovements(movementsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProductId || quantity <= 0) return;
    
    setIsSubmitting(true);
    try {
      await api.createMovement(token, {
        product_id: selectedProductId,
        type: formType,
        quantity,
        reason
      });
      
      // Reset form
      setQuantity(0);
      setReason('');
      setSelectedProductId(null);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Failed to create movement", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-8 h-8 text-emerald-600" />
            Movimientos de Bodega
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Registra entradas y salidas de inventario.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-6">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Registrar Movimiento</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormType('entrada')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    formType === 'entrada' 
                      ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('salida')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    formType === 'salida' 
                      ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Salida
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Producto</label>
                <select 
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  value={selectedProductId || ''}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {p.unidad_medida})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0.01" 
                    step="0.01"
                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 pr-12"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    {selectedProduct?.unidad_medida || 'unid.'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo / Referencia</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  placeholder={formType === 'entrada' ? "Ej: Compra local, Devolución..." : "Ej: Venta diaria, Merma, Uso cocina..."}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !selectedProductId || quantity <= 0}
                className={cn(
                  "w-full py-2.5 rounded-lg text-white font-medium transition-colors shadow-sm flex items-center justify-center gap-2",
                  formType === 'entrada' 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "bg-red-600 hover:bg-red-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? 'Procesando...' : (
                  <>
                    {formType === 'entrada' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    Registrar {formType === 'entrada' ? 'Entrada' : 'Salida'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                Historial Reciente
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Cargando movimientos...</td></tr>
                  ) : movements.length > 0 ? (
                    movements.map(mov => (
                      <tr key={mov.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(mov.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{mov.product_name}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            mov.type === 'entrada' 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {mov.type === 'entrada' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {mov.type.charAt(0).toUpperCase() + mov.type.slice(1)}
                          </span>
                        </td>
                        <td className={cn("px-6 py-4 font-bold", mov.type === 'entrada' ? "text-emerald-600" : "text-red-600")}>
                          {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{mov.reason}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No hay movimientos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
