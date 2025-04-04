import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Função para lidar com upload de arquivos usando a chave de serviço
export async function POST(request) {
    try {
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
            var supabase = createClient(fallbackUrl, fallbackServiceKey);
            console.log("Usando valores de fallback para o Supabase");
        } else {
            // Usar cliente do Supabase com chave de serviço para ignorar RLS
            var supabase = createClient(supabaseUrl, serviceRoleKey);
        }
        
        // Verificar se o bucket 'covers' existe
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error("Erro ao listar buckets:", listError);
            return NextResponse.json({ error: "Erro ao acessar storage" }, { status: 500 });
        }
        
        // Criar o bucket se não existir
        const bucketName = "covers";
        let bucketExists = buckets.some(bucket => bucket.name === bucketName);
        
        if (!bucketExists) {
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true
            });
            
            if (createError) {
                console.error("Erro ao criar bucket:", createError);
                return NextResponse.json({ error: "Erro ao criar bucket de armazenamento" }, { status: 500 });
            }
            
            console.log("Bucket criado com sucesso");
        }
        
        // Verificar políticas de acesso
        const { data: bucket, error: policyError } = await supabase.storage.getBucket(bucketName);
        
        if (policyError) {
            console.error("Erro ao verificar política do bucket:", policyError);
        } else if (!bucket.public) {
            // Tornar o bucket público
            const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
                public: true
            });
            
            if (updateError) {
                console.error("Erro ao atualizar política do bucket:", updateError);
            }
        }

        // Processar o FormData
        const formData = await request.formData();
        const file = formData.get("file");
        const userId = formData.get("userId");
        
        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
        }
        
        if (!userId) {
            return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
        }

        // Obter informações do arquivo
        const buffer = await file.arrayBuffer();
        const fileExt = file.name.split(".").pop();
        const fileName = `series_${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `series_covers/${fileName}`;
        
        // Converter ArrayBuffer para Blob
        const blob = new Blob([buffer]);
        
        // Upload do arquivo
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
        
        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
            
        const url = publicUrlData?.publicUrl;
        
        if (!url) {
            return NextResponse.json({ error: "Falha ao obter URL pública" }, { status: 500 });
        }
        
        return NextResponse.json({ url });
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
    }
} 