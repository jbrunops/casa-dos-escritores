-- Tabela para acompanhar relações de seguidor-seguido
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);

-- Criar políticas RLS (Row Level Security)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários vejam quem eles seguem e quem os segue
CREATE POLICY "Usuários podem ver suas relações de seguidores" ON public.follows
    FOR SELECT USING (
        auth.uid() = follower_id OR auth.uid() = following_id
    );

-- Permitir que usuários sigam outros usuários
CREATE POLICY "Usuários podem seguir outros usuários" ON public.follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id AND follower_id != following_id
    );

-- Permitir que usuários deixem de seguir
CREATE POLICY "Usuários podem deixar de seguir" ON public.follows
    FOR DELETE USING (
        auth.uid() = follower_id
    ); 