import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  Edit, 
  Save, 
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface Product {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  products: Product[];
}

export default function Suppliers() {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Form states
  const [supplierForm, setSupplierForm] = useState({ 
    id: 0,
    name: '', 
    company: '', 
    phone: '', 
    email: '', 
    address: '',
    accessUsername: '',
    password: ''
  });
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [suppliersData, productsData] = await Promise.all([
        api.getSuppliers(token),
        api.getProducts(token)
      ]);
      setSuppliers(suppliersData);
      setAllProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleNewSupplier = () => {
    setSupplierForm({ id: 0, name: '', company: '', phone: '', email: '', address: '', accessUsername: '', password: '' });
    setIsEditing(false);
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierForm({ 
      id: supplier.id,
      name: supplier.name, 
      company: supplier.company, 
      phone: supplier.phone, 
      email: supplier.email, 
      address: supplier.address,
      accessUsername: '', // Don't show existing credentials
      password: '' 
    });
    setIsEditing(true);
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!token || !window.confirm('¿Estás seguro de eliminar este proveedor? Se eliminará también su usuario de acceso.')) return;
    try {
      await api.deleteSupplier(token, id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete supplier", error);
    }
  };

  const handleCreateOrUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (isEditing) {
        await api.updateSupplier(token, supplierForm.id, supplierForm);
      } else {
        await api.createSupplier(token, supplierForm);
      }
      setIsSupplierModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save supplier", error);
      alert("Error al guardar proveedor: " + (error as any).message);
    }
  };

  const openProductAssignment = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedProductIds(supplier.products.map(p => p.id));
    setIsProductModalOpen(true);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAssignProducts = async () => {
    if (!token || !selectedSupplier) return;
    try {
      await api.assignProductsToSupplier(token, selectedSupplier.id, selectedProductIds);
      setIsProductModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to assign products", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-8 h-8 text-emerald-600" />
            Gestión de Proveedores
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Administra tus proveedores y sus productos asociados.</p>
        </div>
        <button 
          onClick={handleNewSupplier}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Agregar Proveedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-8 text-slate-500">Cargando proveedores...</p>
        ) : suppliers.length > 0 ? (
          suppliers.map(supplier => (
            <div key={supplier.id} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{supplier.company}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{supplier.name}</p>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                  <span>{supplier.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{supplier.email}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Productos Suministrados</p>
                  <div className="flex flex-wrap gap-2">
                    {supplier.products && supplier.products.length > 0 ? (
                      supplier.products.map(p => (
                        <span key={p.id} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-md border border-slate-200 dark:border-slate-700">
                          {p.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sin productos asignados</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <button 
                  onClick={() => openProductAssignment(supplier)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Productos
                </button>
                <button 
                  onClick={() => handleEditSupplier(supplier)}
                  className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="p-2 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  title="Eliminar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
            <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No hay proveedores registrados.</p>
          </div>
        )}
      </div>

      {/* New/Edit Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa</label>
                <input 
                  type="text" 
                  value={supplierForm.company}
                  onChange={e => setSupplierForm({...supplierForm, company: e.target.value})}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Contacto</label>
                <input 
                  type="text" 
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  placeholder="Persona de contacto"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                  <input 
                    type="tel" 
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                    placeholder="555-0000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                <input 
                  type="text" 
                  value={supplierForm.address}
                  onChange={e => setSupplierForm({...supplierForm, address: e.target.value})}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                  placeholder="Dirección completa"
                  required
                />
              </div>

              {!isEditing && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    Crear Usuario de Acceso
                  </h4>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Usuario de Acceso</label>
                      <input 
                        type="text" 
                        value={supplierForm.accessUsername}
                        onChange={e => setSupplierForm({...supplierForm, accessUsername: e.target.value})}
                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                        placeholder="usuario_proveedor"
                        required={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                      <input 
                        type="password" 
                        value={supplierForm.password}
                        onChange={e => setSupplierForm({...supplierForm, password: e.target.value})}
                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                        placeholder="••••••••"
                        required={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#111827] pb-2">
                <button 
                  type="button" 
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                >
                  {isEditing ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Products Modal */}
      {isProductModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Asignar Productos</h3>
                <p className="text-xs text-slate-500">Proveedor: {selectedSupplier.company}</p>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Selecciona los productos que suministra este proveedor:</p>
              <div className="space-y-2">
                {allProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div 
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" 
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                      )}
                    >
                      <div className={cn("text-emerald-600", isSelected ? "opacity-100" : "opacity-40")}>
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex justify-end gap-3">
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAssignProducts}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
              >
                Guardar Asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
