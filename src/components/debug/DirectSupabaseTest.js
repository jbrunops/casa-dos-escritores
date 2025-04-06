"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function DirectSupabaseTest() {
  const [result, setResult] = useState("Testando...");
  const [logs, setLogs] = useState([]);

  const log = (message) => {
    setLogs(prev => [...prev, { time: new Date().toISOString(), message }]);
  };

  useEffect(() => {
    async function testDirectConnection() {
      log("Iniciando teste direto");
      
      try {
        // Usar as chaves diretamente aqui
        const supabaseUrl = "https://kkykesdoqdeagnuvlxao.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc5NTYsImV4cCI6MjA1OTM2Mzk1Nn0.kS69ce8FLws_rXMvbqOhRgMsaPntbzDGgwckQHYTnyk";
        
        log(`Usando URL: ${supabaseUrl}`);
        log("Criando cliente direto...");
        
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        
        log("Cliente criado, tentando fazer uma consulta simples...");
        
        // Tentar uma consulta simples
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          log(`Erro na consulta: ${error.message}`);
          setResult(`Erro: ${error.message}`);
          return;
        }
        
        log("Consulta bem-sucedida!");
        setResult("Conexão direta funcionou!");
      } catch (e) {
        log(`Erro: ${e.message}`);
        setResult(`Falha: ${e.message}`);
      }
    }
    
    testDirectConnection();
  }, []);

  return (
    <div className="p-4 m-4 border border-[#E5E7EB] rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-4">Teste Direto Supabase</h2>
      
      <div className="p-3 mb-4 rounded bg-gray-50 border border-gray-200 font-medium">
        Resultado: <span className={result.includes("funcionou") ? "text-green-600" : "text-red-600"}>{result}</span>
      </div>
      
      <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-[300px] overflow-auto">
        <p className="text-sm font-medium mb-2">Logs:</p>
        {logs.map((log, i) => (
          <div key={i} className="text-xs mb-1">
            <span className="text-gray-500">[{log.time.substring(11, 19)}]</span> {log.message}
          </div>
        ))}
        {logs.length === 0 && <p className="text-xs text-gray-500">Nenhum log ainda...</p>}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Componente de teste direto - Remover em produção
      </div>
    </div>
  );
} 