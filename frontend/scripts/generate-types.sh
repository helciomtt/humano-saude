#!/bin/bash
set -e

# =====================================================
# Gera tipos TypeScript a partir do schema do Supabase
# Requer: SUPABASE_PROJECT_ID no .env.local
# Uso: npm run types:generate
# =====================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="$PROJECT_DIR/lib/types/database.generated.ts"

# Carregar .env.local se existir
if [ -f "$PROJECT_DIR/.env.local" ]; then
  export $(grep -E '^SUPABASE_PROJECT_ID=' "$PROJECT_DIR/.env.local" | xargs)
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "⚠️  SUPABASE_PROJECT_ID não configurado."
  echo "   Adicione ao .env.local: SUPABASE_PROJECT_ID=seu-project-id"
  echo "   (Encontre em: Supabase Dashboard → Settings → General)"
  echo ""
  echo "   Pulando geração de tipos. Usando types manuais em lib/types/database.ts"
  exit 0
fi

echo "🔄 Gerando tipos do Supabase (projeto: $SUPABASE_PROJECT_ID)..."

npx supabase gen types typescript \
  --project-id "$SUPABASE_PROJECT_ID" \
  --schema public \
  > "$OUTPUT_FILE"

# Adicionar header de aviso
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << 'EOF'
// =====================================================
// ⚠️  ARQUIVO GERADO AUTOMATICAMENTE — NÃO EDITAR
// Gerado por: npm run types:generate
// Schema: Supabase public
// =====================================================

EOF
cat "$OUTPUT_FILE" >> "$TEMP_FILE"
mv "$TEMP_FILE" "$OUTPUT_FILE"

echo "✅ Tipos gerados em: lib/types/database.generated.ts"
echo "⚠️  Não edite este arquivo manualmente!"
