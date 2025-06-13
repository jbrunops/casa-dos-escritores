import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { csrfProtection, addCSRFHeaders } from "@/lib/csrf-protection";
import { logSecurityEvent, logSuspiciousUpload, SECURITY_EVENTS, SEVERITY_LEVELS } from "@/lib/security-logger";

// Configurações de segurança para upload
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// Magic numbers para validação de tipo de arquivo
const FILE_SIGNATURES = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46]
};

/**
 * Valida o arquivo verificando magic numbers
 * @param {ArrayBuffer} buffer - Buffer do arquivo
 * @param {string} declaredType - Tipo MIME declarado
 * @returns {boolean} True se o arquivo é válido
 */
function validateFileSignature(buffer, declaredType) {
    const signature = FILE_SIGNATURES[declaredType];
    if (!signature) return false;
    
    const uint8Array = new Uint8Array(buffer);
    
    // Verificar para JPEG
    if (declaredType === 'image/jpeg') {
        return uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF;
    }
    
    // Verificar para PNG
    if (declaredType === 'image/png') {
        return uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
               uint8Array[2] === 0x4E && uint8Array[3] === 0x47;
    }
    
    // Verificar para WebP
    if (declaredType === 'image/webp') {
        return uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && 
               uint8Array[2] === 0x46 && uint8Array[3] === 0x46;
    }
    
    return false;
}

// Função para lidar com upload de arquivos usando a chave de serviço
export async function POST(request) {
    try {
        // Aplicar rate limiting primeiro
        const rateLimitResponse = rateLimitMiddleware(request, 'upload');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Aplicar proteção CSRF
        const csrfResponse = csrfProtection(request, 'upload');
        if (csrfResponse) {
            return csrfResponse;
        }

        // Verificar autenticação primeiro
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

        if (sessionError || !session) {
            logSecurityEvent(
                SECURITY_EVENTS.AUTH_FAILURE,
                SEVERITY_LEVELS.MEDIUM,
                { operation: 'upload_attempt', reason: 'no_session' },
                request
            );
            
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
            logSecurityEvent(
                SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
                SEVERITY_LEVELS.HIGH,
                { 
                    operation: 'upload_userid_mismatch',
                    sessionUserId: session.user.id,
                    requestedUserId: userId
                },
                request
            );
            
            return NextResponse.json(
                { error: "Você só pode fazer upload para sua própria conta" },
                { status: 403 }
            );
        }

        // Validações de segurança do arquivo
        
        // 1. Verificar tamanho do arquivo
        if (file.size > MAX_FILE_SIZE) {
            logSuspiciousUpload(
                userId,
                file.name,
                `Arquivo muito grande: ${file.size} bytes`,
                request
            );
            
            return NextResponse.json(
                { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // 2. Verificar tipo MIME
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            logSuspiciousUpload(
                userId,
                file.name,
                `Tipo MIME não permitido: ${file.type}`,
                request
            );
            
            return NextResponse.json(
                { error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_FILE_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // 3. Verificar extensão do arquivo
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
            logSuspiciousUpload(
                userId,
                file.name,
                `Extensão não permitida: ${fileExt}`,
                request
            );
            
            return NextResponse.json(
                { error: `Extensão não permitida. Extensões aceitas: ${ALLOWED_EXTENSIONS.join(', ')}` },
                { status: 400 }
            );
        }

        // 4. Verificar se o nome do arquivo não contém caracteres perigosos
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
        if (safeName !== file.name) {
            logSuspiciousUpload(
                userId,
                file.name,
                'Nome de arquivo com caracteres suspeitos',
                request
            );
            
            return NextResponse.json(
                { error: "Nome do arquivo contém caracteres não permitidos" },
                { status: 400 }
            );
        }

        // Obter buffer do arquivo para validação
        const buffer = await file.arrayBuffer();
        
        // 5. Verificar magic numbers para validar tipo real do arquivo
        if (!validateFileSignature(buffer, file.type)) {
            logSuspiciousUpload(
                userId,
                file.name,
                `Magic numbers não correspondem ao tipo declarado: ${file.type}`,
                request
            );
            
            return NextResponse.json(
                { error: "Tipo de arquivo não corresponde ao conteúdo" },
                { status: 400 }
            );
        }
        
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
        logSecurityEvent(
            SECURITY_EVENTS.UPLOAD_ATTEMPT,
            SEVERITY_LEVELS.LOW,
            {
                userId,
                fileName,
                fileSize: file.size,
                fileType: file.type,
                success: true
            },
            request
        );
        
        const response = NextResponse.json({ url });
        return addCSRFHeaders(response);
        
    } catch (error) {
        console.error("Erro no servidor:", error);
        
        logSecurityEvent(
            SECURITY_EVENTS.UPLOAD_ATTEMPT,
            SEVERITY_LEVELS.HIGH,
            { error: error.message, success: false },
            request
        );
        
        return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
    }
} 