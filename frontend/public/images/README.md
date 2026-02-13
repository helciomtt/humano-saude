# 📁 Estrutura de Imagens - Humano Saúde

## 🎯 Como Adicionar Suas Imagens

### **Passo 1: Abra o Finder**
```
/Users/helciomattos/Desktop/HUMANO SAUDE SITE/frontend/public/images/
```

### **Passo 2: Arraste suas imagens para as pastas correspondentes**

---

## 📂 Pastas Disponíveis

### **1. `/logos/` - Logotipos da Humano Saúde**

**Arquivos recomendados:**
- `humano-saude-logo.svg` - Logo principal (cor)
- `humano-saude-logo-white.svg` - Logo branca (para fundos escuros)
- `humano-saude-logo-gold.svg` - Logo dourada (premium)
- `humano-saude-icon.svg` - Ícone/símbolo isolado
- `humano-saude-favicon.png` - Favicon 512x512px

**Uso no código:**
```tsx
<Image 
  src="/images/logos/humano-saude-logo.svg" 
  alt="Humano Saúde" 
  width={180} 
  height={40} 
/>
```

---

### **2. `/icons/` - Ícones e Pictogramas**

**Exemplos:**
- `whatsapp.svg`
- `email.svg`
- `phone.svg`
- `calendar.svg`
- `check-circle.svg`
- `alert.svg`

**Uso no código:**
```tsx
<Image 
  src="/images/icons/whatsapp.svg" 
  alt="WhatsApp" 
  width={24} 
  height={24} 
/>
```

---

### **3. `/backgrounds/` - Fundos e Texturas**

**Exemplos:**
- `hero-background.jpg` - Fundo da hero section
- `dashboard-pattern.png` - Padrão para o dashboard
- `gold-texture.jpg` - Textura dourada
- `gradient-gold.svg` - Gradiente vetorial

**Uso no código:**
```tsx
<div 
  className="bg-cover bg-center" 
  style={{ backgroundImage: "url('/images/backgrounds/hero-background.jpg')" }}
>
  {/* Conteúdo */}
</div>
```

---

### **4. `/operadoras/` - Logos das Operadoras de Saúde**

**Exemplos:**
- `unimed-logo.png`
- `bradesco-saude-logo.png`
- `amil-logo.png`
- `sulamerica-logo.png`
- `porto-seguro-logo.png`
- `notredame-logo.png`
- `allianz-logo.png`

**Uso no código:**
```tsx
<Image 
  src="/images/operadoras/unimed-logo.png" 
  alt="Unimed" 
  width={120} 
  height={60} 
  className="object-contain"
/>
```

---

### **5. `/team/` - Fotos da Equipe**

**Exemplos:**
- `ceo-foto.jpg`
- `gerente-comercial.jpg`
- `equipe-atendimento.jpg`

**Uso no código:**
```tsx
<Image 
  src="/images/team/ceo-foto.jpg" 
  alt="João Silva - CEO" 
  width={300} 
  height={300} 
  className="rounded-full"
/>
```

---

### **6. `/testimonials/` - Fotos de Clientes/Depoimentos**

**Exemplos:**
- `cliente-1.jpg`
- `cliente-2.jpg`
- `cliente-3.jpg`

**Uso no código:**
```tsx
<Image 
  src="/images/testimonials/cliente-1.jpg" 
  alt="Cliente satisfeito" 
  width={80} 
  height={80} 
  className="rounded-full"
/>
```

---

## 🎨 Formatos Recomendados

### **Para Logos e Ícones:**
- ✅ **SVG** - Escalável, leve, editável (IDEAL)
- ✅ **PNG** - Com fundo transparente (alternativa)
- ❌ **JPG** - Não usar (sem transparência)

### **Para Fotos e Backgrounds:**
- ✅ **WebP** - Melhor compressão (moderno)
- ✅ **JPG** - Para fotos
- ✅ **PNG** - Se precisar transparência

### **Para Favicon:**
- ✅ **PNG** - 512x512px ou 192x192px
- ✅ **ICO** - 32x32px (fallback)

---

## 🚀 Como Usar no Código

### **Componente Next.js Image (Otimizado):**
```tsx
import Image from 'next/image'

<Image
  src="/images/logos/humano-saude-logo.svg"
  alt="Humano Saúde"
  width={180}
  height={40}
  priority // Para imagens acima da dobra
  className="h-10 w-auto"
/>
```

### **Tag HTML Simples:**
```tsx
<img 
  src="/images/icons/whatsapp.svg" 
  alt="WhatsApp" 
  className="w-6 h-6"
/>
```

### **Background CSS:**
```tsx
<div className="bg-[url('/images/backgrounds/hero-background.jpg')] bg-cover bg-center">
  {/* Conteúdo */}
</div>
```

---

## 📋 Checklist de Imagens Necessárias

### **Prioridade Alta:**
- [ ] Logo principal Humano Saúde (SVG)
- [ ] Logo branca (para sidebar escuro)
- [ ] Favicon 512x512
- [ ] Logos das principais operadoras (Unimed, Bradesco, Amil)

### **Prioridade Média:**
- [ ] Background hero section
- [ ] Foto da equipe/CEO
- [ ] Ícones personalizados (se houver)

### **Prioridade Baixa:**
- [ ] Fotos de clientes/depoimentos
- [ ] Texturas decorativas
- [ ] Padrões de fundo

---

## 🔗 Acessar via Finder

**Caminho completo:**
```
/Users/helciomattos/Desktop/HUMANO SAUDE SITE/frontend/public/images/
```

**Atalho:**
1. Abra o Finder
2. Cmd + Shift + G
3. Cole o caminho acima
4. Arraste suas imagens para as pastas

---

## ✅ Pronto!

Agora é só **arrastar e soltar** suas imagens nas pastas correspondentes.

Se precisar de ajuda para criar componentes específicos (Logo, OperadoraCard, etc.), é só pedir!
