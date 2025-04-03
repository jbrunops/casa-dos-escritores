# Casa dos Escritores - Plataforma de Conteúdo Literário

Casa dos Escritores é uma plataforma dedicada a escritores que desejam compartilhar suas histórias, organizá-las em séries e conectar-se com leitores. O projeto oferece um ambiente amigável para a criação e consumo de conteúdo literário.

## Funcionalidades Principais

### Gerenciamento de Usuários
- **Registro e Autenticação**: Sistema completo de registro, login e recuperação de senha
- **Perfis de Usuário**: Cada escritor possui um perfil público com suas informações e obras
- **Dashboard Personalizado**: Interface centralizada para gerenciar histórias e séries

### Histórias Individuais
- **Criação e Edição**: Editor rico com formatação de texto para escrever histórias
- **Categorização**: Organização por gêneros e tags para melhor descoberta
- **Visualização**: Interface de leitura otimizada para diferentes dispositivos
- **Métricas**: Contagem de visualizações e estatísticas de texto (palavras, tempo de leitura)

### Séries
- **Organização em Capítulos**: Criação de séries com múltiplos capítulos
- **Gerenciamento de Ordem**: Definição da sequência de leitura dos capítulos
- **Navegação Intuitiva**: Interface para navegar entre capítulos da mesma série
- **Status da Série**: Indicador se a série está completa ou em andamento

### Social
- **Perfis Públicos**: Páginas de perfil mostrando as obras de cada autor
- **Destaques**: Seção na página inicial com séries e histórias populares
- **Compartilhamento**: Links para compartilhar histórias em redes sociais

### Interface
- **Design Responsivo**: Adaptação para dispositivos móveis e desktop
- **Editor de Texto Rico**: Interface WYSIWYG para formatação de conteúdo

## Estrutura do Projeto

```
casa-dos-escritores/
│
├── public/                   # Arquivos estáticos
│   ├── favicon.ico
│   └── images/               # Imagens do site
│
├── src/
│   ├── app/                  # Organização por rotas (Next.js App Router)
│   │   ├── api/              # Endpoints da API
│   │   │   ├── auth/         # Autenticação
│   │   │   ├── profile/      # Perfis de usuário
│   │   │   ├── series/       # API de séries
│   │   │   └── stories/      # API de histórias
│   │   │
│   │   ├── chapter/[id]/     # Página de capítulo individual
│   │   ├── dashboard/        # Área do usuário
│   │   │   ├── edit-chapter/ # Edição de capítulos
│   │   │   ├── edit-series/  # Edição de séries
│   │   │   ├── edit-story/   # Edição de histórias
│   │   │   ├── new/          # Criação de conteúdo
│   │   │   ├── new-chapter/  # Criação de capítulos
│   │   │   └── settings/     # Configurações do usuário
│   │   │
│   │   ├── login/            # Página de login
│   │   ├── profile/[username]/ # Perfil público
│   │   ├── register/         # Registro de usuário
│   │   ├── reset-password/   # Recuperação de senha
│   │   ├── series/           # Listagem de séries
│   │   │   └── [id]/         # Página de série específica
│   │   │
│   │   ├── settings/         # Configurações da conta
│   │   ├── story/[id]/       # Página de história individual
│   │   └── layout.js         # Layout global
│   │
│   ├── components/           # Componentes reutilizáveis
│   │   ├── AuthForm.js       # Formulário de autenticação
│   │   ├── DarkModeToggle.js # Alternador de tema
│   │   ├── NavBar.js         # Barra de navegação
│   │   ├── Pagination.js     # Componente de paginação
│   │   ├── SeriesActions.js  # Ações para séries
│   │   ├── SeriesHighlights.js # Destaques de séries
│   │   ├── StoryActions.js   # Ações para histórias
│   │   ├── StoryCard.js      # Card de história
│   │   ├── StoryContent.js   # Exibição do conteúdo da história
│   │   ├── StoryHighlights.js # Destaques de histórias
│   │   └── TipTapEditor.js   # Editor de texto rico
│   │
│   ├── lib/                  # Utilitários e bibliotecas
│   │   ├── supabase-browser.js # Cliente Supabase para browser
│   │   └── supabase-server.js  # Cliente Supabase para server
│   │
│   └── styles/               # Estilos CSS
│       ├── chapters.css      # Estilos para capítulos
│       ├── dashboard.css     # Estilos para dashboard
│       ├── editor.css        # Estilos para o editor
│       ├── globals.css       # Estilos globais
│       ├── navbar.css        # Estilos para navegação
│       ├── profile.css       # Estilos para perfil
│       ├── series.css        # Estilos para séries
│       └── stories.css       # Estilos para histórias
│
├── .env.local                # Variáveis de ambiente (não versionado)
├── next.config.js            # Configuração do Next.js
├── package.json              # Dependências do projeto
└── README.md                 # Este arquivo
```

## Tecnologias Utilizadas

- **Frontend**: Next.js com React
- **Backend**: Supabase (PostgreSQL, Autenticação, Armazenamento)
- **Editor**: TipTap (baseado em ProseMirror)
- **Estilização**: CSS com variáveis para temas
- **Ícones**: Lucide React

A Casa dos Escritores oferece uma experiência completa tanto para escritores quanto para leitores, com foco em usabilidade, organização de conteúdo e uma interface agradável para criação e consumo de histórias.