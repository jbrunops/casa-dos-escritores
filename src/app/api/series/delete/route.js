// src/app/api/series/delete/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request) {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return new Response("ID da série não fornecido", { status: 400 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Autenticar usuário
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return new Response("Não autorizado", { status: 401 });
        }

        // Verificar se o usuário é o autor da série
        const { data: series, error: seriesError } = await supabase
            .from("series")
            .select("author_id")
            .eq("id", id)
            .single();

        if (seriesError || !series) {
            return new Response("Série não encontrada", { status: 404 });
        }

        if (series.author_id !== session.user.id) {
            return new Response("Apenas o autor pode excluir esta série", {
                status: 403,
            });
        }

        // Excluir todos os capítulos da série
        await supabase.from("stories").delete().eq("series_id", id);

        // Excluir comentários da série
        await supabase.from("comments").delete().eq("series_id", id);

        // Excluir a série
        const { error: deleteError } = await supabase
            .from("series")
            .delete()
            .eq("id", id);

        if (deleteError) {
            throw deleteError;
        }

        // Redirecionar para o dashboard após concluir
        return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
        console.error("Erro ao excluir série:", error);
        return new Response(`Erro ao excluir série: ${error.message}`, {
            status: 500,
        });
    }
}
