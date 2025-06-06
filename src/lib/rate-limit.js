/**
 * Utilitário de Rate Limiting para proteger APIs
 */

import { logRateLimitHit } from './security-logger.js';

// Armazenamento em memória para rate limiting (em produção, usar Redis)
const requests = new Map();

// Configurações de rate limiting por endpoint
const RATE_LIMITS = {
    default: { requests: 100, window: 15 * 60 * 1000 }, // 100 req/15min
    auth: { requests: 5, window: 15 * 60 * 1000 },      // 5 req/15min para auth
    upload: { requests: 10, window: 60 * 1000 },        // 10 req/min para upload
    admin: { requests: 20, window: 60 * 1000 },         // 20 req/min para admin
    comments: { requests: 30, window: 60 * 1000 },      // 30 req/min para comentários
};

/**
 * Verifica se uma requisição deve ser limitada
 * @param {string} identifier - Identificador único (IP + endpoint)
 * @param {string} endpoint - Tipo de endpoint (auth, upload, admin, etc.)
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(identifier, endpoint = 'default') {
    const now = Date.now();
    const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    
    // Limpar entradas expiradas
    cleanupExpiredEntries(now);
    
    // Obter ou criar entrada para este identificador
    if (!requests.has(identifier)) {
        requests.set(identifier, {
            count: 0,
            resetTime: now + limit.window
        });
    }
    
    const entry = requests.get(identifier);
    
    // Se a janela de tempo expirou, resetar contador
    if (now >= entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + limit.window;
    }
    
    // Verificar se excedeu o limite
    if (entry.count >= limit.requests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        };
    }
    
    // Incrementar contador
    entry.count++;
    
    return {
        allowed: true,
        remaining: limit.requests - entry.count,
        resetTime: entry.resetTime,
        retryAfter: 0
    };
}

/**
 * Middleware de rate limiting para Next.js API routes
 * @param {Request} request - Requisição HTTP
 * @param {string} endpoint - Tipo de endpoint
 * @returns {Response|null} Response se limitado, null se permitido
 */
export function rateLimitMiddleware(request, endpoint = 'default') {
    // Obter IP do cliente
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Criar identificador único
    const identifier = `${ip}:${endpoint}`;
    
    // Verificar rate limit
    const result = checkRateLimit(identifier, endpoint);
    
    if (!result.allowed) {
        // Log do rate limit atingido
        const entry = requests.get(identifier);
        logRateLimitHit(endpoint, entry?.count || 0, request);
        
        return new Response(
            JSON.stringify({
                error: 'Muitas requisições. Tente novamente mais tarde.',
                retryAfter: result.retryAfter
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': RATE_LIMITS[endpoint]?.requests || RATE_LIMITS.default.requests,
                    'X-RateLimit-Remaining': result.remaining,
                    'X-RateLimit-Reset': result.resetTime,
                    'Retry-After': result.retryAfter
                }
            }
        );
    }
    
    return null; // Permitir requisição
}

/**
 * Adiciona headers de rate limit à resposta
 * @param {Response} response - Resposta HTTP
 * @param {Object} rateLimitResult - Resultado do rate limiting
 * @param {string} endpoint - Tipo de endpoint
 * @returns {Response} Resposta com headers adicionados
 */
export function addRateLimitHeaders(response, rateLimitResult, endpoint = 'default') {
    const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    
    response.headers.set('X-RateLimit-Limit', limit.requests);
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining);
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime);
    
    return response;
}

/**
 * Remove entradas expiradas do cache
 * @param {number} now - Timestamp atual
 */
function cleanupExpiredEntries(now) {
    for (const [key, entry] of requests.entries()) {
        if (now >= entry.resetTime) {
            requests.delete(key);
        }
    }
    
    // Limitar tamanho do cache (proteção contra memory leak)
    if (requests.size > 10000) {
        const entries = Array.from(requests.entries());
        entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
        
        // Remover 20% das entradas mais antigas
        const toRemove = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
            requests.delete(entries[i][0]);
        }
    }
}

/**
 * Reseta rate limit para um identificador específico (útil para testes)
 * @param {string} identifier - Identificador a ser resetado
 */
export function resetRateLimit(identifier) {
    requests.delete(identifier);
}

/**
 * Obtém estatísticas de rate limiting
 * @returns {Object} Estatísticas do sistema
 */
export function getRateLimitStats() {
    const now = Date.now();
    const stats = {
        totalEntries: requests.size,
        activeEntries: 0,
        expiredEntries: 0,
        topEndpoints: {},
        topIPs: {},
        averageRequestsPerEntry: 0,
        totalRequests: 0,
        limits: RATE_LIMITS
    };

    for (const [key, entry] of requests.entries()) {
        if (now <= entry.resetTime) {
            stats.activeEntries++;
            
            // Extrair endpoint e IP do identificador
            const [ip, endpoint] = key.split(':');
            
            // Contar por endpoint
            stats.topEndpoints[endpoint] = (stats.topEndpoints[endpoint] || 0) + entry.count;
            
            // Contar por IP
            stats.topIPs[ip] = (stats.topIPs[ip] || 0) + entry.count;
            
            stats.totalRequests += entry.count;
        } else {
            stats.expiredEntries++;
        }
    }

    // Calcular média
    if (stats.activeEntries > 0) {
        stats.averageRequestsPerEntry = Math.round(stats.totalRequests / stats.activeEntries);
    }

    // Ordenar top endpoints e IPs
    stats.topEndpoints = Object.entries(stats.topEndpoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    stats.topIPs = Object.entries(stats.topIPs)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    return stats;
} 