import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SupabaseClient } from '@supabase/supabase-js';

export function createServerSupabaseClient(): SupabaseClient {
  // Tipar cookieStore como any como contorno para o erro do linter
  const cookieStore: any = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase URL ou Service Role Key não definidos nas variáveis de ambiente.");
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignorar erros se chamado de Server Component sem middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Para remover, definimos o valor como vazio e expiramos imediatamente
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
             // Ignorar erros se chamado de Server Component sem middleware
          }
        },
      },
    }
  )
} 