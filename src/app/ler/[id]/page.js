import Link from "next/link";
// import Comments from "@/components/Comments"; // Movido para ContentViewer
import { createServerSupabaseClient } from "@/lib/supabase-server";
// import StoryContent from "@/components/StoryContent"; // Movido para ContentViewer
import { ArrowLeft, ArrowRight, BookOpen, ListOrdered } from "lucide-react"; // Mantido para caso de fallback/erro
// import Script from "next/script"; // Removido - incremento de view deve ser API/server-side
import { extractIdFromSlug, generateSlug } from "@/lib/utils";
import ContentViewer from "@/components/ContentViewer"; // Importar o novo componente
import { notFound } from 'next/navigation'; // Importar notFound

export async function generateMetadata({ params }) {
    let id;
    try {
        const slug = await Promise.resolve(params.id);
        id = extractIdFromSlug(slug) || slug;
        const supabase = await createServerSupabaseClient();

        // Tenta buscar como Capítulo primeiro
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select("title, series(title)")
            .eq("id", id)
            .single();

        if (chapter && !chapterError) {
             return {
                title: `${chapter.title} | ${chapter.series?.title || 'Série'} - Casa dos Escritores`,
            };
        }

        // Se não for capítulo, tenta buscar como Story
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select("title") // Apenas o título é necessário aqui
            .eq("id", id)
            .single();
            
        if (story && !storyError) {
            return {
                title: `${story.title} - Casa dos Escritores`, // Título para story
            };
        }

        console.warn(`Metadata: Conteúdo não encontrado (nem capítulo, nem story) para ID '${id}', Slug: '${params.id}'`);
        return { title: "Conteúdo não encontrado - Casa dos Escritores" };

    } catch (error) {
        console.error("Erro inesperado ao gerar metadata do conteúdo:", { error, id, params });
        return { title: "Conteúdo - Casa dos Escritores" };
    }
}

export default async function ReaderPage({ params }) {
    let id;
    try {
        const slug = params.id;
        id = extractIdFromSlug(slug) || slug;

        console.log("----- DIAGNÓSTICO DE LEITURA -----");
        console.log("Slug recebido da URL:", slug);
        console.log("ID extraído para consulta:", id);
        console.log("Tipo do ID:", typeof id);

        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // 1. Tentar buscar como Capítulo (sem profile junto)
        console.log(`Tentando buscar capítulo com ID: ${id}`);
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select(`
                id, title, content, chapter_number, created_at, series_id, author_id,
                series ( id, title ) 
            `)
            .eq("id", id)
            .single();

        if (chapterError) {
            console.warn(`Erro ao buscar dados base do capítulo com ID '${id}' (continuando para buscar story):`, chapterError.message);
        }

        // Se encontrou um capítulo VÁLIDO (com série e author_id)
        if (chapter && !chapterError && chapter.series && chapter.author_id) {
            console.log("Capítulo (dados base) encontrado:", chapter.id, chapter.title);
            
            // 1.1 Buscar perfil do autor separadamente
            console.log(`Buscando perfil do autor com ID: ${chapter.author_id}`);
            const { data: authorProfile, error: profileError } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .eq("id", chapter.author_id)
                .single();
                
            if (profileError || !authorProfile) {
                 console.error(`Erro ao buscar perfil do autor ID '${chapter.author_id}' para o capítulo '${chapter.id}':`, profileError?.message);
                 // Decide se continua sem autor ou dá notFound. 
                 // Por ora, vamos dar notFound para garantir consistência
                 console.error("Não foi possível carregar o perfil do autor. Abortando renderização.");
                 notFound(); 
            }
            
            console.log("Perfil do autor encontrado:", authorProfile.username);

            // 1.2 Buscar navegação (apenas para capítulos)
            const { data: siblings, error: siblingsError } = await supabase
                .from("chapters")
                .select("id, chapter_number, title")
                .eq("series_id", chapter.series_id)
                .order("chapter_number", { ascending: true });

            if (siblingsError) {
                console.error("Erro ao buscar capítulos irmãos:", siblingsError?.message);
                // Não crítico, continua sem navegação
            }

            let prevChapter = null;
            let nextChapter = null;
            if (siblings) {
                const currentIndex = siblings.findIndex((ch) => ch.id === chapter.id);
                if (currentIndex > 0) prevChapter = siblings[currentIndex - 1];
                if (currentIndex < siblings.length - 1) nextChapter = siblings[currentIndex + 1];
            }

            // Renderizar capítulo com dados combinados
            return (
                <ContentViewer
                    contentType="chapter"
                    contentId={chapter.id}
                    title={chapter.title}
                    content={chapter.content}
                    authorProfile={authorProfile}
                    createdAt={chapter.created_at}
                    seriesInfo={chapter.series}
                    chapterNumber={chapter.chapter_number}
                    navigation={{
                        prevChapter: prevChapter,
                        nextChapter: nextChapter,
                    }}
                    userId={userId}
                />
            );
        } else if (chapter && !chapterError) {
            // Capítulo encontrado, mas faltam dados essenciais (série ou author_id)
            console.warn(`Capítulo encontrado com ID '${id}', mas dados associados (série ou author_id) ausentes. Verifique a consistência dos dados.`);
            // Considerar se deve dar notFound() ou uma mensagem específica
            notFound();
        }

        // Se não encontrou capítulo ou houve erro na busca base, log já foi feito.
        // Procede para buscar story.
        console.log(`Nenhum capítulo válido encontrado com ID ${id}. Tentando buscar story...`);

        // 2. Tentar buscar como Story (se não encontrou capítulo válido)
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select(`
                id, title, content, created_at, author_id,
                profiles ( id, username, avatar_url )
            `)
            .eq("id", id)
            // .eq('is_part_of_series', false) // Descomentar se quiser garantir que só busca histórias únicas
            .single();
            
        if (storyError) {
            // Log específico para o erro "no rows returned" que é esperado se não for uma story
            if (storyError.message.includes("multiple (or no) rows returned")) {
                 console.log(`Nenhuma story encontrada com o ID ${id}.`);
            } else {
                 console.error(`Erro ao buscar story com ID '${id}':`, storyError.message);
            }
        }

        // Se encontrou uma story VÁLIDA (com perfil)
        if (story && !storyError && story.profiles) {
            console.log("Story encontrada:", story.id, story.title);

            // Renderizar story
            return (
                <ContentViewer
                    contentType="story"
                    contentId={story.id}
                    title={story.title}
                    content={story.content}
                    authorProfile={story.profiles}
                    createdAt={story.created_at}
                    seriesInfo={null}
                    chapterNumber={null}
                    navigation={null}
                    userId={userId}
                />
            );
        } else if (story && !storyError) {
             console.warn(`Story encontrada com ID '${id}', mas perfil do autor ausente via join. Verifique a consistência dos dados ou a relação 'stories -> profiles'.`);
             // Pode tentar buscar o perfil separadamente como fallback se necessário
             notFound(); // Por ora, falha se o join não funcionar
        }

        // 3. Se não encontrou nem capítulo nem story válidos
        console.error(`Conteúdo final não encontrado (nem capítulo válido, nem story válida) para ID '${id}'`);
        notFound(); // Chama a página 404

    } catch (error) {
        console.error(`Erro GERAL na página de leitura para ID '${id || params.id}':`, error);
        if (error && error.message) {
            console.error("Mensagem de erro:", error.message);
        }
        notFound();
    }
}