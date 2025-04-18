import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server"; // USO CORRETO: este arquivo é server-side.
import { ArrowLeft, Users } from "lucide-react";
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
      title: `Quem ${data.username} segue`,
      description: `Lista de pessoas que ${data.username} segue`,
    };
  } catch (error) {
    return { title: "Seguindo" };
  }
}

interface Profile {
  id: string;
  username: string;
}

interface Follow {
  following_id: string;
}

export default async function FollowingPage({ params }: { params: { username: string } }) {
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

    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const currentUserId = session?.user?.id;

    const { data: following, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', profile.id);

    if (error) {
      console.error("Erro ao buscar pessoas seguidas:", error.message, error.details, error.hint);
      return (
        <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <p>Erro ao carregar pessoas seguidas.</p>
            <p className="text-sm text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
          </div>
        </div>
      );
    }

    // Renderização simplificada
    return (
      <div>
        <h1>Pessoas seguidas</h1>
        {/* Renderize a lista de pessoas seguidas aqui */}
      </div>
    );
  } catch (error) {
    return notFound();
  }
}
