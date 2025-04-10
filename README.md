# Casa dos Escritores

## 📚 Visão Geral

Casa dos Escritores é uma plataforma completa para escritores publicarem suas histórias, organizá-las em séries e conectarem-se com leitores. O projeto oferece um ambiente intuitivo para criação, gerenciamento e consumo de conteúdo literário em português, com foco em uma experiência fluida tanto para autores quanto para leitores.

## 🌟 Funcionalidades Principais

### 📝 Gerenciamento de Conteúdo
- **Histórias Individuais**: Publicação de contos e histórias independentes
- **Séries com Capítulos**: Organização de histórias em séries contínuas
- **Editor Rico**: Interface WYSIWYG para formatação de textos
- **Categorização**: Organização por gêneros/categorias para facilitar descoberta
- **Estatísticas**: Contagem de visualizações, palavras e tempo estimado de leitura

### 👤 Perfis e Usuários
- **Registro e Autenticação**: Sistema completo de cadastro e login
- **Perfis Personalizáveis**: Informações do autor, foto e dados de contato
- **Dashboard**: Interface centralizada para gerenciar histórias e séries
- **Estatísticas Pessoais**: Visão geral de desempenho e métricas do autor

### 🔔 Interação Social
- **Comentários**: Sistema para leitores interagirem com autores
- **Visualizações**: Contagem e exibição de visualizações por história
- **Navegação por Autor**: Exploração de outras obras do mesmo escritor
- **Compartilhamento**: Links para compartilhar histórias em redes sociais

### 🎨 Interface e Design
- **Design Responsivo**: Adaptação perfeita para dispositivos móveis e desktop
- **Tema Consistente**: Experiência visual uniforme com cores padronizadas (#484DB5 e #E5E7EB)
- **Acessibilidade**: Interfaces pensadas para diferentes necessidades
- **Navegação Intuitiva**: Menus e fluxos de uso simplificados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) com variáveis customizadas
- **Editor de Texto**: [TipTap](https://tiptap.dev/) (baseado em ProseMirror)
- **Ícones**: [Lucide React](https://lucide.dev/)

### Backend
- **BaaS**: [Supabase](https://supabase.com/) 
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Autenticação**: Sistema de login integrado do Supabase
- **Storage**: Armazenamento de imagens (avatares, etc)

### Infraestrutura
- **Deploy**: Vercel (Frontend) + Supabase (Backend)
- **CI/CD**: Integração contínua via GitHub Actions
- **Monitoramento**: Vercel Analytics e Supabase Metrics

## 📊 Estrutura do Projeto

```
casa-dos-escritores/
│
├── public/                   # Arquivos estáticos
│   └── images/               # Imagens do site
│
├── src/                      # Código-fonte da aplicação
│   ├── app/                  # App Router do Next.js
│   │   ├── (auth)/           # Rotas de autenticação
│   │   ├── admin/            # Área administrativa
│   │   ├── dashboard/        # Dashboard do usuário
│   │   ├── profile/          # Perfil público
│   │   ├── story/            # Visualização de histórias
│   │   └── series/           # Visualização de séries
│   │
│   ├── components/           # Componentes reutilizáveis
│   │   ├── Comments.js       # Sistema de comentários
│   │   ├── StoryContent.js   # Exibição de conteúdo das histórias
│   │   └── TipTapEditor.js   # Editor de textos
│   │
│   ├── contexts/             # Contextos React
│   │   └── AuthContext.js    # Gerenciamento de autenticação
│   │
│   ├── lib/                  # Bibliotecas e adaptadores
│   │   ├── supabase-browser.js # Cliente Supabase (browser)
│   │   └── supabase-server.js  # Cliente Supabase (server)
│   │
│   └── utils/                # Utilitários e funções auxiliares
│       └── userRoles.js      # Controle de permissões
│
├── middleware.js             # Middleware do Next.js
└── package.json              # Dependências do projeto
```

## 📝 Documentação de Estilos

O projeto segue uma estrutura de CSS organizada:

- **Cores Principais**: 
  - Primária: `#484DB5` (azul)
  - Bordas: `#E5E7EB` (cinza claro)
  - Texto: `#111827` (cinza escuro)
  - Fundo: `#FFFFFF` (branco)

- **Organização**:
  - Componentes com estilos autocontidos
  - Utilitários através do Tailwind CSS
  - Estilos específicos para dispositivos móveis

## 📄 Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).

## 📞 Contato e Suporte ^^

- **Site**: [casadosescritores.com.br](https://casadosescritores.com.br)
- **Email**: jbrunops@outlook.com

---

Desenvolvido com ❤️ para escritores brasileiros