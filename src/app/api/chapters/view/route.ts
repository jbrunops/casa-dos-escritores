import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url!);
        const id = url.searchParams.get("id");
        if (!id) {
            return NextResponse.json(
                { error: "ID do capítulo não fornecido" },
                { status: 400 }
            );
        }
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: chapter, error: getError } = await supabase
            .from("chapters")
            .select("view_count")
            .eq("id", id)
            .single();
        if (getError || !chapter) {
            console.error("Erro ao buscar capítulo:", getError);
            return NextResponse.json(
                { error: "Capítulo não encontrado" },
                { status: 404 }
            );
        }
        const { error: updateError } = await supabase
            .from("chapters")
            .update({ view_count: chapter.view_count + 1 })
            .eq("id", id);
        if (updateError) {
            console.error("Erro ao atualizar visualizações:", updateError);
            return NextResponse.json(
                { error: "Erro ao atualizar visualizações" },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
