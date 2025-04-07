import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Função para lidar com upload de arquivos usando a chave de serviço
export async function POST(request) {
    try {
        console.log("Iniciando processamento de upload");
        
        // Acessar as chaves do Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Verificar se as chaves estão definidas
        if (!supabaseUrl || !serviceRoleKey) {
            console.error("Variáveis de ambiente não carregadas corretamente:");
            console.error("URL:", supabaseUrl ? "Definida" : "Não definida");
            console.error("Service Key:", serviceRoleKey ? "Definida" : "Não definida");
            
            // Valores de fallback
            const fallbackUrl = "https://kkykesdoqdeagnuvlxao.supabase.co";
            const fallbackServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4Nzk1NiwiZXhwIjoyMDU5MzYzOTU2fQ.mpMIymtj-VHrouVu9RGEcQY3qvNOAi6hgjUW-Cs2in0";
            
            // Usar cliente do Supabase com valores de fallback
            var supabase = createClient(fallbackUrl, fallbackServiceKey, {
                auth: {
                    persistSession: false
                },
                global: {
                    headers: {
                        'X-Client-Info': 'supabase-js/2.34.0',
                        'Content-Type': 'application/json',
                        'X-Client-Origin': '*'
                    }
                }
            });
            console.log("Usando valores de fallback para o Supabase");
        } else {
            // Usar cliente do Supabase com chave de serviço para ignorar RLS
            var supabase = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                    persistSession: false
                },
                global: {
                    headers: {
                        'X-Client-Info': 'supabase-js/2.34.0',
                        'Content-Type': 'application/json',
                        'X-Client-Origin': '*'
                    }
                }
            });
            console.log("Usando variáveis de ambiente para o Supabase");
        }
        
        // Processar o FormData primeiro para segurança
        console.log("Processando FormData do request");
        const formData = await request.formData();
        const file = formData.get("file");
        const userId = formData.get("userId");
        
        if (!file) {
            console.error("Nenhum arquivo enviado no FormData");
            return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
        }
        
        if (!userId) {
            console.error("ID do usuário não fornecido no FormData");
            return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
        }
        
        // Obter informações do arquivo
        const buffer = await file.arrayBuffer();
        const fileExt = file.name.split(".").pop().toLowerCase();
        
        // Usar caminho para o bucket mobile
        const bucketName = "mobile";
        const fileName = `mobile_${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `mobile_uploads/${fileName}`;
        
        console.log("Nome do arquivo gerado:", fileName);
        console.log("Caminho do arquivo:", filePath);
        
        // Verificar se o bucket existe e criar se necessário
        try {
            const { data: buckets } = await supabase.storage.listBuckets();
            
            // Criar o bucket se não existir
            if (!buckets.some(bucket => bucket.name === bucketName)) {
                await supabase.storage.createBucket(bucketName, {
                    public: true
                });
                console.log("Bucket mobile criado com sucesso");
            }
        } catch (bucketError) {
            console.error("Erro ao verificar/criar bucket, mas continuando com upload:", bucketError);
            // Continuando mesmo com erro - o bucket pode já existir
        }
        
        // Converter ArrayBuffer para Blob
        const blob = new Blob([buffer]);
        
        // Upload do arquivo
        console.log("Iniciando upload do arquivo para o Supabase...");
        const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, blob, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: true
            });
            
        if (uploadError) {
            console.error("Erro no upload:", uploadError);
            return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 });
        }
        
        console.log("Upload concluído com sucesso, obtendo URL pública");
        
        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
            
        const url = publicUrlData?.publicUrl;
        
        if (!url) {
            console.error("Falha ao obter URL pública");
            return NextResponse.json({ error: "Falha ao obter URL pública" }, { status: 500 });
        }
        
        console.log("URL pública obtida:", url);
        return NextResponse.json({ url });
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
    }
} 