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
    let isMounted = true; // Evitar atualização em componentes desmontados

    async function loadUserAndProfile() {
      try {
        // Verificar sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erro ao verificar sessão:", sessionError);
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        
        if (session?.user) {
          if (isMounted) setUser(session.user);
          
          // Buscar perfil
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error("Erro ao buscar perfil:", profileError);
          }
            
          if (profileData && isMounted) {
            setProfile(profileData);
          }
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    // Adicionar um pequeno timeout para garantir que o Supabase esteja pronto
    const initTimeout = setTimeout(() => {
      loadUserAndProfile();
    }, 100);
    
    // Configurar o listener de autenticação
    let subscription;
    
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event);
          
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (isMounted) setUser(session?.user || null);
            
            if (session?.user) {
              // Buscar perfil atualizado
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (profileData && isMounted) {
                setProfile(profileData);
              }
            }
          } else if (event === 'SIGNED_OUT' && isMounted) {
            setUser(null);
            setProfile(null);
          }
        }
      );
      
      subscription = data.subscription;
    } catch (error) {
      console.error("Erro ao configurar listener de autenticação:", error);
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
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