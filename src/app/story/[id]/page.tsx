import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Comments from "@/components/Comments";
import StoryContent from "@/components/StoryContent";
import { extractIdFromSlug, formatDate, calculateReadingTime } from "@/lib/utils";
import { Eye } from "lucide-react";

interface StoryPageParams {
  params: { id: string };
}

export async function generateMetadata({ params }: StoryPageParams) {
  try {
    const slug = params.id;
    const id = extractIdFromSlug(slug) || slug;
    const supabase = await createServerSupabaseClient();
    const { data: story, error } = await supabase
      .from("stories")
      .select("title")
      .eq("id", id)
      .single();
    if (error || !story) {
      return { title: "História não encontrada" };
    }
    return {
      title: story.title,
      description: `Leia "${story.title}" na Plataforma para Escritores`,
    };
  } catch (error) {
    return { title: "História" };
  }
}

export default async function StoryPage({ params }: StoryPageParams) {
  const slug = params.id;
  const id = extractIdFromSlug(slug) || slug;
  const supabase = await createServerSupabaseClient();
  const { data: story, error } = await supabase
    .from("stories")
    .select(`id, title, content, category, created_at, view_count, is_published, author_id, profiles(username, avatar_url)`)
    .eq("id", id)
    .single();
  if (error || !story || !story.is_published) {
    notFound();
  }
  // Increment view count (best effort)
  try {
    await supabase
      .from("stories")
      .update({ view_count: (story.view_count || 0) + 1 })
      .eq("id", id);
    story.view_count = (story.view_count || 0) + 1;
  } catch {}
  // Render
  return (
    <div className="story-page">
      <h1 className="text-2xl font-bold mb-4">{story.title}</h1>
      <div className="mb-2 flex items-center gap-2 text-gray-500 text-sm">
        <span>{story.profiles?.username || "Autor desconhecido"}</span>
        <span>•</span>
        <span>{formatDate(story.created_at)}</span>
        <span>•</span>
        <Eye size={16} className="inline-block mr-1" />
        <span>{story.view_count} visualizações</span>
      </div>
      <StoryContent content={story.content} />
      <Comments storyId={story.id} />
    </div>
  );
}
