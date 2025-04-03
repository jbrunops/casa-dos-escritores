-- Adicionar coluna chapter_id à tabela comments, se ela não existir
ALTER TABLE comments ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;

-- Adicionar índice para melhorar a performance nas consultas por chapter_id
CREATE INDEX IF NOT EXISTS comments_chapter_id_idx ON comments(chapter_id);

-- Primeiro verificar e excluir as políticas existentes para evitar erros
DO $$
BEGIN
    -- Remover políticas existentes com nomes similares (apenas se existirem)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Todos podem ler comentários de capítulos') THEN
        DROP POLICY "Todos podem ler comentários de capítulos" ON comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Autores podem criar comentários em capítulos') THEN
        DROP POLICY "Autores podem criar comentários em capítulos" ON comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Autores podem editar seus próprios comentários em capítulos') THEN
        DROP POLICY "Autores podem editar seus próprios comentários em capítulos" ON comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Autores podem excluir seus próprios comentários em capítulos') THEN
        DROP POLICY "Autores podem excluir seus próprios comentários em capítulos" ON comments;
    END IF;
END
$$;

-- Atualizar políticas RLS para permitir acesso aos comentários por capítulo
CREATE POLICY "Todos podem ler comentários de capítulos" 
ON comments FOR SELECT 
USING (chapter_id IS NOT NULL);

CREATE POLICY "Autores podem criar comentários em capítulos" 
ON comments FOR INSERT 
TO authenticated
USING (chapter_id IS NOT NULL);

CREATE POLICY "Autores podem editar seus próprios comentários em capítulos" 
ON comments FOR UPDATE 
TO authenticated
USING (chapter_id IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "Autores podem excluir seus próprios comentários em capítulos" 
ON comments FOR DELETE 
TO authenticated
USING (chapter_id IS NOT NULL AND author_id = auth.uid()); 