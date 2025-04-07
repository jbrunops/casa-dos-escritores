"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

// Criando o contexto
const AuthContext = createContext();

// Hook personalizado para usar o contexto
export function useAuth() {
  return useContext(AuthContext);
}

// Provedor do contexto
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  // Carregar usuário e perfil
  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        // Verificar sessão
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Buscar perfil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserAndProfile();
    
    // Configurar o listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session.user);
          
          // Buscar perfil atualizado
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Função para fazer logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Valores a serem fornecidos pelo contexto
  const value = {
    user,
    profile,
    signOut,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 