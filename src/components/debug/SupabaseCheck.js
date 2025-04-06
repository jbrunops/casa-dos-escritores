"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function SupabaseCheck() {
  const [status, setStatus] = useState("Verificando conexão...");
  const [envVars, setEnvVars] = useState({});
  const [error, setError] = useState(null);
  const [detailedInfo, setDetailedInfo] = useState(null);

  useEffect(() => {
    // Adicionar timeout para não ficar preso em "verificando"
    const timeoutId = setTimeout(() => {
      if (status === "Verificando conexão...") {
        setStatus("Timeout na conexão");
        setError("A conexão não foi concluída em tempo hábil. Isso pode indicar um problema de rede ou CORS.");
      }
    }, 10000); // 10 segundos de timeout

    async function checkConnection() {
      try {
        // Verificar variáveis de ambiente
        const env = {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "Não definida",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Definida (não mostrada por segurança)" : "Não definida",
        };
        
        setEnvVars(env);
        
        console.log("Criando cliente Supabase para diagnóstico");
        
        // Criar cliente Supabase com tratamento explícito de erros
        let supabase;
        try {
          supabase = createBrowserClient();
          console.log("Cliente Supabase criado com sucesso");
          
          setDetailedInfo(prev => ({
            ...prev,
            clientCreation: "Sucesso"
          }));
        } catch (clientError) {
          console.error("Erro ao criar cliente:", clientError);
          setDetailedInfo(prev => ({
            ...prev,
            clientCreation: `Falha: ${clientError.message}`
          }));
          throw clientError;
        }
        
        // Testar conexão básica
        console.log("Testando conexão básica");
        try {
          const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
          
          if (error) {
            console.error("Erro na consulta:", error);
            setDetailedInfo(prev => ({
              ...prev,
              basicQuery: `Falha: ${error.message}`,
              errorCode: error.code,
              errorDetails: error.details
            }));
            throw error;
          }
          
          console.log("Consulta básica bem-sucedida");
          setDetailedInfo(prev => ({
            ...prev,
            basicQuery: "Sucesso"
          }));
        } catch (queryError) {
          console.error("Erro na consulta:", queryError);
          setDetailedInfo(prev => ({
            ...prev,
            basicQuery: `Falha: ${queryError.message}`
          }));
          throw queryError;
        }
        
        // Testar autenticação anônima
        console.log("Testando autenticação anônima");
        try {
          const { data: authData, error: authError } = await supabase.auth.getSession();
          
          if (authError) {
            console.error("Erro na autenticação:", authError);
            setDetailedInfo(prev => ({
              ...prev,
              auth: `Falha: ${authError.message}`
            }));
            throw authError;
          }
          
          console.log("Autenticação anônima bem-sucedida");
          setDetailedInfo(prev => ({
            ...prev,
            auth: "Sucesso",
            sessionExists: !!authData?.session
          }));
        } catch (authError) {
          console.error("Erro na autenticação:", authError);
          setDetailedInfo(prev => ({
            ...prev,
            auth: `Falha: ${authError.message}`
          }));
          throw authError;
        }
        
        setStatus("Conexão OK");
      } catch (e) {
        setStatus("Erro");
        setError(e.message);
      } finally {
        clearTimeout(timeoutId);
        
        // Verificar se a conexão em si está funcionando
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kkykesdoqdeagnuvlxao.supabase.co", {
            method: 'HEAD',
            cache: 'no-store'
          });
          
          setDetailedInfo(prev => ({
            ...prev,
            directConnection: `Status: ${response.status} ${response.statusText}`
          }));
        } catch (fetchError) {
          setDetailedInfo(prev => ({
            ...prev,
            directConnection: `Falha: ${fetchError.message}`
          }));
        }
      }
    }
    
    checkConnection();
    
    return () => clearTimeout(timeoutId);
  }, [status]);

  return (
    <div className="p-4 m-4 rounded-lg border border-[#E5E7EB] bg-white">
      <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-[#E5E7EB]">Diagnóstico Supabase</h2>
      
      <div className="mb-4">
        <div className="font-medium">Status:</div>
        <div className={`mt-1 ${status === "Conexão OK" ? "text-green-600" : status === "Verificando conexão..." ? "text-blue-600" : "text-red-600"}`}>
          {status}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="font-medium">Variáveis de ambiente:</div>
        <div className="mt-1 overflow-auto text-sm">
          <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(envVars, null, 2)}</pre>
        </div>
      </div>
      
      {error && (
        <div className="mb-4">
          <div className="font-medium text-red-600">Erro:</div>
          <div className="mt-1 text-sm bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        </div>
      )}

      {detailedInfo && (
        <div className="mb-4">
          <div className="font-medium">Informações detalhadas:</div>
          <div className="mt-1 overflow-auto text-sm">
            <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(detailedInfo, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4">
        Este componente é apenas para diagnóstico e deve ser removido em produção.
      </div>
    </div>
  );
} 