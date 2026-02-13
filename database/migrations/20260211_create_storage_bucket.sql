-- =============================================
-- 📦 STORAGE BUCKET: media
-- =============================================
-- Cria o bucket 'media' no Supabase Storage 
-- para upload de banners gerados por IA e
-- outros arquivos do corretor.
--
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================

-- 1. Criar o bucket 'media' (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,  -- público (URLs acessíveis sem auth)
  10485760,  -- 10MB max por arquivo
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'application/pdf'
  ];

-- 2. Policy: Qualquer um pode LER (bucket público)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

-- 3. Policy: Service role pode fazer UPLOAD (INSERT)
--    (Nossa API usa service_role key → bypassa RLS automaticamente,
--     mas vamos criar a policy para garantia)
DROP POLICY IF EXISTS "media_service_upload" ON storage.objects;
CREATE POLICY "media_service_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'media');

-- 4. Policy: Service role pode fazer UPDATE (upsert)
DROP POLICY IF EXISTS "media_service_update" ON storage.objects;
CREATE POLICY "media_service_update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'media');

-- 5. Policy: Service role pode DELETAR
DROP POLICY IF EXISTS "media_service_delete" ON storage.objects;
CREATE POLICY "media_service_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'media');

-- =============================================
-- VERIFICAÇÃO
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media') THEN
    RAISE NOTICE '✅ Bucket "media" criado/atualizado com sucesso!';
    RAISE NOTICE '  → Público: sim (URLs acessíveis sem auth)';
    RAISE NOTICE '  → Limite: 10MB por arquivo';
    RAISE NOTICE '  → Tipos: PNG, JPEG, WebP, GIF, PDF';
    RAISE NOTICE '  → Policies: public read, service upload/update/delete';
  ELSE
    RAISE NOTICE '❌ Falha ao criar bucket "media"';
  END IF;
END $$;
