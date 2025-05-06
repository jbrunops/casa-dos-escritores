// src/app/dashboard/edit/[id]/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
// import TipTapEditor from "@/components/TipTapEditor"; // Será usado dentro do ContentEditor
import Link from "next/link";
// import DeleteModal from "@/components/DeleteModal"; // Lógica de exclusão será movida para ContentEditor ou gerenciada por ele
import {
    ArrowLeft,
    // Save, // Ícones de ação estarão no ContentEditor
    // Eye,
    // Trash2,
    AlertTriangle,
    CheckCircle2,
    // Send,
    // FileText,
    // Clock,
    // BookOpen,
    // RefreshCw,
} from "lucide-react";
// import { generateSlug } from "@/lib/utils"; // Se necessário, ContentEditor pode usar

import ContentEditor from "@/components/ContentEditor"; // Importar o componente principal

export default function EditContentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id; // existingId para ContentEditor

    const [initialContentType, setInitialContentType] = useState(null); // "story" ou "chapter"
    const [loadingType, setLoadingType] = useState(true);
    const [errorType, setErrorType] = useState(null);
    const [authorId, setAuthorId] = useState(null); // Para verificar permissão
    const [initialDataForEditor, setInitialDataForEditor] = useState(null); // Para passar dados iniciais se ContentEditor não buscar

    const supabase = createBrowserClient();

    useEffect(() => {
        const determineContentTypeAndPermissions = async () => {
            if (!id) {
                setErrorType("ID do conteúdo não encontrado.");
                setLoadingType(false);
                router.push("/dashboard"); // Ou uma página de erro
                return;
            }

            setLoadingType(true);
            setErrorType(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login"); // Redirecionar se não estiver logado
                setLoadingType(false);
                return;
            }

            // Tentar buscar como história primeiro
            const { data: story, error: storyError } = await supabase
                .from("stories")
                .select("id, author_id, title, content, category, is_published, series_id") // series_id pode não existir, mas não prejudica
                .eq("id", id)
                .single();

            if (story && story.author_id === user.id) {
                setInitialContentType("story");
                setAuthorId(story.author_id);
                // Opcional: passar dados iniciais se ContentEditor não for buscar por conta própria
                // setInitialDataForEditor({ title: story.title, content: story.content, category: story.category, is_published: story.is_published });
                setLoadingType(false);
                return;
            }

            // Se não for história do usuário ou erro (exceto 'PGRST116' no rows found), tenta capítulo
            if (storyError && storyError.code !== 'PGRST116') {
                 console.error("Erro ao buscar história:", storyError);
            }

            const { data: chapter, error: chapterError } = await supabase
                .from("chapters")
                .select("id, author_id, series_id, title, content, chapter_number")
                .eq("id", id)
                .single();

            if (chapter && chapter.author_id === user.id) {
                setInitialContentType("chapter");
                setAuthorId(chapter.author_id);
                // Opcional: passar dados iniciais
                // setInitialDataForEditor({ title: chapter.title, content: chapter.content, chapter_number: chapter.chapter_number, series_id: chapter.series_id });
                setLoadingType(false);
                return;
            }

            if (chapterError && chapterError.code !== 'PGRST116') {
                console.error("Erro ao buscar capítulo:", chapterError);
            }
            
            // Se chegou aqui, não encontrou ou não tem permissão
            setErrorType("Conteúdo não encontrado ou você não tem permissão para editá-lo.");
            setInitialContentType(null); // Nenhum tipo válido encontrado
            setLoadingType(false);
            // router.push("/dashboard"); // Considerar redirecionar
        };

        determineContentTypeAndPermissions();
    }, [id, router, supabase]);

    // Lógica de navegação de volta, pode ser passada para ContentEditor
    const handleBackNavigation = () => {
        // Poderia ser mais inteligente, ex: voltar para a série se for capítulo
        router.push("/dashboard"); 
    };

    // A submissão será gerenciada por ContentEditor, mas se precisarmos de um wrapper:
    // const handleSubmitWrapper = async (formData) => {
    //     console.log("Dados do ContentEditor para salvar:", formData);
    //     // Aqui poderia haver lógica adicional antes de chamar a submissão real,
    //     // mas o ideal é que ContentEditor lide com o salvamento.
    // };

    if (loadingType) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                {/* Idealmente, um componente Skeleton ou Spinner aqui */}
                <p>Carregando editor...</p>
            </div>
        );
    }

    if (errorType) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
                    <strong className="font-bold"><AlertTriangle className="inline mr-2" />Erro!</strong>
                    <span className="block sm:inline"> {errorType}</span>
                </div>
                <Link href="/dashboard" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Voltar ao Dashboard
                </Link>
            </div>
        );
    }

    if (!initialContentType || !id) {
         // Isso pode ser coberto por errorType, mas uma verificação extra.
        return (
            <div className="flex flex-col justify-center items-center min-h-screen p-4">
                 <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
                    <strong className="font-bold">Aviso!</strong>
                    <span className="block sm:inline"> Não foi possível determinar o tipo de conteúdo para edição.</span>
                </div>
                <Link href="/dashboard" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Voltar ao Dashboard
                </Link>
            </div>
        );
    }
    
    // Props para ContentEditor
    const contentEditorProps = {
        existingId: id,
        type: initialContentType,
        // Se ContentEditor não buscar seus próprios dados, precisaremos passar initialDataForEditor
        // title: initialDataForEditor?.title || "", (Exemplo)
        // content: initialDataForEditor?.content || "", (Exemplo)
        // category: initialDataForEditor?.category || "", (Exemplo para story)
        // chapterNumber: initialDataForEditor?.chapter_number, (Exemplo para chapter)
        // seriesId: initialDataForEditor?.series_id, (Exemplo para chapter, ContentEditor usa para buscar próximo cap.)
        
        headerTitle: `Editar ${initialContentType === "story" ? "História" : "Capítulo"}`,
        backPath: initialContentType === "chapter" && initialDataForEditor?.series_id 
                    ? `/series/${initialDataForEditor.series_id}` // Idealmente o slug da série
                    : "/dashboard",
        backLabel: initialContentType === "chapter" && initialDataForEditor?.series_id
                    ? "Voltar para a Série"
                    : "Voltar ao Dashboard",
        // onSubmit: handleSubmitWrapper, // Se ContentEditor tiver uma prop onSubmit que esperamos
        // onDelete: handleDeleteWrapper, // Se ContentEditor tiver uma prop para exclusão
    };


    return (
        <div className="mx-auto py-8"> 
            {/* 
                O componente ContentEditor agora gerencia a maior parte da UI e lógica do formulário.
                Mensagens de sucesso/erro globais ou específicas da página de edição (não do formulário em si)
                ainda poderiam ser gerenciadas aqui, se necessário.
            */}
            <ContentEditor {...contentEditorProps} />
        </div>
    );

    // O JSX antigo para os formulários de story e chapter foi removido,
    // pois ContentEditor agora lida com essa UI.
    // A lógica de estado para campos de formulário (title, content, category, etc.)
    // também foi removida daqui, pois ContentEditor tem seus próprios estados.
    // A lógica de handleDelete e DeleteModal também precisará ser integrada
    // ou chamada a partir do ContentEditor.
}
