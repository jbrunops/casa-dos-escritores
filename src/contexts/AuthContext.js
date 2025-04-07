"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient, resetSupabaseClient } from '@/lib/supabase-browser';

// Contexto para autenticação
const AuthContext = createContext();

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Estado inicial para usuário não autenticado
const initialState = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [connectionState, setConnectionState] = useState('checking');
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  
  // Inicializar cliente Supabase
  const initClient = () => {
    try {
      return createBrowserClient();
    } catch (err) {
      console.error('❌ Erro ao inicializar cliente Supabase:', err);
      return null;
    }
  };

  // Gerenciar assinatura a eventos de autenticação
  useEffect(() => {
    console.log('Iniciando carregamento de sessão...');
    
    let dataSubscription = null;
    
    // Timeout de segurança para evitar bloqueio
    const timeoutId = setTimeout(() => {
      if (state.isLoading) {
        console.warn('⚠️ Timeout de carregamento de sessão atingido');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          connectionReady: false
        }));
        setConnectionState('error');
      }
    }, 5000);
    
    async function loadUserSession() {
      try {
        const supabase = initClient();
        
        if (!supabase) {
          console.error('❌ Cliente Supabase indisponível');
          setState(prev => ({ ...prev, isLoading: false }));
          setConnectionState('error');
          return;
        }
        
        // Verificar sessão atual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao carregar sessão:', error.message);
          setState(prev => ({ ...prev, isLoading: false }));
          setConnectionState('error');
          return;
        }
        
        // Se temos uma sessão existente
        if (data?.session) {
          setConnectionState('connected');
          
          // Obter perfil do usuário
          const userResponse = await supabase.auth.getUser();
          const user = userResponse?.data?.user;
          
          // Carregar dados de perfil se autenticado
          if (user?.id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
              setState({
                user,
                profile,
                isAuthenticated: true,
                isLoading: false,
              });
            } catch (profileError) {
              console.warn('⚠️ Erro ao carregar perfil:', profileError);
              setState({
                user,
                profile: null,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } else {
            setState({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          // Sem sessão existente
          setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          });
          setConnectionState('connected');
        }
        
        // Inscrever-se em eventos de alteração de autenticação
        const subscription = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Evento de autenticação:', event);
            
            // Quando um usuário faz login com sucesso
            if (event === 'SIGNED_IN' && session?.user) {
              try {
                // Obter dados do perfil
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                  
                setState({
                  user: session.user,
                  profile,
                  isAuthenticated: true,
                  isLoading: false,
                });
                setConnectionState('connected');
              } catch (err) {
                console.error('❌ Erro ao carregar perfil após login:', err);
                setState({
                  user: session.user,
                  profile: null,
                  isAuthenticated: true,
                  isLoading: false,
                });
              }
            } 
            // Quando um usuário faz logout
            else if (event === 'SIGNED_OUT') {
              setState({
                user: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        );
        
        dataSubscription = subscription;
      } catch (err) {
        console.error('❌ Erro crítico na inicialização da sessão:', err);
        setState({ ...initialState, isLoading: false });
        setConnectionState('error');
      }
    }
    
    loadUserSession();
    
    return () => {
      // Limpar timeout e cancelar assinatura ao desmontar
      clearTimeout(timeoutId);
      if (dataSubscription && dataSubscription.data && dataSubscription.data.subscription) {
        dataSubscription.data.subscription.unsubscribe();
      } else if (dataSubscription && typeof dataSubscription.unsubscribe === 'function') {
        dataSubscription.unsubscribe();
      }
    };
  }, [recoveryAttempt]);

  // Função para fazer login
  const signIn = async (email, password) => {
    const supabase = initClient();
    if (!supabase) return { error: { message: 'Falha na conexão com o servidor' } };
    
    try {
      return await supabase.auth.signInWithPassword({ email, password });
    } catch (err) {
      console.error('❌ Erro ao fazer login:', err);
      return { error: { message: 'Falha ao processar o login, verifique sua conexão' } };
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    const supabase = initClient();
    if (!supabase) return false;
    
    try {
      const { error } = await supabase.auth.signOut();
      return !error;
    } catch (err) {
      console.error('❌ Erro ao fazer logout:', err);
      return false;
    }
  };
  
  // Função para recuperar conexão em caso de problemas
  const recoverConnection = () => {
    setConnectionState('checking');
    setState(prev => ({ ...prev, isLoading: true }));
    resetSupabaseClient();
    setRecoveryAttempt(prev => prev + 1);
  };

  // Valor fornecido pelo contexto
  const contextValue = {
    ...state,
    signIn,
    signOut,
    connectionState,
    recoverConnection,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
} 