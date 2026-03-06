import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FileText, Download, Calendar } from 'lucide-react';

const CONSUMPTION_DATA = [
  { name: 'Lun', consumo: 4000, costo: 2400 },
  { name: 'Mar', consumo: 3000, costo: 1398 },
  { name: 'Mie', consumo: 2000, costo: 9800 },
  { name: 'Jue', consumo: 2780, costo: 3908 },
  { name: 'Vie', consumo: 1890, costo: 4800 },
  { name: 'Sab', consumo: 2390, costo: 3800 },
  { name: 'Dom', consumo: 3490, costo: 4300 },
];

const CATEGORY_DATA = [
  { name: 'Proteínas', value: 400 },
  { name: 'Vegetales', value: 300 },
  { name: 'Abarrotes', value: 300 },
  { name: 'Lácteos', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-emerald-600" />
            Reportes y Analítica
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Visualiza el rendimiento de tu inventario y costos.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <Calendar className="w-4 h-4" />
            Últimos 30 días
          </button>
          <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost vs Consumption Chart */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Consumo vs Costos (Semanal)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={CONSUMPTION_DATA}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="consumo" fill="#10B981" name="Consumo (Unid)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costo" fill="#6366F1" name="Costo ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Distribución de Inventario por Categoría</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DATA}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Tendencia de Mermas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={CONSUMPTION_DATA}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="consumo" stroke="#EF4444" strokeWidth={2} name="Mermas (kg)" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
