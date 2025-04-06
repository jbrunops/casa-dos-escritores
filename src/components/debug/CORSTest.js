"use client";

import { useState } from "react";

export default function CORSTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testCORS = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Testar conexão simples ao URL do Supabase
      const response = await fetch("https://kkykesdoqdeagnuvlxao.supabase.co", {
        method: "GET",
        mode: "cors", // Forçar CORS para testar
        cache: "no-cache",
        headers: {
          "Content-Type": "text/plain",
        }
      });
      
      const text = await response.text();
      
      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        headers: Object.fromEntries([...response.headers.entries()]),
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 m-4 border border-[#E5E7EB] rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-4">Teste CORS</h2>
      
      <button 
        onClick={testCORS}
        disabled={loading}
        className="px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] disabled:opacity-50 mb-4"
      >
        {loading ? "Testando..." : "Testar CORS"}
      </button>
      
      {result && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Resultado:</h3>
          <div className="bg-gray-50 p-3 rounded border border-gray-200 overflow-auto">
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        Este teste verifica se seu navegador consegue fazer requisições CORS para o Supabase.
      </div>
    </div>
  );
} 