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