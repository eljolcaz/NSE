import React from 'react';
import { 
  TrendingUp, 
  Trash2, 
  DollarSign, 
  MoreHorizontal, 
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

const KPICard = ({ title, value, trend, trendValue, trendLabel, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
      <p className={cn("text-sm font-medium flex items-center gap-1", 
        trend === 'up' ? 'text-emerald-500' : 
        trend === 'down' ? 'text-red-500' : 'text-amber-500'
      )}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {trendValue}
        <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">{trendLabel}</span>
      </p>
    </div>
  </div>
);

const matrixData = [
  { x: 80, y: 90, z: 100, name: 'Signature Burger', type: 'star' }, // Star
  { x: 75, y: 85, z: 80, name: 'Truffle Fries', type: 'star' }, // Star
  { x: 90, y: 30, z: 120, name: 'Soda Fountain', type: 'cows' }, // Cash Cow
  { x: 30, y: 80, z: 60, name: 'Lobster Roll', type: 'puzzle' }, // Puzzle
  { x: 20, y: 20, z: 40, name: 'Vegan Pasta', type: 'dog' }, // Dog
  { x: 25, y: 15, z: 30, name: 'Seasonal Salad', type: 'dog' }, // Dog
];

const COLORS = {
  star: '#10b981', // Emerald
  cows: '#f59e0b', // Amber
  puzzle: '#3b82f6', // Blue
  dog: '#ef4444', // Red
};

const SupplyChainItem = ({ region, units, status, percentage, color }: any) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
    <div>
      <p className="font-medium text-slate-900 dark:text-white text-sm">{region}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{units} Unidades</p>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className={cn("text-sm font-medium", color)}>{status}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{percentage}% Surtido</p>
      </div>
      <div className={cn("w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]", color.replace('text-', 'bg-').replace('500', '500'))}></div>
    </div>
  </div>
);

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Variación de COGS" 
          value="+2.4%" 
          trend="down" 
          trendValue="Sobre el Objetivo" 
          trendLabel=""
          icon={TrendingUp}
          color="bg-red-500/10 text-red-500"
        />
        <KPICard 
          title="Desperdicio Total" 
          value="4.1%" 
          trend="warning" 
          trendValue="Monitorear" 
          trendLabel="de cerca"
          icon={Trash2}
          color="bg-amber-500/10 text-amber-500"
        />
        <KPICard 
          title="Margen Neto" 
          value="18.5%" 
          trend="up" 
          trendValue="+1.2%" 
          trendLabel="desde el mes pasado"
          icon={DollarSign}
          color="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Menu Engineering Matrix */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Matriz de Rentabilidad</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ingeniería de Menú</p>
            </div>
            <button className="text-slate-400 hover:text-emerald-500"><MoreHorizontal /></button>
          </div>
          
          <div className="relative w-full aspect-square max-h-[400px] border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-[#0f172a] p-4">
            {/* Background Quadrants */}
            <div className="absolute inset-4 grid grid-cols-2 grid-rows-2 opacity-5 pointer-events-none">
              <div className="bg-amber-500 border-r border-b border-slate-400"></div>
              <div className="bg-emerald-500 border-b border-slate-400"></div>
              <div className="bg-red-500 border-r border-slate-400"></div>
              <div className="bg-blue-500"></div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">Popularidad (Volumen)</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500 font-medium origin-center">Rentabilidad (Margen)</div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis type="number" dataKey="x" name="Popularidad" hide />
                <YAxis type="number" dataKey="y" name="Rentabilidad" hide />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded shadow-lg text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
                          <p className="text-slate-500">Pop: {data.x} | Rent: {data.y}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Menu Items" data={matrixData}>
                  {matrixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Estrellas</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Caballos de Batalla</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Puzles</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Perros</div>
          </div>
        </div>

        {/* Supply Chain Status */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Estado Cadena de Suministro</h3>
            <button className="text-sm text-emerald-500 font-medium hover:underline">Ver Mapa</button>
          </div>
          <div className="space-y-4">
            <SupplyChainItem 
              region="Región Noreste" 
              units="12" 
              status="Óptimo" 
              percentage="98" 
              color="text-emerald-500" 
            />
            <SupplyChainItem 
              region="Costa Oeste" 
              units="8" 
              status="Advertencia" 
              percentage="Escasez" 
              color="text-amber-500" 
            />
            <SupplyChainItem 
              region="Medio Oeste" 
              units="15" 
              status="Crítico" 
              percentage="Retraso" 
              color="text-red-500" 
            />
            <SupplyChainItem 
              region="Región Sur" 
              units="10" 
              status="Óptimo" 
              percentage="95" 
              color="text-emerald-500" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
