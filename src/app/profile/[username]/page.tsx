import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server"; // USO CORRETO: este arquivo é server-side.
import { generateSlug } from "@/lib/utils";
import {
  Globe,
  Twitter,
  Facebook,
  Instagram,
  Edit,
  Eye,
  BookOpen,
  BookText,
  Clock,
  Award,
  Calendar,
  UserPlus,
  Users,
} from "lucide-react";
import UserFollowButton from "@/components/UserFollowButton";

export async function generateMetadata({ params }: { params: { username: string } }) {
  const username = await Promise.resolve(params.username);
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", decodeURIComponent(username))
      .single();

    if (!data) return { title: "Perfil não encontrado" };
    return {
      title: `Perfil de ${data.username}`,
      description: `Conheça as histórias escritas por ${data.username} na Plataforma para Escritores`,
    };
  } catch (error) {
    return { title: "Perfil" };
  }
}

interface Profile {
  id: string;
  username: string;
  // outros campos
}

interface Story {
  id: string;
  title: string;
  created_at: string;
  category: string;
  view_count: number;
  // outros campos
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const username = await Promise.resolve(params.username);
  const decodedUsername = decodeURIComponent(username);

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", decodedUsername)
      .single();

    if (!profile) return notFound();

    const { data: stories } = await supabase
      .from("stories")
      .select("id, title, created_at, category, view_count")
      .eq("username", decodedUsername);

    // Renderização simplificada (adicione JSX conforme necessário)
    return (
      <div>
        <h1>Perfil de {profile.username}</h1>
        {/* Renderize outras informações do perfil e histórias */}
      </div>
    );
  } catch (error) {
    return notFound();
  }
}
