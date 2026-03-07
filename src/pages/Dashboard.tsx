import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Package, ShoppingCart, TrendingDown, AlertTriangle, CheckCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({
    totalInventory: 0,
    recentOrders: 0,
    lowStock: [],
    pendingOrders: 0,
    completedOrders: 0,
    recentOrdersList: [],
    recentMovements: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const dashboardData = await api.getDashboard(token);
      if (dashboardData) {
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <div className="p-8 text-center">Cargando datos...</div>;

  const stats = user?.role === 'proveedor' ? [
    { 
      title: 'Pedidos Pendientes', 
      value: data.pendingOrders || 0, 
      icon: ShoppingCart, 
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      desc: 'Por enviar'
    },
    { 
      title: 'Pedidos Completados', 
      value: data.completedOrders || 0, 
      icon: CheckCircle, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      desc: 'Histórico total'
    },
    { 
      title: 'Actividad Reciente', 
      value: data.recentOrdersList?.length || 0, 
      icon: Clock, 
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      desc: 'Últimos pedidos'
    },
  ] : [
    { 
      title: 'Inventario Total', 
      value: `${data.totalInventory || 0}`, 
      unit: 'unid.',
      icon: Package, 
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      desc: 'Productos en stock'
    },
    { 
      title: 'Pedidos Recientes', 
      value: data.recentOrders || 0, 
      icon: ShoppingCart, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      desc: 'Últimos 7 días'
    },
    { 
      title: 'Stock Bajo', 
      value: data.lowStock?.length || 0, 
      icon: AlertTriangle, 
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      desc: 'Productos requieren atención'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bienvenido, {user?.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {user?.role === 'proveedor' ? 'Panel de Proveedor' : 'Resumen de actividad y métricas clave'}
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-50"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`relative overflow-hidden bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border ${stat.border} transition-all hover:shadow-md`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <stat.icon className={`w-24 h-24 ${stat.color}`} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                  {stat.unit && <span className="text-sm font-medium text-slate-400">{stat.unit}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  {stat.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {user?.role === 'proveedor' ? (
            <>
              <button 
                onClick={() => navigate('/orders')}
                className="group p-4 bg-white dark:bg-[#111827] hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left flex items-center gap-4 shadow-sm"
              >
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Ver Pedidos</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gestionar solicitudes</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>
              
              <button 
                onClick={() => navigate('/orders')} // Could be filtered history
                className="group p-4 bg-white dark:bg-[#111827] hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left flex items-center gap-4 shadow-sm"
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Historial</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Revisar envíos pasados</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/inventory')}
                className="group p-4 bg-white dark:bg-[#111827] hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left flex items-center gap-4 shadow-sm"
              >
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Nuevo Producto</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Agregar al inventario</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/orders')}
                className="group p-4 bg-white dark:bg-[#111827] hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left flex items-center gap-4 shadow-sm"
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Crear Pedido</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Solicitar a proveedores</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/reports')}
                className="group p-4 bg-white dark:bg-[#111827] hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 transition-all text-left flex items-center gap-4 shadow-sm"
              >
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400">Reportes</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ver análisis</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </button>
            </>
          )}
        </div>
      </div>

      {user?.role === 'proveedor' ? (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Últimos Pedidos Recibidos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-3 font-medium text-slate-500">ID</th>
                  <th className="pb-3 font-medium text-slate-500">Fecha</th>
                  <th className="pb-3 font-medium text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrdersList?.map((order: any) => (
                  <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="py-3 text-slate-900 dark:text-white">#{order.id}</td>
                    <td className="py-3 text-slate-500">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'enviado' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data.recentOrdersList || data.recentOrdersList.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">No hay pedidos recientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas de Stock Bajo
          </h3>
          <div className="space-y-3">
            {data.lowStock?.length > 0 ? (
              data.lowStock.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Stock: {product.stock} {product.unidad_medida} (Mín: {product.stock_minimo})
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/orders')}
                    className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full hover:bg-amber-200 transition-colors"
                  >
                    Reponer
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">Todo el inventario está en niveles óptimos.</p>
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Movimientos Recientes
          </h3>
          <div className="space-y-3">
            {data.recentMovements && data.recentMovements.length > 0 ? (
              data.recentMovements.map((mov: any) => (
                <div key={mov.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${mov.type === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {mov.type === 'entrada' ? <TrendingDown className="w-4 h-4 rotate-180" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{mov.product_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(mov.date).toLocaleDateString()} • {mov.reason}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${mov.type === 'entrada' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No hay movimientos recientes.</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/warehouse')}
            className="w-full mt-4 py-2 text-sm text-slate-600 hover:text-blue-600 font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Ver historial completo
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
