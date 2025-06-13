# 📚 Casa dos Escritores

> **Plataforma literária moderna e segura para escritores publicarem suas obras e construírem uma comunidade vibrante em torno da narrativa digital.**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 🌟 Visão Geral

Casa dos Escritores é uma plataforma completa e moderna que conecta escritores e leitores em um ambiente seguro e intuitivo. Desenvolvida com as mais recentes tecnologias web, oferece ferramentas avançadas para criação, publicação e descoberta de conteúdo literário.

### ✨ Principais Características

- 🔐 **Segurança Robusta**: Proteção CSRF, sanitização XSS, rate limiting e auditoria completa
- 📝 **Editor Avançado**: TipTap com formatação rica e upload de imagens
- 👥 **Comunidade Ativa**: Sistema de seguir, comentários e interações sociais
- 📱 **Responsivo**: Interface adaptável para todos os dispositivos
- ⚡ **Performance**: SSR, otimização de imagens e cache inteligente
- 🔍 **Busca Inteligente**: Sistema de busca avançado com destaque de termos
- 📊 **Analytics**: Métricas detalhadas de engajamento e leitura

---

## 🛠️ Stack Tecnológica

### **Frontend**
- **Next.js 15.2.4** - Framework React com App Router e SSR
- **React 19.1.0** - Biblioteca para interfaces de usuário
- **TypeScript 5.8.3** - Tipagem estática para JavaScript
- **Tailwind CSS 3.4.17** - Framework CSS utilitário
- **Framer Motion 12.6.3** - Animações e transições fluidas
- **Lucide React 0.484.0** - Ícones modernos e consistentes

### **Backend & Banco de Dados**
- **Supabase** - Backend-as-a-Service completo
  - PostgreSQL com Row Level Security (RLS)
  - Autenticação e autorização
  - Storage para arquivos e imagens
  - Real-time subscriptions
- **Supabase SSR 0.6.1** - Integração server-side rendering

### **Editor & Conteúdo**
- **TipTap 2.11.5** - Editor de texto rico e extensível
  - Extensões: Heading, Image, Link, Typography, Text Align
  - Placeholder e Underline support
  - Starter Kit completo
- **DOMPurify 3.2.4** - Sanitização segura de HTML

### **Utilitários & Performance**
- **SWR 2.3.3** - Data fetching com cache inteligente
- **date-fns 4.1.0** - Manipulação de datas
- **nanoid 5.1.5** - Geração de IDs únicos
- **PostCSS** - Processamento avançado de CSS

### **Desenvolvimento & Qualidade**
- **ESLint 9** - Linting e qualidade de código
- **Autoprefixer 10.4.21** - Compatibilidade CSS
- **Chalk 4.1.2** - Colorização de terminal
- **dotenv 16.4.7** - Gerenciamento de variáveis de ambiente

---

## 🏗️ Arquitetura do Projeto

```
casa-dos-escritores/
├── 📁 src/
│   ├── 📁 app/                     # App Router (Next.js 15+)
│   │   ├── 📁 api/                 # API Routes
│   │   │   ├── 📁 admin/           # Endpoints administrativos
│   │   │   ├── 📁 chapters/        # Gestão de capítulos
│   │   │   ├── 📁 comments/        # Sistema de comentários
│   │   │   ├── 📁 notifications/   # Notificações
│   │   │   ├── 📁 register/        # Registro de usuários
│   │   │   ├── 📁 series/          # Gestão de séries
│   │   │   └── 📁 upload/          # Upload de arquivos
│   │   ├── 📁 auth/                # Páginas de autenticação
│   │   ├── 📁 categories/          # Categorias de conteúdo
│   │   ├── 📁 chapter/             # Páginas de capítulos
│   │   ├── 📁 create/              # Criação de conteúdo
│   │   ├── 📁 dashboard/           # Painel do usuário
│   │   ├── 📁 profile/             # Perfis de usuário
│   │   ├── 📁 search/              # Sistema de busca
│   │   ├── 📁 series/              # Páginas de séries
│   │   ├── 📁 story/               # Páginas de histórias
│   │   ├── layout.js               # Layout principal
│   │   ├── page.js                 # Página inicial
│   │   └── globals.css             # Estilos globais
│   ├── 📁 components/              # Componentes React
│   │   ├── Header.js               # Cabeçalho da aplicação
│   │   ├── StoryContent.js         # Renderização de conteúdo
│   │   └── ...                     # Outros componentes
│   ├── 📁 contexts/                # Contextos React
│   ├── 📁 hooks/                   # Custom hooks
│   ├── 📁 lib/                     # Bibliotecas e utilitários
│   │   ├── csrf-protection.js      # Proteção CSRF
│   │   ├── rate-limit.js           # Rate limiting
│   │   ├── sanitize.js             # Sanitização de entrada
│   │   ├── security-logger.js      # Logging de segurança
│   │   ├── supabase-browser.js     # Cliente Supabase (browser)
│   │   ├── supabase-server.js      # Cliente Supabase (server)
│   │   └── utils.js                # Utilitários gerais
│   ├── 📁 utils/                   # Funções utilitárias
│   └── middleware.js               # Middleware de autenticação
├── 📁 public/                      # Assets estáticos
├── 📁 docs/                        # Documentação técnica
├── 📁 scripts/                     # Scripts de desenvolvimento
├── 📁 config/                      # Configurações
├── 📁 migrations/                  # Migrações de banco
├── 📄 security-report.md           # Relatório de segurança
├── 📄 supabase-types.ts            # Tipos TypeScript do Supabase
├── 📄 next.config.mjs              # Configuração Next.js
├── 📄 tailwind.config.js           # Configuração Tailwind
├── 📄 tsconfig.json                # Configuração TypeScript
├── 📄 vercel.json                  # Configuração Vercel
└── 📄 package.json                 # Dependências e scripts
```

---

## 🔐 Recursos de Segurança

### **Implementações de Segurança Robustas**

- ✅ **Proteção CSRF** - Sistema completo de validação de origem
- ✅ **Sanitização XSS** - DOMPurify e escape de HTML seguro
- ✅ **Rate Limiting** - Proteção contra ataques de força bruta
- ✅ **Auditoria de Segurança** - Logging detalhado de ações sensíveis
- ✅ **Validação de Upload** - Verificação de magic numbers e tipos MIME
- ✅ **Headers de Segurança** - CSP, HSTS, X-Frame-Options
- ✅ **Autenticação Robusta** - Supabase Auth com RLS
- ✅ **Controle de Acesso** - Sistema baseado em roles
- ✅ **Criptografia** - HTTPS obrigatório e dados sensíveis protegidos

### **Content Security Policy (CSP)**
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://kkykesdoqdeagnuvlxao.supabase.co;
frame-ancestors 'none';
```

---

## 🚀 Instalação e Configuração

### **Pré-requisitos**

- Node.js 18+ 
- npm ou yarn
- Conta Supabase configurada
- Git

### **1. Clone o Repositório**

```bash
git clone https://github.com/jbrunops/casa-dos-escritores.git
cd casa-dos-escritores
```

### **2. Instale as Dependências**

```bash
npm install
# ou
yarn install
```

### **3. Configuração do Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security Configuration (opcional)
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Analytics (opcional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### **4. Configuração do Supabase**

#### **Tabelas Principais**
```sql
-- Perfis de usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórias
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Séries
CREATE TABLE series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID REFERENCES profiles(id),
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  story_id UUID REFERENCES stories(id),
  series_id UUID REFERENCES series(id),
  chapter_id UUID REFERENCES chapters(id),
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Row Level Security (RLS)**
```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Políticas de exemplo
CREATE POLICY "Usuários podem ver perfis públicos" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem editar próprio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### **5. Executar o Projeto**

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm run start

# Linting
npm run lint
```

---

## 📋 Funcionalidades Detalhadas

### **🔐 Sistema de Autenticação**
- **Registro/Login** via Supabase Auth
- **Perfis Personalizáveis** com avatar e biografia
- **Gerenciamento de Sessão** com SSR
- **Roles e Permissões** (usuário, admin)
- **Recuperação de Senha** via email

### **📝 Sistema de Publicação**
- **Editor Rico TipTap** com formatação avançada
- **Upload de Imagens** com validação rigorosa
- **Categorização** e sistema de tags
- **Rascunhos e Publicação** com controle de visibilidade
- **Séries e Capítulos** para obras longas
- **Preview em Tempo Real** do conteúdo

### **👥 Interação Social**
- **Sistema de Seguir/Seguidor**
- **Comentários Aninhados** com moderação
- **Avaliações e Curtidas**
- **Feed Personalizado** baseado em seguidos
- **Notificações em Tempo Real**
- **Compartilhamento Social**

### **🔍 Sistema de Busca**
- **Busca Avançada** por título, conteúdo e autor
- **Filtros por Categoria** e data
- **Destaque de Termos** nos resultados
- **Busca em Tempo Real** com debounce
- **Histórico de Buscas**

### **📊 Analytics e Métricas**
- **Visualizações de Histórias**
- **Engajamento de Usuários**
- **Estatísticas de Publicação**
- **Relatórios de Performance**
- **Métricas de Segurança**

### **⚡ Performance e Otimização**
- **Server-Side Rendering (SSR)**
- **Static Site Generation (SSG)** para páginas estáticas
- **Otimização de Imagens** automática
- **Cache Inteligente** com SWR
- **Lazy Loading** de componentes
- **Code Splitting** automático

---

## 🌐 Deploy e Produção

### **Vercel (Recomendado)**

1. **Conecte o Repositório**
   ```bash
   vercel --prod
   ```

2. **Configure Variáveis de Ambiente**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Deploy Automático** via Git push

### **Outras Plataformas**

- **Netlify**: Suporte completo para Next.js
- **Railway**: Deploy com banco PostgreSQL
- **DigitalOcean App Platform**: Escalabilidade automática
- **AWS Amplify**: Integração com serviços AWS

### **Configurações de Produção**

```javascript
// next.config.mjs
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif']
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' }
      ]
    }
  ]
};
```

---

## 🧪 Testes e Qualidade

### **Estratégia de Testes**
- **Testes Unitários** com Jest
- **Testes de Integração** com Testing Library
- **Testes E2E** com Playwright
- **Testes de Segurança** automatizados
- **Performance Testing** com Lighthouse

### **Qualidade de Código**
- **ESLint** para linting
- **Prettier** para formatação
- **TypeScript** para tipagem
- **Husky** para git hooks
- **Conventional Commits**

### **Monitoramento**
- **Sentry** para error tracking
- **Vercel Analytics** para performance
- **Supabase Logs** para backend
- **Custom Security Logs** para auditoria

---

## 🤝 Contribuição

### **Como Contribuir**

1. **Fork o Projeto**
   ```bash
   git fork https://github.com/jbrunops/casa-dos-escritores.git
   ```

2. **Crie uma Branch**
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

3. **Faça suas Alterações**
   - Siga os padrões de código
   - Adicione testes quando necessário
   - Atualize a documentação

4. **Commit suas Mudanças**
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```

5. **Push e Pull Request**
   ```bash
   git push origin feature/nova-funcionalidade
   ```

### **Padrões de Desenvolvimento**

- **Conventional Commits** para mensagens
- **Component-First** architecture
- **TypeScript** obrigatório para novos arquivos
- **Responsive Design** para todos os componentes
- **Accessibility** (WCAG 2.1 AA)
- **Security First** approach

### **Estrutura de Commits**
```
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração
test: adição de testes
chore: tarefas de manutenção
security: correções de segurança
```

---

## 📚 Documentação Adicional

- 📖 [Guia de Desenvolvimento](./docs/DEVELOPMENT.md)
- 🔐 [Relatório de Segurança](./security-report.md)
- 🏗️ [Arquitetura do Sistema](./docs/ARCHITECTURE.md)
- 🔧 [Configuração do Supabase](./docs/SUPABASE.md)
- 🎨 [Guia de Design](./docs/DESIGN.md)
- 🚀 [Deploy e DevOps](./docs/DEPLOYMENT.md)

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

```
MIT License

Copyright (c) 2025 Casa dos Escritores

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🆘 Suporte e Comunidade

### **Canais de Suporte**
- 🐛 **Issues**: [GitHub Issues](https://github.com/jbrunops/casa-dos-escritores/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/jbrunops/casa-dos-escritores/discussions)
- 📧 **Email**: suporte@casadosescritores.com.br
- 🌐 **Website**: [casadosescritores.com.br](https://casadosescritores.com.br)

### **Roadmap**
- [ ] **Mobile App** (React Native)
- [ ] **API Pública** para integrações
- [ ] **Sistema de Monetização** para autores
- [ ] **Marketplace de Livros**
- [ ] **Ferramentas de Analytics** avançadas
- [ ] **Integração com Redes Sociais**
- [ ] **Sistema de Recomendações** com IA

---

## 🙏 Agradecimentos

Agradecemos a todos os contribuidores, beta testers e à comunidade de escritores que tornam este projeto possível.

**Tecnologias que tornaram isso possível:**
- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [TipTap](https://tiptap.dev/) - Editor de texto rico
- [Vercel](https://vercel.com/) - Plataforma de deploy

---

<div align="center">

**Feito com ❤️ para a comunidade de escritores**

[🌟 Star no GitHub](https://github.com/jbrunops/casa-dos-escritores) • [🐛 Reportar Bug](https://github.com/jbrunops/casa-dos-escritores/issues) • [💡 Sugerir Feature](https://github.com/jbrunops/casa-dos-escritores/issues)

</div> 