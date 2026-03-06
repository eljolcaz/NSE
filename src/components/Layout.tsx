import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Users, 
  BrainCircuit, 
  Settings, 
  FileText, 
  Bell, 
  Search, 
  Menu,
  X,
  LogOut,
  Warehouse,
  Check,
  ShoppingCart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, UserRole } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, collapsed }: { to: string; icon: any; label: string; collapsed: boolean }) => (
  <NavLink
    to={to}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
        isActive 
          ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-medium" 
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200",
        collapsed && "justify-center px-2"
      )
    }
  >
    <Icon className="w-5 h-5 shrink-0" />
    {!collapsed && (
      <span className="whitespace-nowrap overflow-hidden text-sm">{label}</span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
        {label}
      </div>
    )}
  </NavLink>
);

const NotificationsDropdown = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/user/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
    }
  }, [isOpen, token]);

  const markAsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-12 right-0 w-80 bg-white dark:bg-[#111827] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notificaciones</h3>
          <button onClick={markAsRead} className="text-xs text-emerald-600 hover:text-emerald-700">Marcar leídas</button>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => {
                  onClose();
                  if (notif.message.includes('pedido')) {
                    navigate('/orders');
                  } else if (notif.message.includes('Stock')) {
                    navigate('/inventory');
                  }
                }}
                className={cn("p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer", !notif.read && "bg-emerald-50/50 dark:bg-emerald-900/10")}
              >
                <div className="flex justify-between items-start">
                  <p className={cn("text-sm", !notif.read ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                    {notif.title}
                  </p>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">No tienes notificaciones nuevas</div>
          )}
        </div>
        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-center">
          <button className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600">Ver todas</button>
        </div>
      </div>
    </>
  );
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource('/api/notifications');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Filter notifications based on role
      if (user.role === 'proveedor' && data.supplier_id && data.supplier_id !== user.supplier_id) {
        return;
      }
      
      toast(data.message, {
        description: new Date().toLocaleTimeString(),
        action: {
          label: 'Ver',
          onClick: () => navigate('/orders')
        },
      });
    };

    return () => {
      eventSource.close();
    };
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    switch(path) {
      case '': return 'Panel de Control';
      case 'inventory': return 'Control de Inventario';
      case 'predictions': return 'Predicciones IA';
      case 'suppliers': return 'Proveedores';
      case 'warehouse': return 'Movimientos de Bodega';
      case 'reports': return 'Reportes';
      case 'settings': return 'Configuración';
      default: return 'GastroLogix AI';
    }
  };

  // Define navigation items with allowed roles
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ['admin', 'bodega', 'proveedor'] },
    { to: "/inventory", icon: Package, label: "Inventario", roles: ['admin', 'bodega'] },
    { to: "/orders", icon: ShoppingCart, label: "Pedidos", roles: ['admin', 'bodega', 'proveedor'] },
    { to: "/warehouse", icon: Warehouse, label: "Movimientos Bodega", roles: ['admin', 'bodega'] },
    { to: "/suppliers", icon: Truck, label: "Proveedores", roles: ['admin'] },
    { to: "/predictions", icon: BrainCircuit, label: "Predicciones IA", roles: ['admin'] },
    { to: "/reports", icon: FileText, label: "Reportes", roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role as string)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={cn(
          "fixed md:relative z-50 h-full bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white leading-none">GastroLogix</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">AI Enterprise</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <SidebarItem 
              key={item.to}
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              collapsed={collapsed} 
            />
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          {user?.role === 'admin' && (
            <SidebarItem to="/settings" icon={Settings} label="Configuración" collapsed={collapsed} />
          )}
          <button 
            onClick={handleLogout}
            className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10",
            collapsed && "justify-center"
          )}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#111827]"></span>
              </button>
              <NotificationsDropdown isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            </div>
            
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {user?.role === 'bodega' ? 'Bodega' : user?.role === 'proveedor' ? 'Proveedor' : 'Admin'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
