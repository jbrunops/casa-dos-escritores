'use server'; // Diretiva para Server Actions

// import { createServerSupabaseClient } from "@/lib/supabase-server"; // REMOVIDO
import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation"; // Não usado aqui

// NOVOS IMPORTS para criar cliente Supabase diretamente
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { Database } from '@/types/supabase'; // Importar tipos do Supabase

// Função de exclusão de Obra - ATIVADA E ATUALIZADA
export async function deleteObraAction(obraId: string): Promise<{ success: boolean; error?: string }> {
    // console.log("[Server Action] Tentando excluir obra:", obraId); // Log opcional

    if (!obraId) {
        console.error("ID da obra não fornecido para exclusão.");
        return { success: false, error: 'ID da obra inválido.' };
    }

    // <<< CRIAR CLIENTE SUPABASE DIRETAMENTE AQUI >>>
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
                remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
            },
        }
    );

    // 1. Verificar permissão (usuário logado é o autor?)
    let user;
    try {
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError; // Lança erro se a busca do usuário falhar
        user = userData;
        if (!user) {
            console.warn("Tentativa de exclusão de obra sem usuário logado.");
            return { success: false, error: "Usuário não autenticado." };
        }
    } catch(error) {
        console.error("Erro ao verificar usuário para excluir obra:", error);
        return { success: false, error: "Falha ao verificar autenticação." };
    }
    
    // Buscar autor da obra para confirmar permissão
    let obra;
    try {
        const { data: obraData, error: fetchError } = await supabase
            .from('series')
            .select('author_id')
            .eq('id', obraId)
            .single();
        
        if (fetchError) throw fetchError; // Lança erro se a busca falhar
        obra = obraData;

        if (!obra) {
            console.warn(`Obra ${obraId} não encontrada para exclusão.`);
            return { success: false, error: "Obra não encontrada." };
        }

        if (obra.author_id !== user.id) {
            console.error(`Erro de permissão: Usuário ${user.id} tentou excluir obra ${obraId} do autor ${obra.author_id}`);
            return { success: false, error: "Você não tem permissão para excluir esta obra." };
        }
    } catch (error) {
        console.error(`Erro ao buscar ou verificar permissão da obra ${obraId}:`, error);
        return { success: false, error: "Falha ao verificar dados da obra." };
    }

    // --- LÓGICA DE EXCLUSÃO REAL --- 
    try {
        // 2. Excluir capítulos associados PRIMEIRO
        const { error: chapterDeleteError } = await supabase
            .from('chapters')
            .delete()
            .eq('series_id', obraId);

        if (chapterDeleteError) {
            console.error(`Erro ao excluir capítulos da obra ${obraId}:`, chapterDeleteError);
            // Parar aqui, pois a exclusão da obra pode falhar ou deixar dados órfãos
            return { success: false, error: `Falha ao excluir capítulos associados: ${chapterDeleteError.message}` };
        }
        console.log(`Capítulos da obra ${obraId} excluídos por ${user.id}.`);

        // 3. Excluir a obra principal
        const { error: obraDeleteError } = await supabase
            .from('series')
            .delete()
            .eq('id', obraId)
            .eq('author_id', user.id); // Dupla verificação de segurança

        if (obraDeleteError) {
            console.error(`Erro ao excluir obra ${obraId} no DB:`, obraDeleteError);
            return { success: false, error: `Falha ao excluir obra: ${obraDeleteError.message}` };
        }

        console.log(`Obra ${obraId} excluída com sucesso por ${user.id}.`);
        
        // Revalidar caminhos
        revalidatePath('/');
        revalidatePath('/dashboard');
        // revalidatePath('/obra'); // Se existir essa página

        return { success: true }; 
        
    } catch (error: any) {
        console.error(`Erro inesperado durante a exclusão da obra ${obraId}:`, error);
        return { success: false, error: "Ocorreu um erro inesperado no servidor durante a exclusão." };
    }
}

// Função de exclusão de Capítulo - ATUALIZADA
export async function deleteChapterAction(chapterId: string): Promise<{ success: boolean; error?: string }> {
    // Remover logs de depuração
    // console.log("--- [SA START] deleteChapterAction chamada com ID:", chapterId);

    if (!chapterId) {
        console.error("ID do capítulo não fornecido para exclusão.");
        return { success: false, error: 'ID do capítulo inválido.' };
    }

    // <<< CRIAR CLIENTE SUPABASE DIRETAMENTE AQUI >>>
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
                remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
            },
        }
    );

    try {
        // Obter usuário logado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn("Tentativa de exclusão de capítulo sem usuário logado.");
            return { success: false, error: 'Usuário não autenticado.' };
        }

        // Executar exclusão
        const { error } = await supabase
            .from('chapters')
            .delete()
            .eq('id', chapterId)
            .eq('author_id', user.id); // Garante que só o autor pode deletar

        if (error) {
            console.error(`Erro do Supabase ao excluir capítulo ID ${chapterId} (User: ${user.id}):`, error);
            return { success: false, error: `Erro ao excluir capítulo: ${error.message}` };
        }

        // Exclusão bem-sucedida no DB
        console.log(`Capítulo ${chapterId} excluído com sucesso por ${user.id}.`);

        // Revalidação (manter a mais ampla por enquanto, ajustar depois se necessário)
        revalidatePath('/'); 

        return { success: true };

    } catch (e: any) {
        console.error(`Exceção inesperada ao excluir capítulo ID ${chapterId}:`, e);
        return { success: false, error: 'Ocorreu um erro inesperado no servidor durante a exclusão.' };
    }
} 