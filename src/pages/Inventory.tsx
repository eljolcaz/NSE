import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ShoppingCart, 
  CheckCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Edit,
  Save,
  X,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: number;
  name: string;
  stock: number;
  stock_minimo: number;
  unidad_medida: string;
}

const InventoryItem = ({ item, onEdit }: { item: Product; onEdit: (item: Product) => void }) => {
  const percentage = Math.min(100, (item.stock / item.stock_minimo) * 100);
  const isLowStock = item.stock <= item.stock_minimo;
  
  return (
    <tr className="group border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200">
      <td className="px-6 py-5 min-w-[200px]">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white">{item.name}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ID: {item.id}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {item.unidad_medida}
        </span>
      </td>
      <td className="px-6 py-5 min-w-[180px]">
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="flex justify-between items-end text-xs gap-2">
            <span className={cn("font-bold text-sm truncate", isLowStock ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300")}>
              {item.stock}
            </span>
            <span className="text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">Mín: {item.stock_minimo}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
            <div 
              className={cn("h-full rounded-full transition-all duration-500 shadow-sm", isLowStock ? "bg-red-500" : "bg-emerald-500")} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/20 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/40 transition-colors whitespace-nowrap">
        <div className="flex items-center justify-between gap-4">
          {isLowStock ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/20">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-bold">Reponer Stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-bold">Stock Óptimo</span>
            </div>
          )}
          
          <button 
            onClick={() => onEdit(item)} 
            className="text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 p-2 rounded-lg transition-all shadow-sm hover:shadow border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            title="Editar producto"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function Inventory() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', stock: 0, stock_minimo: 0, unidad_medida: '' });

  const fetchProducts = async () => {
    if (!token) return;
    try {
      const data = await api.getProducts(token);
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      stock: product.stock,
      stock_minimo: product.stock_minimo,
      unidad_medida: product.unidad_medida
    });
    setIsModalOpen(true);
  };

  const handleNewItem = () => {
    setEditingProduct(null);
    setFormData({ name: '', stock: 0, stock_minimo: 0, unidad_medida: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingProduct) {
        await api.updateProduct(token, editingProduct.id, formData);
      } else {
        await api.createProduct(token, formData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product", error);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Control de Inventario</h2>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Sincronizado en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleNewItem}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Artículo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre del Artículo</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Unidad</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Stock vs Mínimo</th>
                <th className="px-6 py-5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50/30 dark:bg-emerald-500/5">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" />
                    Estado
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center">Cargando...</td></tr>
              ) : products.length > 0 ? (
                products.map(item => (
                  <InventoryItem key={item.id} item={item} onEdit={handleEdit} />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron artículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Actual</label>
                  <input 
                    type="number" 
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Mínimo</label>
                  <input 
                    type="number" 
                    value={formData.stock_minimo}
                    onChange={e => setFormData({...formData, stock_minimo: Number(e.target.value)})}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad de Medida</label>
                <input 
                  type="text" 
                  value={formData.unidad_medida}
                  onChange={e => setFormData({...formData, unidad_medida: e.target.value})}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                  placeholder="kg, unidad, litros..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
