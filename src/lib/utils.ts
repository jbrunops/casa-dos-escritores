import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utilitários para manipulação de dados e formatação
 */

/**
 * Gera um slug seguro a partir de um título e ID
 * @param {string} title - O título a ser transformado em slug
 * @param {string|number} id - O ID a ser adicionado ao slug para unicidade
 * @returns {string} Slug formatado seguro para URLs
 */
export function generateSlug(title: string | null | undefined, id: string | number): string {
  if (!title) return `id-${id}`;
  
  // Normalizar o título: remover acentos, converter para minúsculas
  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  
  // Criar slug a partir do título normalizado
  const slug = normalizedTitle
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-')     // Substituir espaços por hífens
    .replace(/-+/g, '-')      // Evitar hífens duplicados
    .slice(0, 50)             // Limitar o comprimento
    .replace(/^-+|-+$/g, ''); // Remover hífens no início e fim
  
  // Adicionar ID completo ao slug para garantir unicidade
  // Para IDs muito longos como UUIDs, podemos deixar como está - eles são únicos por definição
  return `${slug}-${id}`;
}

/**
 * Extrai o ID numérico ou UUID de um slug
 * @param {string} slug - O slug a ser processado
 * @returns {string|null} O ID extraído ou null se não encontrado
 */
export function extractIdFromSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  
  // Verificar se o slug já é um UUID completo
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    return slug;
  }
  
  // Verificar se o slug já é um ID numérico simples
  if (/^\d+$/.test(slug)) {
    return slug;
  }
  
  // Procurar por UUID no slug (padrão exato do UUID)
  const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  
  // Tentar extrair ID numérico no final do slug
  const numericMatch = slug.match(/-(\d+)$/);
  if (numericMatch) {
    return numericMatch[1];
  }
  
  // Se chegou aqui e o slug contém um hífen, pegar a parte após o último hífen
  // como tentativa final (pode ser parte de um UUID)
  const lastPart = slug.split('-').pop();
  if (lastPart) {
    return lastPart;
  }
  
  // Se nada der certo, retornar o slug original
  return slug;
}

/**
 * Formata a data em português
 * @param {string | Date} dateInput - String de data ISO ou objeto Date
 * @returns {string} Data formatada
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Data inválida";
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    // Verificar se a data é válida após a conversão
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
}

/**
 * Calcula o tempo estimado de leitura
 * @param {string} content - Conteúdo HTML
 * @returns {number} Minutos de leitura
 */
export function calculateReadingTime(content: string | null | undefined): number {
  if (!content) return 0;
  // Remover tags HTML e contar palavras
  const wordCount = content
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter(Boolean) // Remover strings vazias resultantes de múltiplos espaços
    .length;
  
  // Assumir média de 200 palavras por minuto
  return Math.max(1, Math.round(wordCount / 200));
}

/**
 * Cria um resumo de texto a partir de conteúdo HTML
 * @param {string} htmlContent - Conteúdo HTML
 * @param {number} [maxLength=150] - Tamanho máximo do resumo
 * @returns {string} Resumo em texto plano
 */
export const createSummary = (htmlContent: string | null | undefined, maxLength: number = 150): string => {
    // Remover todas as tags HTML
    const textContent = htmlContent?.replace(/<[^>]*>/g, "") || "";

    // Limitar o tamanho e adicionar reticências se necessário
    if (textContent.length <= maxLength) {
        return textContent;
    }

    // Cortar no final de uma palavra
    let summary = textContent.substring(0, maxLength);
    // Garantir que não cortamos no meio de uma palavra se o limite for atingido
    const lastSpaceIndex = summary.lastIndexOf(" ");
    if (lastSpaceIndex > 0) { // Evitar cortar se for uma única palavra longa
        summary = summary.substring(0, lastSpaceIndex);
    }
    return `${summary}...`;
};

// Adicionando a função capitalize
export const capitalize = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Função cn para combinar classes Tailwind com segurança (já usa libs tipadas)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 