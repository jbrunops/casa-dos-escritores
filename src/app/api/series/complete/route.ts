import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server";

// Usar GET para uma ação de escrita (marcar como completa) também é desencorajado.
// PATCH ou POST seriam mais apropriados, mas mantendo a estrutura existente.
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
        // 1. Obter sessão do usuário
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
            console.warn(`Forbidden: User ${userId} attempted to mark series ${id} as complete (owned by ${seriesData.author_id})`);
            return NextResponse.json(
                { error: "Forbidden: Only the author can mark this series as complete" },
                { status: 403 }
            );
        }

        // 3. Marcar a série como completa (is_completed = true)
        const { error: updateError } = await supabase
            .from("series")
            .update({ is_completed: true })
            .eq("id", id);

        if (updateError) {
            console.error(`Error marking series ${id} as complete:`, updateError);
            throw new Error(`Failed to mark series as complete: ${updateError.message}`);
        }

        console.log(`Series ${id} marked as complete by user ${userId}`);

        // Redireciona para a página da obra após completar
        const redirectUrl = new URL(`/obra/${id}`, request.url);
        return NextResponse.redirect(redirectUrl);

    } catch (error: any) {
        console.error("API Error (Series Complete GET):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Seria melhor ter um endpoint PATCH /api/series/[id]
// com { "is_completed": true } no corpo
export async function POST(request: NextRequest) {
    return NextResponse.json({ error: "Method Not Allowed. Use GET for now." }, { status: 405 });
}
export async function PATCH(request: NextRequest) {
    return NextResponse.json({ error: "Method Not Allowed. Use GET for now." }, { status: 405 });
} 