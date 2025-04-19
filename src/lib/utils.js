/**
 * Utilitários para manipulação de dados e formatação
 */

/**
 * Gera um slug seguro a partir de um título e ID
 * @param {string} title - O título a ser transformado em slug
 * @param {string|number} id - O ID a ser adicionado ao slug para unicidade
 * @returns {string} Slug formatado seguro para URLs
 */
export function generateSlug(title, id) {
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
export function extractIdFromSlug(slug) {
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
 * @param {string} dateString - String de data ISO
 * @returns {string} Data formatada
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calcula o tempo estimado de leitura
 * @param {string} content - Conteúdo HTML
 * @returns {number} Minutos de leitura
 */
export function calculateReadingTime(content) {
  // Remover tags HTML e contar palavras
  const wordCount = content
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
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
export const createSummary = (htmlContent, maxLength = 150) => {
    // Remover todas as tags HTML
    const textContent = htmlContent?.replace(/<[^>]*>/g, "") || "";

    // Limitar o tamanho e adicionar reticências se necessário
    if (textContent.length <= maxLength) {
        return textContent;
    }

    // Cortar no final de uma palavra
    let summary = textContent.substring(0, maxLength);
    summary = summary.substring(0, summary.lastIndexOf(" "));
    return `${summary}...`;
};

// Adicionando a função capitalize
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
