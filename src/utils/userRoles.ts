"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

// Definindo um tipo para os papéis
export type Role = "admin" | "moderator" | "user";

// Usando o tipo para garantir consistência
export const ROLES: Record<string, Role> = {
    ADMIN: "admin",
    MODERATOR: "moderator",
    USER: "user",
};

// Tipando o retorno da função
export async function getUserRole(): Promise<Role | null> {
    const supabase = createBrowserClient(); // Supabase client deve ter seus próprios tipos

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;

        // Definir a interface esperada do select
        interface ProfileRole {
          role: Role | null; // A role pode ser null no banco
        }

        // Buscar role do usuário
        const { data, error } = await supabase
            .from("profiles")
            .select("role") // Seleciona apenas a coluna 'role'
            .eq("id", user.id)
            .returns<ProfileRole>() // Especifica o tipo esperado da linha
            .single(); // Espera um único resultado

        if (error) throw error;
        // Retorna a role encontrada ou 'user' como padrão se for null/undefined
        return data?.role ?? ROLES.USER;
    } catch (err) {
        console.error("Erro ao obter role do usuário:", err);
        // Fallback para nível mais baixo de permissão em caso de erro
        return ROLES.USER;
    }
}

// Tipando o parâmetro e o retorno
export async function hasRole(requiredRole: Role): Promise<boolean> {
    const userRole = await getUserRole();
    if (!userRole) return false; // Se não há role, não tem permissão

    // Hierarquia implícita: admins podem fazer tudo que moderadores podem, etc.
    if (requiredRole === ROLES.USER) return true; // Qualquer usuário logado tem a role 'user' ou superior
    if (requiredRole === ROLES.MODERATOR)
        return userRole === ROLES.ADMIN || userRole === ROLES.MODERATOR;
    if (requiredRole === ROLES.ADMIN) return userRole === ROLES.ADMIN;

    return false;
}

// Interface para o retorno do hook
interface RoleCheckResult {
    role: Role | null;
    loading: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    isAuthenticated: boolean;
}

// Hook para uso em componentes, agora tipado
export function useRoleCheck(): RoleCheckResult {
    // Tipando o estado
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkRole = async () => {
            // Não precisamos tipar aqui, pois getUserRole já é tipada
            const userRole = await getUserRole();
            setRole(userRole);
            setLoading(false);
        };

        checkRole();
    }, []); // Dependências vazias, roda apenas na montagem

    // Calcula os booleanos derivados baseado no estado 'role'
    const isAdmin = role === ROLES.ADMIN;
    const isModerator = role === ROLES.ADMIN || role === ROLES.MODERATOR;
    const isAuthenticated = !!role;

    return {
        role,
        loading,
        isAdmin,
        isModerator,
        isAuthenticated,
    };
}
