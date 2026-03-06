import React from 'react';
import { Package, ArrowUpRight, ArrowDownLeft, Search, ClipboardList, AlertCircle, History } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function WarehouseDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Bodega</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestión operativa del centro logístico</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/warehouse')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/warehouse?type=in')}
          className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <ArrowDownLeft className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Entrada de Mercancía</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registrar recepción de proveedores</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/warehouse?type=out')}
          className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <ArrowUpRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Salida a Cocina</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Despachar insumos a producción</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/inventory')}
          className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Consultar Stock</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Verificar disponibilidad actual</p>
        </motion.div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Movimientos Recientes
          </h3>
          <div className="space-y-4">
            {[
              { item: 'Harina 000', type: 'in', qty: '+50 kg', time: '10:30 AM', user: 'Juan P.' },
              { item: 'Tomates', type: 'out', qty: '-10 kg', time: '11:15 AM', user: 'Maria L.' },
              { item: 'Aceite Oliva', type: 'out', qty: '-5 L', time: '11:45 AM', user: 'Maria L.' },
              { item: 'Carne Res', type: 'in', qty: '+20 kg', time: '12:00 PM', user: 'Juan P.' },
            ].map((move, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${move.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {move.type === 'in' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{move.item}</p>
                    <p className="text-xs text-slate-500">{move.user} • {move.time}</p>
                  </div>
                </div>
                <span className={`font-bold ${move.type === 'in' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {move.qty}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Alertas de Stock Bajo
          </h3>
          <div className="space-y-3">
            {[
              { item: 'Leche Entera', current: 5, min: 10, unit: 'L' },
              { item: 'Huevos', current: 24, min: 60, unit: 'unid' },
              { item: 'Queso Mozzarella', current: 2, min: 5, unit: 'kg' },
            ].map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{alert.item}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-500">Mínimo requerido: {alert.min} {alert.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-red-600">{alert.current} {alert.unit}</span>
                  <span className="text-[10px] text-red-500">Crítico</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/inventory')}
            className="w-full mt-4 py-2 text-sm text-slate-600 hover:text-emerald-600 font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Ver inventario completo
          </button>
        </div>
      </div>
    </div>
  );
}
