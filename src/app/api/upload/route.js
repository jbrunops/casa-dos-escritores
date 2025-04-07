import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Função para lidar com upload de arquivos usando a chave de serviço
export async function POST(request) {
    try {
        console.log("Iniciando processamento de upload");
        
        // Acessar as chaves do Supabase - usar apenas valores fixos para garantir consistência
        const supabaseUrl = "https://kkykesdoqdeagnuvlxao.supabase.co";
        const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4Nzk1NiwiZXhwIjoyMDU5MzYzOTU2fQ.mpMIymtj-VHrouVu9RGEcQY3qvNOAi6hgjUW-Cs2in0";
        const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc5NTYsImV4cCI6MjA1OTM2Mzk1Nn0.kS69ce8FLws_rXMvbqOhRgMsaPntbzDGgwckQHYTnyk";
        
        // Usar cliente padrão do Supabase com a chave anônima para maior compatibilidade
        const supabase = createClient(supabaseUrl, anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
        
        console.log("Cliente Supabase criado com chave anônima");
        
        // Processar o FormData 
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
        
        console.log("Arquivo recebido:", file.name, "Tipo:", file.type, "Tamanho:", file.size);
        
        // Obter informações do arquivo
        const buffer = await file.arrayBuffer();
        const fileExt = file.name.split(".").pop().toLowerCase();
        
        // Nome do bucket e caminho do arquivo
        const bucketName = "mobile";
        const fileName = `mobile_${userId}_${Date.now()}.${fileExt}`;
        const filePath = `mobile_uploads/${fileName}`;
        
        console.log("Caminho do arquivo:", filePath);
        
        // Converter ArrayBuffer para Blob
        const blob = new Blob([buffer]);
        
        // Upload do arquivo
        console.log("Iniciando upload do arquivo...");
        
        // Upload usando chave anônima e políticas RLS
        const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, blob, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: false
            });
            
        if (uploadError) {
            console.error("Erro no upload:", uploadError);
            
            // Se falhar com chave anônima, tente com a chave de serviço
            console.log("Tentando upload com chave de serviço...");
            
            const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
            
            const { data: adminData, error: adminError } = await adminSupabase.storage
                .from(bucketName)
                .upload(filePath, blob, {
                    contentType: file.type,
                    cacheControl: "3600",
                    upsert: true
                });
                
            if (adminError) {
                console.error("Erro no upload com chave de serviço:", adminError);
                return NextResponse.json({ 
                    error: `Erro no upload: ${adminError.message}`,
                    code: adminError.code,
                    details: adminError.details
                }, { status: 500 });
            }
            
            // Usar o resultado da tentativa do admin
            const { data: adminUrlData } = adminSupabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);
                
            const adminUrl = adminUrlData?.publicUrl;
            
            console.log("Upload com chave de serviço bem-sucedido");
            return NextResponse.json({ url: adminUrl });
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
        return NextResponse.json({ 
            error: `Erro no servidor: ${error.message}`,
            stack: error.stack?.substring(0, 200)
        }, { status: 500 });
    }
} 