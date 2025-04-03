-- Adicionar colunas necessárias à tabela comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES series(id) ON DELETE CASCADE;

-- Adicionar índices para melhorar a performance nas consultas
CREATE INDEX IF NOT EXISTS comments_chapter_id_idx ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS comments_series_id_idx ON comments(series_id);

-- Remover a restrição NOT NULL da coluna story_id
ALTER TABLE comments ALTER COLUMN story_id DROP NOT NULL;

-- Adicionar uma restrição CHECK para garantir que pelo menos um tipo de conteúdo seja especificado
DO $$
BEGIN
  -- Verificar se a restrição já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'comments_content_reference_check'
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT comments_content_reference_check 
    CHECK (
      (story_id IS NOT NULL) OR 
      (series_id IS NOT NULL) OR 
      (chapter_id IS NOT NULL)
    );
  END IF;
END $$; 