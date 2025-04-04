# Casa dos Escritores - Plataforma de Conteúdo Literário

Casa dos Escritores é uma plataforma dedicada a escritores que desejam compartilhar suas histórias, organizá-las em séries e conectar-se com leitores. O projeto oferece um ambiente amigável para a criação e consumo de conteúdo literário.

## Funcionalidades Principais

### Gerenciamento de Usuários
- **Registro e Autenticação**: Sistema completo de registro, login e recuperação de senha
- **Perfis de Usuário**: Cada escritor possui um perfil público com suas informações e obras
- **Dashboard Personalizado**: Interface centralizada para gerenciar histórias e séries
- **Gestão de Avatar**: Upload e personalização de imagem de perfil

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

### Sistema de Notificações
- **Notificações em Tempo Real**: Alertas para interações como comentários, curtidas e novos seguidores
- **Central de Notificações**: Página dedicada para gerenciar todas as notificações
- **Filtros de Notificações**: Opções para filtrar por notificações lidas e não lidas
- **Badges Visuais**: Indicadores numéricos para notificações não lidas
- **Marcar como Lido**: Opções para marcar notificações individuais ou todas como lidas

### Social
- **Perfis Públicos**: Páginas de perfil mostrando as obras de cada autor
- **Destaques**: Seção na página inicial com séries e histórias populares
- **Compartilhamento**: Links para compartilhar histórias em redes sociais
- **Comentários**: Sistema para interação entre leitores e autores

### Interface
- **Design Responsivo**: Adaptação completa para dispositivos móveis e desktop
- **Editor de Texto Rico**: Interface WYSIWYG para formatação de conteúdo
- **Tema Consistente**: Design visual coeso entre todas as páginas
- **Menu Mobile Otimizado**: Interface específica para navegação em dispositivos móveis

### Experiência Mobile
- **Menu Lateral Adaptativo**: Menu de navegação deslizante otimizado para telas pequenas
- **Layout Responsivo**: Ajustes automáticos de layout baseados no tamanho da tela
- **Elementos Touch-Friendly**: Botões e controles maiores para facilitar interação em telas de toque
- **Performance Otimizada**: Carregamento rápido mesmo em conexões móveis

## Estrutura do ProjetO

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
│   │   │   ├── notifications/ # API de notificações
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
│   │   ├── notifications/    # Central de notificações
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
│   │   ├── Header.js         # Cabeçalho responsivo
│   │   ├── MobileSeries.js   # Componente de séries para mobile
│   │   ├── NavBar.js         # Barra de navegação
│   │   ├── NotificationBell.js # Sino de notificações
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
│   │   ├── supabase-server.js  # Cliente Supabase para server
│   │   └── utils.js          # Funções utilitárias
│   │
│   └── styles/               # Estilos CSS
│       ├── chapters.css      # Estilos para capítulos
│       ├── dashboard.css     # Estilos para dashboard
│       ├── editor.css        # Estilos para o editor
│       ├── globals.css       # Estilos globais
│       ├── layout.css        # Estilos de layout
│       ├── notifications.css # Estilos para notificações
│       ├── pages.css         # Estilos para páginas específicas
│       ├── profile.css       # Estilos para perfil
│       ├── series.css        # Estilos para séries
│       ├── stories.css       # Estilos para histórias
│       └── styles-mobile/    # Estilos específicos para mobile
│           ├── index.css     # Índice de estilos mobile
│           ├── mobile-header.css # Cabeçalho mobile
│           └── mobile-notifications.css # Notificações mobile
│
├── next.config.js            # Configuração do Next.js
└── package.json              # Dependências do projeto
```

## Tecnologias Utilizadas

- **Frontend**: Next.js com React 
- **Backend**: Supabase (PostgreSQL, Autenticação, Armazenamento)
- **Notificações**: Sistema em tempo real com Supabase Realtime
- **Editor**: TipTap (baseado em ProseMirror)
- **Estilização**: CSS com variáveis para temas
- **Ícones**: Lucide React
- **Responsividade**: Media queries e layouts adaptativos

## Detalhes Técnicos

### Sistema de Notificações

O sistema de notificações utiliza a funcionalidade de canais em tempo real do Supabase para entregar alertas instantâneos aos usuários. A arquitetura implementada inclui:

- **Tabela de Notificações**: Armazenamento de notificações com campos para tipo, conteúdo, status de leitura e metadados adicionais
- **Canais de Tempo Real**: Assinatura a eventos de banco de dados para atualizações instantâneas
- **Processamento de Eventos**: Lógica para tratamento de diferentes tipos de notificações
- **Interface de Usuário Reativa**: Atualização automática do badge de notificações e da lista de mensagens

### Experiência Mobile-First

A aplicação segue princípios de design mobile-first com otimizações específicas:

- **Estrutura CSS Modular**: Separação de estilos base e específicos para mobile
- **Detecção de Viewport**: Ajuste dinâmico da interface baseado no tamanho de tela
- **Economia de Recursos**: Carregamento condicional de componentes para otimizar performance
- **Interações Touch-Optimized**: Áreas de toque aumentadas e feedback visual para interações em dispositivos móveis

### Performance

Otimizações implementadas para garantir uma experiência fluida:

- **Renderização Condicional**: Componentes carregados apenas quando necessários
- **Gerenciamento de Estado Eficiente**: Uso de React Hooks para minimizar re-renderizações
- **Lazy Loading**: Carregamento sob demanda para conteúdo abaixo da dobra
- **Compressão de Assets**: Otimização de imagens e recursos estáticos

A Casa dos Escritores oferece uma experiência completa tanto para escritores quanto para leitores, com foco em usabilidade, organização de conteúdo, notificações em tempo real e uma interface responsiva para todas as plataformas.