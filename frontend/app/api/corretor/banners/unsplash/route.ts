import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/corretor/banners/unsplash?q=hospital
 * Busca imagens no Unsplash via API real (se UNSPLASH_ACCESS_KEY disponível)
 * ou retorna banco de fotos curado por keyword.
 */

/* ── Banco de IDs reais do Unsplash que sempre carregam ── */
const CURATED: Record<string, string[]> = {
  hospital: [
    '1519494026892-80bbd2d6fd0d', '1586773860418-d37222d8fce3', '1551190822-a9333d879b1f',
    '1538108149393-fbbd81895907', '1516549655169-df83a0774514', '1587351021759-3e566ab3e36d',
    '1504439468489-c8920d796a29', '1530497610245-94d3c16cda28', '1579684385127-1ef15d508118',
  ],
  familia: [
    '1609220136736-443140cffec6', '1511895426328-dc8714191300', '1475503572774-15a45e5d60b9',
    '1606107557195-0e29a4b5b4aa', '1581579438747-104c53d7fbc4', '1536640712-4d4c36ff0e4e',
    '1491013516836-7db643ee125a', '1529156069898-49953e39b3ac', '1478479405421-ce83c92fb3ba',
  ],
  medico: [
    '1612349317150-e413f6a5b16d', '1631217868264-e5b90bb7e133', '1582750433449-648ed127bb54',
    '1584982751601-97dcc096659c', '1559757148-5c350d0d3c56', '1581594693702-fbdc51b2763b',
    '1576091160399-112ba8d25d1d', '1666214280557-f1b5022eb634', '1579684453423-f84349ef60b0',
  ],
  saude: [
    '1505751172876-fa1923c5c528', '1571019613454-1cb2f99b2d8b', '1506126613408-eca07ce68773',
    '1571019614242-c5c5dee9f50c', '1544367567-0f2fcb009e0b', '1545389336-cf090694435e',
    '1498837167922-ddd27525d352', '1476480862126-209bfaa8edc8', '1552196563-55cd4e45efb3',
  ],
  cidade: [
    '1483729558449-99ef09a8c325', '1544989164-31dc3291c7e1', '1516306580123-e6e52b1b7b5f',
    '1518639192441-8fce0a366e2e', '1564659907532-6b163e294e7c', '1551524559-8af4e6624178',
    '1477959858617-67f85cf4f1df', '1549216963-72e57614d8c5', '1514888286974-6c03e2ca1dba',
  ],
  natureza: [
    '1506744038136-46273834b3fb', '1469474968028-56623f02e42e', '1518173946687-a7c1a15e17ed',
    '1470071459604-3b5ec3a7fe05', '1441974231531-c6227db76b6e', '1426604966848-d7adac402bff',
    '1501854140801-50d01698950b', '1540206395-68808572332f', '1465189684280-6a8fa9b19a7a',
  ],
  escritorio: [
    '1497366216548-37526070297c', '1497366811353-6870744d04b2', '1504384308210-251c4afc677a',
    '1568992687947-868a62a9f521', '1497215728101-856f4ea42174', '1531973576160-7125cd663d86',
    '1556761175-4b46a572b786', '1524758631624-e2822e304c36', '1604328698692-f76ea9498e76',
  ],
  idoso: [
    '1447005497901-b3e9ee359928', '1559234938-addf9a1e6b88', '1581579186913-45ac3e6efe93',
    '1517331158511-e5cfe84a6c53', '1454875392665-2ac2c85e8d3e', '1543269664-7f3ca6af17d3',
    '1573497491208-6b1acb260507', '1516728778615-2d590ea1855e', '1551836022-4c4c79ecde51',
  ],
  bebe: [
    '1519689680058-a1b29df1acc0', '1515488042361-ee00e0ddd4e4', '1555252333-9f8e92e65df9',
    '1492725764893-90b379c2b6e7', '1519340241574-2cec6aef0c01', '1503454537195-1dcabb73ffb9',
    '1544367567-0f2fcb009e0b', '1491013516836-7db643ee125a', '1587920985946-9ef3fae1f1cc',
  ],
  emocao: [
    '1507003211169-0a1dd7228f2d', '1494790108377-be9c29b29330', '1531746020798-e6953c6e8e04',
    '1517677129300-07b130802f46', '1489710437720-ebb67ec84dd2', '1590650046871-92c51d9b6a0e',
    '1531983412531-1f49a365ffed', '1534528741775-53994a69daeb', '1499209974431-9dddcece7f88',
  ],
  dinheiro: [
    '1554224155-6726b3ff858f', '1553729459-afe8f2e45ad5', '1579621970563-9ae2e01c7e35',
    '1526304640581-d334cdbbf45e', '1518458028785-8fbcd101ebb9', '1567427018141-0584cfcbf1b8',
    '1559526324-593bc073d938', '1521897258701-21e2a01f5e8b', '1454165804606-c3d57bc86b40',
  ],
  esporte: [
    '1571019614242-c5c5dee9f50c', '1552674605-db6ffd4facb5', '1486218119243-13883505764c',
    '1517836357463-d25dfeac3438', '1549060279-7aa3d8160389', '1571902943202-507ec2618e8f',
    '1461896836934-bd45cd60e66d', '1490474418585-ba9bad8fd0ea', '1571019613454-1cb2f99b2d8b',
  ],
  tecnologia: [
    '1518770660439-4636190af475', '1550745165-9bc0b252726f', '1488590528505-98d2b5aba04b',
    '1531297484001-80022131f5a1', '1519389950473-47ba0277781c', '1581091226825-a6a2a5aee158',
    '1496065187959-7f07b8353c55', '1526374965328-7f61d4dc18c5', '1519241047957-be31d7379a5d',
  ],
  abstrato: [
    '1557682250583-56a76f434652', '1553356084-58ef4a67b2a7', '1579546929518-9e396f3cc74e',
    '1557672172-298e090bd0f1', '1558591710-4b4a1ae0f04d', '1508739773434-c26b3d09e071',
    '1618005198919-d3d4b5a92ead', '1550684376-efcbd6e3f031', '1557683316-973673baf926',
  ],
};

/* Normaliza query removendo acentos */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function buildUrl(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?w=1080&q=80&auto=format`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ error: 'Parâmetro q obrigatório' }, { status: 400 });
  }

  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  const normalized = normalize(q);

  /* ── Tenta API real se tiver chave ── */
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=9&orientation=portrait`,
        { headers: { Authorization: `Client-ID ${apiKey}` }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.results?.map((p: { id: string; urls: { regular: string }; alt_description?: string }) => ({
          nome: p.alt_description || q,
          url: p.urls.regular,
        })) || [];
        if (results.length > 0) return NextResponse.json({ results });
      }
    } catch { /* fallback to curated */ }
  }

  /* ── Tenta Unsplash Source (sem API key) — busca real por qualquer termo ── */
  try {
    const res = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=12&orientation=portrait`,
      { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const results = data.results?.slice(0, 9).map((p: { id: string; urls: { regular: string; small: string }; alt_description?: string; description?: string }) => ({
        nome: p.alt_description || p.description || q,
        url: p.urls.regular || p.urls.small,
      })) || [];
      if (results.length > 0) return NextResponse.json({ results });
    }
  } catch { /* fallback to curated */ }

  /* ── Fallback: banco curado por keyword matching ── */
  let photoIds: string[] = [];

  // Busca exata primeiro
  for (const [key, ids] of Object.entries(CURATED)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      photoIds = ids;
      break;
    }
  }

  // Busca fuzzy — mapeamento amplo de termos em PT-BR
  if (photoIds.length === 0) {
    const aliases: Record<string, string> = {
      /* Saúde geral */
      'plano': 'saude', 'saude': 'saude', 'bem-estar': 'saude', 'wellness': 'saude',
      'saudavel': 'saude', 'vida': 'saude', 'qualidade': 'saude', 'cuidado': 'saude',
      'protecao': 'saude', 'seguro': 'saude', 'convenio': 'saude',
      /* Médicos */
      'doutor': 'medico', 'doctor': 'medico', 'enfermeiro': 'medico', 'enfermeira': 'medico',
      'medico': 'medico', 'medica': 'medico', 'consulta': 'medico', 'estetoscopio': 'medico',
      'profissional': 'medico', 'atendimento': 'medico', 'especialista': 'medico',
      /* Hospital */
      'clinica': 'hospital', 'consultorio': 'hospital', 'emergencia': 'hospital',
      'hospital': 'hospital', 'uti': 'hospital', 'internacao': 'hospital',
      'pronto socorro': 'hospital', 'urgencia': 'hospital', 'leito': 'hospital',
      'recepcao': 'hospital', 'ambulancia': 'hospital',
      /* Família */
      'familia': 'familia', 'mae': 'familia', 'pai': 'familia', 'filho': 'familia',
      'filha': 'familia', 'pais': 'familia', 'casal': 'familia', 'juntos': 'familia',
      'abraco': 'familia', 'feliz': 'familia', 'lar': 'familia', 'casa': 'familia',
      'amor': 'familia', 'uniao': 'familia',
      /* Cidade / Rio */
      'rio': 'cidade', 'rio de janeiro': 'cidade', 'praia': 'cidade', 'copacabana': 'cidade',
      'ipanema': 'cidade', 'leblon': 'cidade', 'corcovado': 'cidade', 'cristo': 'cidade',
      'pao de acucar': 'cidade', 'cidade': 'cidade', 'urbano': 'cidade', 'skyline': 'cidade',
      'predios': 'cidade', 'barra': 'cidade', 'niteroi': 'cidade', 'zona sul': 'cidade',
      /* Escritório / Trabalho */
      'trabalho': 'escritorio', 'empresa': 'escritorio', 'pme': 'escritorio',
      'corporativo': 'escritorio', 'escritorio': 'escritorio', 'coworking': 'escritorio',
      'reuniao': 'escritorio', 'equipe': 'escritorio', 'time': 'escritorio',
      'negocios': 'escritorio', 'mesa': 'escritorio',
      /* Idoso / Senior */
      'senior': 'idoso', 'terceira idade': 'idoso', 'aposentado': 'idoso', 'velho': 'idoso',
      'idoso': 'idoso', 'idosa': 'idoso', 'avo': 'idoso', 'avos': 'idoso',
      'envelhecimento': 'idoso', 'maturidade': 'idoso', 'melhor idade': 'idoso',
      /* Bebê / Criança */
      'bebe': 'bebe', 'recem-nascido': 'bebe', 'recem nascido': 'bebe',
      'crianca': 'bebe', 'pediatra': 'bebe', 'gestante': 'bebe', 'gravida': 'bebe',
      'gravidez': 'bebe', 'maternidade': 'bebe', 'infantil': 'bebe',
      'parto': 'bebe', 'neonatal': 'bebe', 'berco': 'bebe',
      /* Natureza */
      'verde': 'natureza', 'ar livre': 'natureza', 'parque': 'natureza', 'floresta': 'natureza',
      'natureza': 'natureza', 'jardim': 'natureza', 'arvore': 'natureza', 'campo': 'natureza',
      'paisagem': 'natureza', 'montanha': 'natureza', 'sol': 'natureza', 'nascer do sol': 'natureza',
      /* Emoção / Sentimentos */
      'irritado': 'emocao', 'raiva': 'emocao', 'frustrado': 'emocao', 'frustrada': 'emocao',
      'triste': 'emocao', 'alegre': 'emocao', 'alegria': 'emocao', 'emocao': 'emocao',
      'sentimento': 'emocao', 'expressao': 'emocao', 'choro': 'emocao', 'chorando': 'emocao',
      'sorriso': 'emocao', 'sorrindo': 'emocao', 'rindo': 'emocao', 'risada': 'emocao',
      'estresse': 'emocao', 'estressado': 'emocao', 'ansiedade': 'emocao', 'ansioso': 'emocao',
      'preocupado': 'emocao', 'preocupacao': 'emocao', 'medo': 'emocao', 'surpresa': 'emocao',
      'dor': 'emocao', 'sofrimento': 'emocao', 'paz': 'emocao', 'calma': 'emocao',
      'tranquilidade': 'emocao', 'confianca': 'emocao', 'esperanca': 'emocao',
      'desespero': 'emocao', 'angry': 'emocao', 'sad': 'emocao', 'happy': 'emocao',
      /* Dinheiro / Economia */
      'dinheiro': 'dinheiro', 'economia': 'dinheiro', 'economizar': 'dinheiro',
      'preco': 'dinheiro', 'barato': 'dinheiro', 'desconto': 'dinheiro',
      'custo': 'dinheiro', 'investimento': 'dinheiro', 'financeiro': 'dinheiro',
      'grana': 'dinheiro', 'bolso': 'dinheiro', 'carteira': 'dinheiro',
      'moeda': 'dinheiro', 'cifrao': 'dinheiro', 'pagamento': 'dinheiro',
      'orcamento': 'dinheiro', 'poupanca': 'dinheiro', 'cofre': 'dinheiro',
      'caro': 'dinheiro', 'valor': 'dinheiro', 'promocao': 'dinheiro',
      /* Esporte / Fitness */
      'esporte': 'esporte', 'academia': 'esporte', 'exercicio': 'esporte',
      'fitness': 'esporte', 'corrida': 'esporte', 'correr': 'esporte',
      'musculacao': 'esporte', 'yoga': 'esporte', 'treino': 'esporte',
      'atleta': 'esporte', 'futebol': 'esporte', 'natacao': 'esporte',
      'caminhada': 'esporte', 'ativo': 'esporte', 'esportivo': 'esporte',
      'gym': 'esporte', 'pilates': 'esporte', 'alongamento': 'esporte',
      /* Tecnologia */
      'tecnologia': 'tecnologia', 'digital': 'tecnologia', 'computador': 'tecnologia',
      'celular': 'tecnologia', 'smartphone': 'tecnologia', 'app': 'tecnologia',
      'aplicativo': 'tecnologia', 'internet': 'tecnologia', 'online': 'tecnologia',
      'notebook': 'tecnologia', 'laptop': 'tecnologia', 'tela': 'tecnologia',
      'inovacao': 'tecnologia', 'moderno': 'tecnologia', 'futuro': 'tecnologia',
      /* Abstrato / Genérico */
      'abstrato': 'abstrato', 'fundo': 'abstrato', 'background': 'abstrato',
      'gradiente': 'abstrato', 'textura': 'abstrato', 'minimalista': 'abstrato',
      'padrao': 'abstrato', 'geometrico': 'abstrato', 'colorido': 'abstrato',
      'escuro': 'abstrato', 'dark': 'abstrato', 'light': 'abstrato', 'claro': 'abstrato',
    };
    for (const [alias, cat] of Object.entries(aliases)) {
      if (normalized.includes(alias)) {
        photoIds = CURATED[cat] || [];
        break;
      }
    }
  }

  // Busca por palavras individuais se nada matched
  if (photoIds.length === 0) {
    const words = normalized.split(/\s+/);
    const aliases2: Record<string, string> = {
      'hospital': 'hospital', 'medico': 'medico', 'familia': 'familia',
      'saude': 'saude', 'cidade': 'cidade', 'idoso': 'idoso', 'bebe': 'bebe',
      'natureza': 'natureza', 'escritorio': 'escritorio', 'clinica': 'hospital',
      'doutor': 'medico', 'praia': 'cidade', 'rio': 'cidade', 'senior': 'idoso',
      'crianca': 'bebe', 'gestante': 'bebe', 'trabalho': 'escritorio',
      'emocao': 'emocao', 'irritado': 'emocao', 'raiva': 'emocao', 'triste': 'emocao',
      'frustrado': 'emocao', 'alegre': 'emocao', 'sorriso': 'emocao', 'estresse': 'emocao',
      'ansiedade': 'emocao', 'medo': 'emocao', 'dor': 'emocao', 'paz': 'emocao',
      'calma': 'emocao', 'confianca': 'emocao', 'chorando': 'emocao', 'rindo': 'emocao',
      'dinheiro': 'dinheiro', 'economia': 'dinheiro', 'economizar': 'dinheiro',
      'preco': 'dinheiro', 'barato': 'dinheiro', 'desconto': 'dinheiro', 'custo': 'dinheiro',
      'bolso': 'dinheiro', 'poupanca': 'dinheiro', 'promocao': 'dinheiro',
      'esporte': 'esporte', 'academia': 'esporte', 'exercicio': 'esporte',
      'fitness': 'esporte', 'corrida': 'esporte', 'yoga': 'esporte', 'treino': 'esporte',
      'tecnologia': 'tecnologia', 'digital': 'tecnologia', 'celular': 'tecnologia',
      'app': 'tecnologia', 'online': 'tecnologia', 'moderno': 'tecnologia',
      'abstrato': 'abstrato', 'fundo': 'abstrato', 'background': 'abstrato',
      'gradiente': 'abstrato', 'escuro': 'abstrato', 'dark': 'abstrato',
    };
    for (const word of words) {
      if (aliases2[word]) {
        photoIds = CURATED[aliases2[word]] || [];
        break;
      }
    }
  }

  // Se nada match, retorna mix de todas categorias
  if (photoIds.length === 0) {
    const allIds = Object.values(CURATED).flat();
    photoIds = allIds.sort(() => Math.random() - 0.5).slice(0, 9);
  }

  const results = photoIds.slice(0, 9).map((id, i) => ({
    nome: `${q} ${i + 1}`,
    url: buildUrl(id),
  }));

  return NextResponse.json({ results });
}
