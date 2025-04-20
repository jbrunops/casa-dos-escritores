import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server";

// Usar GET para exclusão via link é geralmente desencorajado (use DELETE)
// Mas mantendo a estrutura existente por enquanto.
export async function GET(request: NextRequest) {
    const cookieStore = cookies();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Series ID not provided" }, { status: 400 });
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    // @ts-ignore Linter seems incorrect here
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // @ts-ignore Linter seems incorrect here
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    // @ts-ignore Linter seems incorrect here
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    );

    try {
        // 1. Obter sessão do usuário a partir dos cookies
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            console.error("Authentication error:", sessionError);
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 2. Verificar se o usuário é o autor da série
        const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .select("author_id")
            .eq("id", id)
            .single();

        if (seriesError || !seriesData) {
            console.error(`Series not found (ID: ${id}):`, seriesError);
            return NextResponse.json({ error: "Series not found" }, { status: 404 });
        }

        if (seriesData.author_id !== userId) {
            console.warn(`Forbidden: User ${userId} attempted to delete series ${id} owned by ${seriesData.author_id}`);
            return NextResponse.json({ error: "Forbidden: Only the author can delete this series" }, { status: 403 });
        }

        // 3. Excluir (Usar Supabase com RLS/Policies é preferível, mas mantendo a lógica atual)
        // Idealmente, usar a chave de serviço para operações em cascata ou garantir RLS.
        // Criando um cliente com chave de serviço para exclusão segura:
         const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, // !!! CUIDADO: USAR CHAVE DE SERVIÇO !!!
             {
                 cookies: {
                     get(name: string) {
                         // @ts-ignore Linter seems incorrect here
                         return cookieStore.get(name)?.value
                     },
                     set(name: string, value: string, options: CookieOptions) {
                         // @ts-ignore Linter seems incorrect here
                         cookieStore.set({ name, value, ...options })
                     },
                     remove(name: string, options: CookieOptions) {
                         // @ts-ignore Linter seems incorrect here
                         cookieStore.set({ name, value: '', ...options })
                     },
                 },
             }
        );

        // Excluir capítulos (assumindo que são da tabela 'stories')
        // TODO: Verificar nome correto da tabela de capítulos, pode ser 'chapters'
        const { error: chaptersDeleteError } = await supabaseAdmin
            .from("chapters") // <<< VERIFICAR NOME DA TABELA
            .delete()
            .eq("series_id", id);
        if (chaptersDeleteError) {
            console.error(`Error deleting chapters for series ${id}:`, chaptersDeleteError);
            // Pode decidir continuar ou parar aqui
        }

        // Excluir comentários associados (se houver)
        // TODO: Verificar se comentários estão ligados diretamente à série ou capítulos
        const { error: commentsDeleteError } = await supabaseAdmin
            .from("comments")
            .delete()
            .eq("series_id", id); // <<< VERIFICAR SE CAMPO series_id EXISTE EM comments
        if (commentsDeleteError) {
             console.error(`Error deleting comments for series ${id}:`, commentsDeleteError);
             // Pode decidir continuar ou parar aqui
        }

        // Excluir a série
        const { error: seriesDeleteError } = await supabaseAdmin
            .from("series")
            .delete()
            .eq("id", id);

        if (seriesDeleteError) {
            console.error(`Error deleting series ${id}:`, seriesDeleteError);
            throw new Error(`Failed to delete series: ${seriesDeleteError.message}`);
        }

        console.log(`Series ${id} deleted successfully by user ${userId}`);

        // Redirecionar para o dashboard após concluir
        const redirectUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(redirectUrl);

    } catch (error: any) {
        console.error("API Error (Series Delete GET):", error);
        // Evitar expor detalhes do erro no cliente
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// É recomendado usar o método DELETE para operações de exclusão
export async function DELETE(request: NextRequest) {
   // A lógica seria muito similar ao GET, mas pegando o ID de outra forma
   // (ex: /api/series/delete/[id]) ou do corpo da requisição.
   // Por enquanto, retorna método não permitido.
    return NextResponse.json({ error: "Method Not Allowed. Use GET for now." }, { status: 405 });
} 