import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
        <SettingsIcon className="w-12 h-12 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md">
        Gestiona usuarios, permisos, integraciones y preferencias de la plataforma aquí.
      </p>
    </div>
  );
}
