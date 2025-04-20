"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser"; // Importar do .ts
import { SupabaseClient, User } from "@supabase/supabase-js"; // Importar tipos

// Definir um tipo para as Roles
export type UserRole = "admin" | "moderator" | "user";

export const ROLES: { [key: string]: UserRole } = {
    ADMIN: "admin",
    MODERATOR: "moderator",
    USER: "user",
};

// Tipo para o retorno da tabela profiles
interface Profile {
    role: UserRole | null;
}

export async function getUserRole(): Promise<UserRole | null> {
    const supabase: SupabaseClient = createBrowserClient();

    try {
        const {
            data: { user },
        }: { data: { user: User | null } } = await supabase.auth.getUser();
        if (!user) return null;

        // Buscar role do usuário
        const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single<Profile>(); // Tipar o retorno

        // Tratar erro "No rows found" como role de usuário padrão
        if (error && error.code !== 'PGRST116') throw error;
        
        return data?.role || ROLES.USER; // Retorna a role ou USER como padrão
    } catch (err) {
        console.error("Erro ao obter role do usuário:", err);
        // Em caso de erro na busca, pode ser melhor retornar null para indicar falha
        // ou manter USER como fallback seguro, dependendo da lógica da aplicação.
        // Vamos retornar null para indicar que a role não pôde ser determinada.
        return null; 
    }
}

export async function hasRole(requiredRole: UserRole): Promise<boolean> {
    const userRole = await getUserRole();
    if (!userRole) return false; // Se não conseguiu obter a role, negar acesso

    // Hierarquia implícita: admins podem fazer tudo que moderadores podem, etc.
    if (requiredRole === ROLES.USER) return true; // Qualquer role logada é pelo menos USER
    if (requiredRole === ROLES.MODERATOR) return userRole === ROLES.ADMIN || userRole === ROLES.MODERATOR;
    if (requiredRole === ROLES.ADMIN) return userRole === ROLES.ADMIN;

    return false;
}

// Tipo para o retorno do hook
interface RoleCheckResult {
    role: UserRole | null;
    loading: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    isAuthenticated: boolean;
}

// Hook para uso em componentes
export function useRoleCheck(): RoleCheckResult {
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkRole = async () => {
            setLoading(true); // Iniciar loading
            const userRole = await getUserRole();
            setRole(userRole);
            setLoading(false);
        };

        checkRole();
    }, []);

    return {
        role,
        loading,
        isAdmin: role === ROLES.ADMIN,
        isModerator: role === ROLES.ADMIN || role === ROLES.MODERATOR,
        isAuthenticated: !!role, // Considera autenticado se conseguiu obter uma role
    };
} 