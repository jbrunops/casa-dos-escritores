
## Funcionalidades Detalhadas

### 1. Listagem de Categorias (`/categories`)

*   **Arquivo:** `src/app/categories/page.js`
*   **Responsabilidade:** Exibir um card para cada categoria disponível no sistema.
*   **Busca de Dados:**
    *   Utiliza a função `fetchAllCategoriesWithCounts` importada de `src/lib/categories.js`.
    *   A função `fetchAllCategoriesWithCounts` executa as seguintes etapas no servidor:
        1.  Busca nomes de categorias únicas da coluna `category` na tabela `stories` (apenas `is_published: true`).
        2.  Busca nomes de gêneros únicos da coluna `genre` na tabela `series`.
        3.  Combina as listas, remove duplicatas e ordena alfabeticamente.
        4.  Se nenhuma categoria for encontrada no banco, utiliza uma lista `defaultCategories` pré-definida.
        5.  Calcula a contagem de publicações (histórias + séries) para cada categoria, consultando novamente as tabelas `stories` e `series`.
        6.  Associa descrições a cada categoria (atualmente hardcoded em `lib/categories.js`, com sugestão de mover para o DB).
        7.  Gera um `slug` para cada categoria usando `generateSlug` de `lib/utils.js`.
        8.  Retorna um array de objetos no formato: `{ name: string, slug: string, description: string, count: number }`.
*   **Renderização:**
    *   Exibe um título "Todas as Categorias".
    *   Renderiza um grid responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
    *   Para cada categoria retornada por `fetchAllCategoriesWithCounts`, renderiza um card (`<Link>`) contendo:
        *   Nome da categoria.
        *   Contagem de publicações em um badge.
        *   Descrição da categoria.
        *   Efeitos visuais de hover (sombra, translação, fundo gradiente).
    *   O link de cada card aponta para a página de detalhes da categoria correspondente (ex: `/categories/ficcao-cientifica`).
    *   Exibe uma mensagem caso a busca de dados falhe e retorne um array vazio.

### 2. Detalhes da Categoria (`/categories/[category]`)

*   **Arquivo:** `src/app/categories/[category]/page.js`
*   **Responsabilidade:** Exibir uma lista paginada de todo o conteúdo (histórias, séries, capítulos) associado a uma categoria específica.
*   **Roteamento:** Rota dinâmica do Next.js. O valor de `[category]` na URL (o slug) é acessível via `params.category`.
*   **Metadados:** A função `generateMetadata` é usada para gerar `<title>` e `<meta name="description">` dinamicamente com base no nome da categoria (convertido a partir do slug).
*   **Busca de Dados (Componente `CategoryPage` - Server Component):**
    1.  **Obtém Parâmetros:** Lê `params.category` (slug) e `searchParams.page` (número da página atual, padrão 1).
    2.  **Converte Slug:** Transforma o `slug` de volta em nome de categoria (ex: "ficcao-cientifica" -> "Ficção Científica") para usar nos filtros das queries.
    3.  **Calcula Paginação:** Determina os índices `from` e `to` com base na `PAGE_SIZE` e na página atual.
    4.  **Busca Histórias (`stories`):**
        *   Filtra a tabela `stories` por `category` (usando `ilike` para case-insensitivity) e `is_published: true`.
        *   Ordena por `created_at` descendente.
        *   Após buscar as histórias, busca os nomes de usuário (`username`) dos autores na tabela `profiles` usando os `author_id` das histórias.
        *   Combina os dados, adicionando `authorName` a cada história.
    5.  **Busca Séries (`series`):**
        *   Filtra a tabela `series` por `genre` (usando `ilike`). *Nota: Não filtra por `is_published` atualmente.*
        *   Ordena por `created_at` descendente.
        *   Busca os nomes de usuário (`username`) dos autores na tabela `profiles` usando os `author_id` das séries.
        *   Combina os dados, adicionando `authorName` a cada série.
    6.  **Busca Capítulos (`chapters`):**
        *   Obtém os IDs (`id`) das séries encontradas no passo anterior.
        *   Se houver séries, busca capítulos na tabela `chapters` onde `series_id` corresponde aos IDs das séries.
        *   **Otimização de Lote:** A busca é feita em lotes (`MAX_BATCH_SIZE = 10`) para evitar erros com a cláusula `IN` do SQL caso haja muitas séries na categoria.
        *   *Nota de Correção:* Foi removido o filtro `.eq("is_published", true)` desta query, pois a coluna `is_published` não existe na tabela `chapters`. Os logs de erro detalhados foram adicionados temporariamente para depuração e podem ser removidos.
        *   Busca os nomes de usuário (`username`) dos autores na tabela `profiles` usando os `author_id` dos capítulos.
        *   Combina os dados, adicionando `authorName` a cada capítulo. Cria um mapa `seriesInfo` para adicionar `seriesTitle` e `seriesId` a cada capítulo posteriormente.
    7.  **Combina Resultados:** Junta os arrays de `storiesWithAuthorInfo`, `seriesWithAuthorInfo` e `chaptersData` em um único array `allResults`. Adiciona um campo `type` ('story', 'series', 'chapter') a cada item.
    8.  **Ordena:** Classifica `allResults` por `created_at` descendente.
    9.  **Pagina:** Extrai a fatia (`slice`) correspondente à página atual (`paginatedResults`). Calcula `totalCount` e `totalPages`.
*   **Renderização:**
    *   Exibe um título "Histórias de [Nome da Categoria]".
    *   Se `allResults` estiver vazio, exibe uma mensagem indicando que não há conteúdo na categoria, com links para publicar ou ver outras categorias.
    *   Caso contrário:
        *   Renderiza a lista `paginatedResults`. Cada item é um link (`<Link>`) que aponta para a página de visualização específica do conto, série ou capítulo.
        *   Cada item da lista exibe:
            *   Título (com link).
            *   Tipo (Conto, Série, Capítulo) em um badge.
            *   Para capítulos, exibe "Capítulo da série: [Título da Série]".
            *   Resumo do conteúdo (`createSummary` é usado para extrair texto de HTML e limitar o tamanho).
            *   Nome do autor.
            *   Data de publicação.
        *   Se `totalPages > 1`, renderiza o componente `Pagination` para navegação entre as páginas.
    *   Inclui um botão/link "Ver todas as categorias" no final.

## Configuração e Execução

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd <nome-do-diretorio>
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```
3.  **Configure as Variáveis de Ambiente:**
    *   Copie o arquivo `.env.example` para `.env.local`:
        ```bash
        cp .env.example .env.local
        ```
    *   Edite o arquivo `.env.local` e preencha com as suas credenciais do Supabase:
        *   `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase.
        *   `SUPABASE_SERVICE_ROLE_KEY`: Chave de `service_role` do seu projeto Supabase (encontrada nas configurações de API do Supabase). **Mantenha esta chave segura e não a exponha no lado do cliente.**
4.  **Rode o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
5.  Abra [`http://localhost:3000`](http://localhost:3000) no seu navegador.

## Considerações Futuras e Melhorias

*   **Componentização:** Criar um componente `CategoryCard.jsx` para os cards na página `/categories`.
*   **Dados de Categoria:** Mover as descrições de categoria (atualmente em `lib/categories.js`) para uma tabela dedicada no Supabase.
*   **Tratamento de Erros:** Implementar Error Boundaries do React/Next.js para capturar erros de forma mais robusta nas páginas e exibir UIs de erro mais informativas.
*   **Schema do DB (`chapters`):** Avaliar a necessidade da coluna `is_published` na tabela `chapters`. Se necessária, adicioná-la no Supabase e reativar o filtro `.eq("is_published", true)` na query correspondente.
*   **Otimização de Performance:** Para a listagem de categorias (`/categories`), se houver muitas publicações, a contagem pode ficar lenta. Considerar a criação de uma tabela `categories` com um campo `posts_count` atualizado via Triggers/Funções no Supabase.
*   **Refatoração (`[category]/page.js`):** A lógica de busca de dados neste arquivo é complexa. Poderia ser refatorada em funções auxiliares menores e mais focadas dentro de `lib/`.
*   **Remover Logs de Depuração:** Remover os `console.error` adicionados para depuração do erro de capítulos (`JSON.stringify`, IDs das séries).
*   **Testes:** Adicionar testes unitários e/ou de integração.
