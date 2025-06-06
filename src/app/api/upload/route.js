import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Configurações de segurança para upload
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// Função para lidar com upload de arquivos usando a chave de serviço
export async function POST(request) {
    try {
        // Verificar autenticação primeiro
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: "Não autorizado - faça login para fazer upload" },
                { status: 401 }
            );
        }

        // Usar cliente do Supabase com chave de serviço para ignorar RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

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

        // Verificar se o usuário autenticado é o mesmo que está fazendo upload
        if (userId !== session.user.id) {
            return NextResponse.json(
                { error: "Você só pode fazer upload para sua própria conta" },
                { status: 403 }
            );
        }

        // Validações de segurança do arquivo
        
        // 1. Verificar tamanho do arquivo
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // 2. Verificar tipo MIME
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_FILE_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // 3. Verificar extensão do arquivo
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
            return NextResponse.json(
                { error: `Extensão não permitida. Extensões aceitas: ${ALLOWED_EXTENSIONS.join(', ')}` },
                { status: 400 }
            );
        }

        // 4. Verificar se o nome do arquivo não contém caracteres perigosos
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
        if (safeName !== file.name) {
            return NextResponse.json(
                { error: "Nome do arquivo contém caracteres não permitidos" },
                { status: 400 }
            );
        }

        // Obter informações do arquivo
        const buffer = await file.arrayBuffer();
        
        // Gerar nome seguro para o arquivo
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `series_${userId}_${timestamp}_${randomString}.${fileExt}`;
        const filePath = `series_covers/${fileName}`;
        
        // Converter ArrayBuffer para Blob
        const blob = new Blob([buffer], { type: file.type });
        
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

        // Log de auditoria
        console.log(`[AUDIT] Upload realizado - Usuário: ${userId}, Arquivo: ${fileName}, Tamanho: ${file.size} bytes`);
        
        return NextResponse.json({ url });
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
    }
} 