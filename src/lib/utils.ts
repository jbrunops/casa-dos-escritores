/**
 * Utilitários para manipulação de dados e formatação
 */

/**
 * Gera um slug seguro a partir de um título e ID
 * @param title - O título a ser transformado em slug
 * @param id - O ID a ser adicionado ao slug para unicidade
 * @returns Slug formatado seguro para URLs
 */
export function generateSlug(title: string, id: string | number): string {
  if (!title) return `id-${id}`;

  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const slug = normalizedTitle
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/^-+|-+$/g, '');

  return `${slug}-${id}`;
}

/**
 * Extrai o ID numérico ou UUID de um slug
 * @param slug - O slug a ser processado
 * @returns O ID extraído ou null se não encontrado
 */
export function extractIdFromSlug(slug: string): string | null {
  if (!slug) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    return slug;
  }
  if (/^\d+$/.test(slug)) {
    return slug;
  }
  const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  const numericMatch = slug.match(/-(\d+)$/);
  if (numericMatch) {
    return numericMatch[1];
  }
  return null;
}

/**
 * Formata a data em português
 * @param dateString - String de data ISO
 * @returns Data formatada
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calcula o tempo estimado de leitura
 * @param content - Conteúdo HTML
 * @returns Minutos de leitura
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]+>/g, '');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

/**
 * Cria um resumo de texto a partir de conteúdo HTML
 * @param htmlContent - Conteúdo HTML
 * @param maxLength - Tamanho máximo do resumo
 * @returns Resumo em texto plano
 */
export function createSummary(htmlContent: string, maxLength = 150): string {
  const text = htmlContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}
