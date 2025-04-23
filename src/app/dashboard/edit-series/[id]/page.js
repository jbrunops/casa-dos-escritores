"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { Loader2 } from "lucide-react";

export default function EditSeriesPage() {
    const router = useRouter();
    const params = useParams();
    const seriesId = params.id;
    const supabase = createBrowserClient();
    
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSeries() {
            try {
                setLoading(true);
                
                // Verificar se o usuário está autenticado
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/login");
                    return;
                }

                // Buscar a série
                const { data, error } = await supabase
                    .from("series")
                    .select("*")
                    .eq("id", seriesId)
                    .single();

                if (error) {
                    console.error("Erro ao buscar série:", error);
                    throw error;
                }

                if (!data) {
                    throw new Error("Série não encontrada");
                }

                // Verificar se o usuário é o autor da série
                if (data.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }

                setSeries(data);
                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar série:", err);
                setError("Não foi possível carregar esta série. Por favor, tente novamente.");
                setLoading(false);
            }
        }

        fetchSeries();
    }, [seriesId, router, supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={40} className="animate-spin text-[#484DB5]" />
                <span className="ml-2 text-lg text-gray-600">Carregando dados da série...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!series) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                    <p>Série não encontrada</p>
                </div>
            </div>
        );
    }

    return (
        <ContentEditor
            type="series"
            headerTitle="Editar Série"
            backPath={`/series/${seriesId}`}
            backLabel="Voltar para a Série"
            title={series.title}
            description={series.description || ""}
            category={series.genre || ""}
            existingId={seriesId}
            coverUrl={series.cover_url || ""}
        />
    );
} 