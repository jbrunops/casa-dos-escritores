"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function SimpleSupabaseTest() {
  const [status, setStatus] = useState("Carregando...");
  const [testResults, setTestResults] = useState([]);
  
  const addResult = (name, result, details = null) => {
    setTestResults(prev => [...prev, { name, result, details, time: new Date().toISOString() }]);
  };

  useEffect(() => {
    async function runTests() {
      addResult("Início", "info", "Iniciando testes básicos do Supabase");
      
      try {
        // 1. Verificar variáveis de ambiente
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kkykesdoqdeagnuvlxao.supabase.co";
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc5NTYsImV4cCI6MjA1OTM2Mzk1Nn0.kS69ce8FLws_rXMvbqOhRgMsaPntbzDGgwckQHYTnyk";
        
        addResult("Variáveis", "success", {
          url: url,
          keyAvailable: !!key
        });
        
        // 2. Testar conexão direta ao URL do Supabase
        try {
          addResult("Fetch URL", "info", "Testando conexão com o URL do Supabase");
          const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
          addResult("Fetch URL", "success", `Status: ${response.status}`);
        } catch (fetchError) {
          addResult("Fetch URL", "error", fetchError.message);
        }
        
        // 3. Criar cliente direto
        try {
          addResult("Cliente direto", "info", "Criando cliente com createClient direto");
          const directClient = createClient(url, key);
          addResult("Cliente direto", "success", "Cliente criado com sucesso");
          
          // 3.1 Testar query simples
          try {
            addResult("Query básica", "info", "Executando query básica no Supabase");
            const { data, error } = await directClient.from('profiles').select('count', { count: 'exact', head: true });
            
            if (error) {
              addResult("Query básica", "error", error.message);
            } else {
              addResult("Query básica", "success", "Query executada com sucesso");
            }
          } catch (queryError) {
            addResult("Query básica", "error", queryError.message);
          }
          
          // 3.2 Testar autenticação
          try {
            addResult("Autenticação", "info", "Verificando status da autenticação");
            const { data, error } = await directClient.auth.getSession();
            
            if (error) {
              addResult("Autenticação", "error", error.message);
            } else {
              addResult("Autenticação", "success", {
                hasSession: !!data.session
              });
            }
          } catch (authError) {
            addResult("Autenticação", "error", authError.message);
          }
        } catch (clientError) {
          addResult("Cliente direto", "error", clientError.message);
        }
        
        setStatus("Concluído");
      } catch (error) {
        addResult("Erro geral", "error", error.message);
        setStatus("Erro");
      }
    }
    
    runTests();
  }, []);

  return (
    <div className="p-4 m-4 rounded-lg border border-[#E5E7EB] bg-white max-w-full overflow-hidden">
      <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-[#E5E7EB]">Diagnóstico Alternativo</h2>
      
      <div className="mb-4">
        <div className="font-medium">Status: {status}</div>
      </div>
      
      <div className="overflow-auto text-sm mb-4 max-h-[400px]">
        <ul className="space-y-2 pb-1">
          {testResults.map((result, index) => (
            <li key={index} className={`p-2 rounded ${
              result.result === "error" ? "bg-red-50 border border-red-100" :
              result.result === "success" ? "bg-green-50 border border-green-100" :
              "bg-blue-50 border border-blue-100"
            }`}>
              <div className="flex justify-between">
                <span className="font-medium">{result.name}</span>
                <span className={`text-xs ${
                  result.result === "error" ? "text-red-600" :
                  result.result === "success" ? "text-green-600" :
                  "text-blue-600"
                }`}>
                  {result.result.toUpperCase()}
                </span>
              </div>
              {result.details && (
                <div className="mt-1 text-xs overflow-auto">
                  {typeof result.details === 'object' ? (
                    <pre>{JSON.stringify(result.details, null, 2)}</pre>
                  ) : (
                    <span>{result.details}</span>
                  )}
                </div>
              )}
            </li>
          ))}
          {testResults.length === 0 && (
            <li className="p-2 bg-gray-50 rounded">Nenhum resultado ainda...</li>
          )}
        </ul>
      </div>
      
      <div className="text-xs text-gray-500">
        Componente de diagnóstico alternativo - Remover em produção
      </div>
    </div>
  );
} 