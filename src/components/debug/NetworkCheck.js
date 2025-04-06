"use client";

import { useState } from "react";

export default function NetworkCheck() {
  const [status, setStatus] = useState({});
  const [running, setRunning] = useState(false);

  const sitesToCheck = [
    { name: "Google", url: "https://www.google.com" },
    { name: "Cloudflare", url: "https://www.cloudflare.com" },
    { name: "Supabase", url: "https://supabase.com" },
    { name: "Supabase Instance", url: "https://kkykesdoqdeagnuvlxao.supabase.co" }
  ];

  const checkConnectivity = async () => {
    setRunning(true);
    setStatus({});

    for (const site of sitesToCheck) {
      try {
        const startTime = performance.now();
        const response = await fetch(site.url, {
          method: "HEAD",
          mode: "no-cors", // Usar no-cors para evitar problemas de CORS no diagnóstico
          cache: "no-store"
        });
        const endTime = performance.now();
        
        setStatus(prev => ({
          ...prev,
          [site.name]: {
            success: true,
            time: Math.round(endTime - startTime),
            status: response.status
          }
        }));
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          [site.name]: {
            success: false,
            error: error.message
          }
        }));
      }
    }

    setRunning(false);
  };

  return (
    <div className="p-4 m-4 border border-[#E5E7EB] rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-4">Verificação de Rede</h2>
      
      <button 
        onClick={checkConnectivity}
        disabled={running}
        className="px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] disabled:opacity-50 mb-4"
      >
        {running ? "Verificando..." : "Verificar Conectividade"}
      </button>
      
      <div className="mt-4 grid grid-cols-1 gap-2">
        {sitesToCheck.map(site => (
          <div 
            key={site.name}
            className={`p-3 rounded border ${
              !status[site.name] ? "bg-gray-50 border-gray-200" :
              status[site.name].success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{site.name}</span>
              {status[site.name] && (
                <span className={`text-xs ${status[site.name].success ? "text-green-600" : "text-red-600"}`}>
                  {status[site.name].success ? 
                    `OK (${status[site.name].time}ms)` : 
                    "Falha"}
                </span>
              )}
            </div>
            {status[site.name] && !status[site.name].success && (
              <div className="text-xs text-red-600 mt-1">{status[site.name].error}</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Este teste verifica se você consegue acessar diversos sites, incluindo o Supabase.
      </div>
    </div>
  );
} 