import Link from "next/link";
// import { createServerSupabaseClient } from "@/lib/supabase-server"; // REMOVIDO
import { Edit, BookOpen, Share2, MessageSquare, BookText, Book } from "lucide-react";
import SeriesHighlights from "@/components/SeriesHighlights";
import { generateSlug, createSummary, formatDate } from "@/lib/utils";
import RecentContentList from "@/components/RecentContentList";
import MostCommentedList from "@/components/MostCommentedList";
import TopWritersList from "@/components/TopWritersList";

// NOVOS IMPORTS para criar cliente Supabase diretamente
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Adicionei CookieOptions aqui
import { Database } from '@/types/supabase'; // Importar tipos do Supabase
import { PostgrestError } from '@supabase/supabase-js'; // Importar tipo PostgrestError

// Definir tipos esperados para os dados das RPCs (idealmente mais específicos)
type RecentContent = any[]; // Substituir 'any' por tipos específicos
type MostCommentedContent = any[]; // Substituir 'any' por tipos específicos
type TopWriter = any[]; // Substituir 'any' por tipos específicos

export default async function HomePage() {
    // <<< CRIAR CLIENTE SUPABASE DIRETAMENTE AQUI >>>
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                // set e remove não são necessários para leitura de dados
                // Adicionei tipos para set/remove para consistência, embora não usados
                set(name: string, value: string, options: CookieOptions) { 
                    try {
                        cookieStore.set({ name, value, ...options }); 
                    } catch (error) { /* Ignorar erro em Server Components */ }
                },
                remove(name: string, options: CookieOptions) { 
                    try {
                        cookieStore.set({ name, value: '', ...options });
                     } catch (error) { /* Ignorar erro em Server Components */ }
                },
            },
        }
    );

    // Buscar todos os dados necessários em paralelo usando as funções RPC
    // Correção da tipagem na desestruturação
    const [
        recentResult,
        mostCommentedResult,
        topWritersResult
    ] = await Promise.all([
        supabase.rpc('get_recent_content', { p_limit: 10, p_offset: 0 }) as Promise<{ data: RecentContent | null, error: PostgrestError | null }>,
        supabase.rpc('get_most_commented_content', { p_limit: 10, p_offset: 0 }) as Promise<{ data: MostCommentedContent | null, error: PostgrestError | null }>,
        supabase.rpc('get_top_writers', { p_limit: 10, p_offset: 0 }) as Promise<{ data: TopWriter | null, error: PostgrestError | null }>
    ]);

    // Extrair dados e erros após a resolução da Promise
    const recentContent = recentResult.data;
    const recentError = recentResult.error;
    const mostCommentedContent = mostCommentedResult.data;
    const commentedError = mostCommentedResult.error;
    const topWriters = topWritersResult.data;
    const writersError = topWritersResult.error;

    // Logar os dados recebidos *antes* de checar erros
    // console.log("[ Server ] Dados recebidos - Recentes:", JSON.stringify(recentContent, null, 2));
    // console.log("[ Server ] Dados recebidos - Comentados:", JSON.stringify(mostCommentedContent, null, 2));
    // console.log("[ Server ] Dados recebidos - Escritores:", JSON.stringify(topWriters, null, 2));

    // Ajustar logs de erro
    if (recentError) console.error("[ Server ] Erro ao buscar conteúdo recente:", JSON.stringify(recentError, null, 2));
    if (commentedError) console.error("[ Server ] Erro ao buscar conteúdo mais comentado:", JSON.stringify(commentedError, null, 2));
    if (writersError) console.error("[ Server ] Erro ao buscar top escritores:", JSON.stringify(writersError, null, 2));

    // Adicionar verificação para garantir que os arrays não são null antes de passar para os componentes
    const recentContentList = recentContent ?? [];
    const mostCommentedContentList = mostCommentedContent ?? [];
    const topWritersList = topWriters ?? [];

    return (
        <>
            {/* Seção de 3 colunas */}
            <section className="max-w-[75rem] mx-auto three-columns-section">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Coluna 1: Histórias Recentes */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-[#E5E7EB] pb-2 relative">
                            Recentes
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <RecentContentList contentList={recentContentList} />
                    </div>

                    {/* Coluna 2: Mais Comentados */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4  border-[#E5E7EB] pb-2 relative">
                            Mais Comentados
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <MostCommentedList contentList={mostCommentedContentList} />
                    </div>

                    {/* Coluna 3: Top 10 Escritores */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4  border-[#E5E7EB] pb-2 relative">
                            Top 10 Escritores
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <TopWritersList writers={topWritersList} />
                    </div>
                </div>
            </section>

            {/* NOVA SEÇÃO: Séries Destacadas */}
            <section className="max-w-[75rem] mx-auto series-highlights-section">
                <SeriesHighlights />
            </section>

            <section className="max-w-[75rem] mx-auto py-12 features-section">
                <h2 className="text-3xl font-extrabold text-black mb-8 pb-2 relative">
                    Como funciona
                    <span className="block h-1 w-64 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 features-grid">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-border flex flex-col items-center text-center feature-card">
                        <div className="bg-primary-100 p-4 rounded-full mb-4 feature-icon">
                            <Edit size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-primary">1. Crie uma conta</h3>
                        <p className="text-gray-700">
                            Registre-se gratuitamente para começar a
                            compartilhar suas histórias com outros leitores.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-border flex flex-col items-center text-center feature-card">
                        <div className="bg-primary-100 p-4 rounded-full mb-4 feature-icon">
                            <BookOpen size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-primary">2. Escreva suas histórias</h3>
                        <p className="text-gray-700">
                            Use nosso editor intuitivo para criar suas obras com
                            formatação profissional.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-border flex flex-col items-center text-center feature-card">
                        <div className="bg-primary-100 p-4 rounded-full mb-4 feature-icon">
                            <Share2 size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-primary">3. Compartilhe com o mundo</h3>
                        <p className="text-gray-700">
                            Publique suas histórias e receba feedback valioso da
                            comunidade de leitores.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
} 