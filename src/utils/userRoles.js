"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

export const ROLES = {
    ADMIN: "admin",
    MODERATOR: "moderator",
    USER: "user",
};

export async function getUserRole() {
    const supabase = createBrowserClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;

        // Buscar role do usuário
        const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (error) throw error;
        return data?.role || ROLES.USER;
    } catch (err) {
        console.error("Erro ao obter role do usuário:", err);
        return ROLES.USER; // Fallback para nível mais baixo de permissão
    }
}

export async function hasRole(requiredRole) {
    const userRole = await getUserRole();

    // Hierarquia implícita: admins podem fazer tudo que moderadores podem, etc.
    if (requiredRole === ROLES.USER) return !!userRole;
    if (requiredRole === ROLES.MODERATOR)
        return userRole === ROLES.ADMIN || userRole === ROLES.MODERATOR;
    if (requiredRole === ROLES.ADMIN) return userRole === ROLES.ADMIN;

    return false;
}

// Hook para uso em componentes
export function useRoleCheck() {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
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
        isAuthenticated: !!role,
    };
}
