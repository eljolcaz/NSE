import React from 'react';
import { Bell, Package, AlertTriangle, CheckCircle, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function SupplierDashboard() {
  const notifications = [
    {
      id: 1,
      type: 'urgent',
      product: 'Aceite de Oliva Extra Virgen',
      message: 'Stock crítico en cliente GastroLogix. Se requiere reabastecimiento inmediato.',
      quantity: '50 L',
      date: 'Hace 10 min'
    },
    {
      id: 2,
      type: 'warning',
      product: 'Harina de Trigo Premium',
      message: 'Nivel de stock bajo. Preparar orden para envío mañana.',
      quantity: '100 Kg',
      date: 'Hace 2 horas'
    },
    {
      id: 3,
      type: 'info',
      product: 'Tomates Pelados en Lata',
      message: 'Predicción de demanda alta para el fin de semana.',
      quantity: '20 Cajas',
      date: 'Hace 5 horas'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Portal de Proveedores</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestión de alertas y pedidos para GastroLogix</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Estado: Activo
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-full">Acción Requerida</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">3</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Alertas de Stock Crítico</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded-full">+12% vs mes anterior</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">156</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Productos Entregados (Mes)</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">98.5%</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Nivel de Cumplimiento</p>
        </motion.div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            Notificaciones de Reabastecimiento
          </h3>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Marcar todas como leídas
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full shrink-0 ${
                  notification.type === 'urgent' ? 'bg-red-100 text-red-600' :
                  notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 dark:text-white">{notification.product}</h4>
                    <span className="text-xs text-slate-500">{notification.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                      Cantidad sugerida: {notification.quantity}
                    </span>
                    <button className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      Confirmar envío <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Orders Preview */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Próximos Pedidos Programados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">ID Pedido</th>
                <th className="px-4 py-3">Fecha Entrega</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 rounded-r-lg">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium">#ORD-2024-001</td>
                <td className="px-4 py-3">06 Mar 2026</td>
                <td className="px-4 py-3">15 items</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Confirmado</span></td>
                <td className="px-4 py-3"><button className="text-slate-400 hover:text-emerald-600">Ver detalles</button></td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium">#ORD-2024-002</td>
                <td className="px-4 py-3">08 Mar 2026</td>
                <td className="px-4 py-3">8 items</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">Pendiente</span></td>
                <td className="px-4 py-3"><button className="text-slate-400 hover:text-emerald-600">Ver detalles</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
