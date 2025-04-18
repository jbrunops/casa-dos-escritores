import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Edit, BookOpen, Share2, MessageSquare, BookText, Book } from "lucide-react";
import SeriesHighlights from "@/components/SeriesHighlights";
import { generateSlug, createSummary, formatDate } from "@/lib/utils";
import RecentContentList from "@/components/RecentContentList";
import MostCommentedList from "@/components/MostCommentedList";
import TopWritersList from "@/components/TopWritersList";

interface ContentItem {
  id: string;
  title: string;
  created_at: string;
  // Adicione outros campos conforme necessário
}

interface WriterItem {
  id: string;
  username: string;
  // Adicione outros campos conforme necessário
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const [
    { data: recentContent, error: recentError },
    { data: mostCommentedContent, error: commentedError },
    { data: topWriters, error: writersError }
  ] = await Promise.all([
    supabase.rpc('get_recent_content', { p_limit: 10, p_offset: 0 }),
    supabase.rpc('get_most_commented_content', { p_limit: 10, p_offset: 0 }),
    supabase.rpc('get_top_writers', { p_limit: 10, p_offset: 0 })
  ]);

  console.log("[ Server ] Dados recebidos - Recentes:", JSON.stringify(recentContent, null, 2));
  console.log("[ Server ] Dados recebidos - Comentados:", JSON.stringify(mostCommentedContent, null, 2));
  console.log("[ Server ] Dados recebidos - Escritores:", JSON.stringify(topWriters, null, 2));

  if (recentError) console.error("[ Server ] Erro ao buscar conteúdo recente:", JSON.stringify(recentError, null, 2));
  if (commentedError) console.error("[ Server ] Erro ao buscar conteúdo mais comentado:", JSON.stringify(commentedError, null, 2));
  if (writersError) console.error("[ Server ] Erro ao buscar top escritores:", JSON.stringify(writersError, null, 2));

  return (
    <>
      <section className="max-w-[75rem] mx-auto w-full px-4 md:px-0 three-columns-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="column">
            <h2 className="text-2xl font-extrabold text-black mb-4 border-[#E5E7EB] pb-2 relative">
              Recentes
              <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
            </h2>
            <RecentContentList contentList={recentContent as ContentItem[]} />
          </div>
          <div className="column">
            <h2 className="text-2xl font-extrabold text-black mb-4  border-[#E5E7EB] pb-2 relative">
              Mais Comentados
              <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
            </h2>
            <MostCommentedList contentList={mostCommentedContent as ContentItem[]} />
          </div>
          <div className="column">
            <h2 className="text-2xl font-extrabold text-black mb-4  border-[#E5E7EB] pb-2 relative">
              Top 10 Escritores
              <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
            </h2>
            <TopWritersList writers={topWriters as WriterItem[]} />
          </div>
        </div>
      </section>
    </>
  );
}
