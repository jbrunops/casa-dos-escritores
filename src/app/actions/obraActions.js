'use server'; // Diretiva para Server Actions

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Função de exclusão de Obra - ATIVADA
export async function deleteObraAction(obraId) {
    console.log("[Server Action] Tentando excluir obra REALMENTE:", obraId);
    const supabase = await createServerSupabaseClient();

    // 1. Verificar permissão (usuário logado é o autor?)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Erro de permissão: Usuário não logado.");
        return { success: false, error: "Usuário não logado." };
    }

    // Buscar autor da obra
    const { data: obra, error: fetchError } = await supabase
        .from('series')
        .select('author_id')
        .eq('id', obraId)
        .single();

    if (fetchError || !obra) {
        console.error("Erro ao buscar obra ou obra não encontrada:", fetchError);
        return { success: false, error: "Obra não encontrada." };
    }

    if (obra.author_id !== user.id) {
        console.error(`Erro de permissão: Usuário ${user.id} não é autor da obra ${obraId} (Autor: ${obra.author_id})`);
        return { success: false, error: "Você não tem permissão para excluir esta obra." };
    }

    // --- LÓGICA DE EXCLUSÃO REAL --- 
    try {
        // 2. (Opcional, mas recomendado) Excluir capítulos associados PRIMEIRO
        // Se houver comentários ou outras dependências nos capítulos, eles precisam ser tratados também.
        const { error: chapterDeleteError } = await supabase
            .from('chapters')
            .delete()
            .eq('series_id', obraId);

        if (chapterDeleteError) {
            console.error(`Erro ao excluir capítulos da obra ${obraId}:`, chapterDeleteError);
            // Dependendo da criticidade, você pode querer parar aqui ou continuar
            // return { success: false, error: `Falha ao excluir capítulos: ${chapterDeleteError.message}` };
        }
        console.log(`Capítulos da obra ${obraId} excluídos (ou nenhum encontrado).`);

        // 3. Excluir a obra principal
        const { error: obraDeleteError } = await supabase
            .from('series')
            .delete()
            .eq('id', obraId);

        if (obraDeleteError) {
            console.error("Erro ao excluir obra no DB:", obraDeleteError);
            return { success: false, error: `Falha ao excluir obra: ${obraDeleteError.message}` };
        }

        console.log(`[Server Action] Obra ${obraId} excluída com sucesso do DB.`);
        
        // Revalidar caminhos para atualizar cache
        revalidatePath('/'); // Revalida a home page
        revalidatePath('/dashboard'); // Revalida o dashboard
        revalidatePath('/obra'); // Revalida o índice de obras, se houver
        // Não precisamos revalidar a própria página /obra/[id] pois ela não existirá mais

        return { success: true }; 
        
    } catch (error) {
        console.error("Erro inesperado durante a exclusão da obra:", error);
        return { success: false, error: "Ocorreu um erro inesperado no servidor." };
    }
}

// Função de exclusão de Capítulo - AINDA SIMULADA (ativar separadamente se necessário)
export async function deleteChapterAction(chapterId) {
    console.log("[Server Action] Tentando excluir capítulo (SIMULADO):", chapterId);
    // ... (código de verificação de permissão)
    // ...
    // const { data: chapter, error: fetchError } = await supabase...;
    // if (chapter.author_id !== user.id) { ... }
    
    // --- LÓGICA DE EXCLUSÃO REAL (COMENTADA) ---
    /*
    const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

    if (deleteError) {
        console.error("Erro ao excluir capítulo no DB:", deleteError);
        return { success: false, error: deleteError.message };
    }
    */
    console.log(`[Server Action] Exclusão do capítulo ${chapterId} SIMULADA com sucesso.`);
    // Revalidar a página da obra específica
    // if (chapter?.series_id) { 
    //     revalidatePath(`/obra/${chapter.series_id}`);
    // }
    return { success: true };
} 