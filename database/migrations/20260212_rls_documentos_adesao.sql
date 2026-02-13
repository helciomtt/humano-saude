-- ══════════════════════════════════════════════════════════════
-- Migration: RLS para bucket documentos_adesao
-- Data: 2026-02-12
-- Objetivo: Segurança máxima nos documentos de adesão
-- ══════════════════════════════════════════════════════════════

-- 1. Criar bucket privado (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos_adesao',
  'documentos_adesao',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "documentos_insert_anon" ON storage.objects;
DROP POLICY IF EXISTS "documentos_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "documentos_select_admin" ON storage.objects;
DROP POLICY IF EXISTS "documentos_delete_admin" ON storage.objects;
DROP POLICY IF EXISTS "documentos_update_admin" ON storage.objects;

-- 3. INSERT: Anônimos podem enviar arquivos (upload do formulário)
CREATE POLICY "documentos_insert_anon"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'documentos_adesao'
);

-- 4. INSERT: Usuários autenticados também podem enviar
CREATE POLICY "documentos_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos_adesao'
);

-- 5. SELECT/READ: APENAS admin e corretor autenticados podem visualizar
CREATE POLICY "documentos_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos_adesao'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.corretores c
      WHERE c.user_id = auth.uid()
      AND c.ativo = true
    )
  )
);

-- 6. DELETE: Apenas admin pode deletar documentos
CREATE POLICY "documentos_delete_admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos_adesao'
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
  )
);

-- 7. UPDATE: Apenas admin pode atualizar metadados
CREATE POLICY "documentos_update_admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos_adesao'
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
  )
);

-- 8. Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- RESUMO:
-- ✅ Bucket PRIVADO (URLs não acessíveis publicamente)
-- ✅ Anônimos SÓ podem UPLOAD (INSERT)
-- ✅ Ninguém anônimo pode BAIXAR (SELECT)
-- ✅ Apenas admin/corretor autenticados podem VISUALIZAR
-- ✅ Apenas admin pode DELETAR
-- ✅ Next.js usa SUPABASE_SERVICE_ROLE_KEY (bypass RLS)
-- ══════════════════════════════════════════════════════════════
