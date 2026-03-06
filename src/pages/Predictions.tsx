import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

export default function Predictions() {
  const { token } = useAuth();
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generatePrediction = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getPrediction(token);
      setPrediction(data.prediction);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to generate prediction", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Generate initial prediction on load if not present
    if (!prediction) {
      generatePrediction();
    }
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-purple-600" />
            Predicciones de IA
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Análisis inteligente de tu inventario y sugerencias de compra.</p>
        </div>
        <button 
          onClick={generatePrediction}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
        >
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? 'Analizando...' : 'Actualizar Análisis'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analysis Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-900/10 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Reporte de Inteligencia Artificial
              </h3>
              {lastUpdated && (
                <span className="text-xs text-slate-500">
                  Actualizado: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-500 animate-pulse">Analizando patrones de consumo...</p>
                </div>
              ) : prediction ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{prediction}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                  <p>No hay análisis disponible. Haz clic en "Actualizar Análisis".</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Riesgo de Quiebre</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  La IA detecta productos críticos que podrían agotarse antes del próximo pedido programado.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Tendencias de Consumo</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Análisis de variaciones estacionales y picos de demanda para optimizar tus compras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
