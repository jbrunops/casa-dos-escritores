// src/app/api/series/complete/route.js
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
            return new Response(
                "Apenas o autor pode marcar esta série como completa",
                { status: 403 }
            );
        }

        // Marcar a série como completa
        const { error: updateError } = await supabase
            .from("series")
            .update({ is_completed: true })
            .eq("id", id);

        if (updateError) {
            throw updateError;
        }

        // Redirecionar de volta para a página da série
        return NextResponse.redirect(new URL(`/series/${id}`, request.url));
    } catch (error) {
        console.error("Erro ao completar série:", error);
        return new Response(`Erro ao completar série: ${error.message}`, {
            status: 500,
        });
    }
}
