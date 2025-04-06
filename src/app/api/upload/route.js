import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Função para lidar com upload de arquivos usando a chave de serviço
export async function POST(request) {
    try {
        console.log("Iniciando processamento de upload");
        
        // Acessar as chaves do Supabase
        let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Defina a chave correta caso esteja em ambiente de desenvolvimento
        // e a variável não esteja sendo carregada corretamente
        const hardcodedServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4Nzk1NiwiZXhwIjoyMDU5MzYzOTU2fQ.mpMIymtj-VHrouVu9RGEcQY3qvNOAi6hgjUW-Cs2in0";

        // Verificar se as chaves estão definidas
        if (!supabaseUrl || !serviceRoleKey) {
            console.error("Variáveis de ambiente não carregadas corretamente:");
            console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Definida" : "Não definida");
            console.error("SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "Definida" : "Não definida");
            
            // Carregar valores padrão (apenas em desenvolvimento)
            if (process.env.NODE_ENV === 'development') {
                console.log("Tentando usar valores padrão em ambiente de desenvolvimento");
                
                if (!supabaseUrl) {
                    supabaseUrl = "https://kkykesdoqdeagnuvlxao.supabase.co";
                    console.log("Usando URL padrão do Supabase");
                }
                
                if (!serviceRoleKey) {
                    console.log("Usando chave de serviço hardcoded para desenvolvimento");
                    serviceRoleKey = hardcodedServiceRoleKey;
                }
            } else {
                // Em produção, falhar se as variáveis não estiverem definidas
                return NextResponse.json({ 
                    error: "Configuração do servidor incompleta. Por favor, contate o administrador." 
                }, { status: 500 });
            }
        }
        
        console.log("Usando Supabase URL:", supabaseUrl);
        console.log("Chave de serviço do Supabase está definida:", !!serviceRoleKey);
            
        // Usar cliente do Supabase com chave de serviço para ignorar RLS
        console.log("Criando cliente Supabase com chave de serviço");
        console.log("Primeiros 10 caracteres da chave:", serviceRoleKey.substring(0, 10) + "...");
        
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log("Cliente Supabase criado com chave de serviço");
        
        // Verificar conexão com o Supabase
        let buckets;
        try {
            // Para o serviço, em vez de verificar autenticação, apenas 
            // verificamos se conseguimos listar buckets para confirmar 
            // que a chave está funcionando
            const { data: bucketsData, error: listError } = await supabase.storage.listBuckets();
            
            if (listError) {
                console.error("Erro ao verificar conexão com Supabase:", listError);
                return NextResponse.json({ 
                    error: `Erro ao acessar Supabase Storage com chave de serviço: ${listError.message}` 
                }, { status: 500 });
            }
            buckets = bucketsData;
            console.log("Conexão com Supabase verificada com sucesso");
        } catch (authError) {
            console.error("Erro ao verificar conexão com Supabase:", authError);
            return NextResponse.json({ 
                error: `Erro na autenticação do Supabase: ${authError.message}` 
            }, { status: 500 });
        }
        
        try {
            // Criar o bucket se não existir
            const bucketName = "covers";
            let bucketExists = buckets.some(bucket => bucket.name === bucketName);
            
            if (!bucketExists) {
                console.log("Bucket 'covers' não encontrado. Criando...");
                const { error: createError } = await supabase.storage.createBucket(bucketName, {
                    public: true
                });
                
                if (createError) {
                    console.error("Erro ao criar bucket:", createError);
                    return NextResponse.json({ 
                        error: "Erro ao criar bucket de armazenamento. Detalhes: " + createError.message 
                    }, { status: 500 });
                }
                
                console.log("Bucket criado com sucesso");
            } else {
                console.log("Bucket 'covers' já existe");
            }
            
            // Verificar políticas de acesso
            const { data: bucket, error: policyError } = await supabase.storage.getBucket(bucketName);
            
            if (policyError) {
                console.error("Erro ao verificar política do bucket:", policyError);
                return NextResponse.json({ 
                    error: "Erro ao verificar política do bucket. Detalhes: " + policyError.message 
                }, { status: 500 });
            } else if (!bucket.public) {
                console.log("Atualizando bucket para acesso público");
                // Tornar o bucket público
                const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
                    public: true
                });
                
                if (updateError) {
                    console.error("Erro ao atualizar política do bucket:", updateError);
                    return NextResponse.json({ 
                        error: "Erro ao configurar bucket para acesso público. Detalhes: " + updateError.message 
                    }, { status: 500 });
                } else {
                    console.log("Bucket atualizado para acesso público");
                }
            }
        } catch (storageError) {
            console.error("Erro ao configurar storage:", storageError);
            return NextResponse.json({ 
                error: "Erro ao configurar storage. Detalhes: " + storageError.message 
            }, { status: 500 });
        }

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

        try {
            // Obter informações do arquivo
            const buffer = await file.arrayBuffer();
            const fileExt = file.name.split(".").pop().toLowerCase();
            const fileName = `series_${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `series_covers/${fileName}`;
            
            console.log("Nome do arquivo gerado:", fileName);
            console.log("Caminho do arquivo:", filePath);
            
            // Bucket para upload
            const bucketName = "covers";
            
            // Upload do arquivo usando Uint8Array para maior compatibilidade
            const uint8Array = new Uint8Array(buffer);
            
            // Upload do arquivo
            console.log("Iniciando upload do arquivo para o Supabase...");
            const { data, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, uint8Array, {
                    contentType: file.type,
                    cacheControl: "3600",
                    upsert: true
                });
                
            if (uploadError) {
                console.error("Erro no upload:", uploadError);
                return NextResponse.json({ 
                    error: `Erro no upload: ${uploadError.message}` 
                }, { status: 500 });
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
        } catch (fileError) {
            console.error("Erro ao processar arquivo:", fileError);
            return NextResponse.json({ 
                error: `Erro ao processar arquivo: ${fileError.message}` 
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json({ 
            error: `Erro no upload da imagem: ${error.message || "Erro desconhecido"}`,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
} 