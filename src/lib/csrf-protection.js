/**
 * Sistema de proteção CSRF
 */

import { NextResponse } from "next/server";
import { logSecurityEvent, SECURITY_EVENTS, SEVERITY_LEVELS } from './security-logger.js';

/**
 * Verifica o Origin header para validar requisições
 * @param {Request} request - Requisição HTTP
 * @returns {boolean} True se o origin é válido
 */
export function validateOrigin(request) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Lista de origins permitidos
    const allowedOrigins = [
        'https://casadosescritores.com.br',
        'https://www.casadosescritores.com.br',
        'http://localhost:3000', // Para desenvolvimento
        'http://127.0.0.1:3000'  // Para desenvolvimento
    ];
    
    // Verificar se é uma requisição do mesmo origin
    if (origin && allowedOrigins.includes(origin)) {
        return true;
    }
    
    // Fallback: verificar referer se origin não estiver presente
    if (!origin && referer) {
        try {
            const refererUrl = new URL(referer);
            const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
            return allowedOrigins.includes(refererOrigin);
        } catch {
            return false;
        }
    }
    
    return false;
}

/**
 * Middleware de proteção CSRF para operações sensíveis
 * @param {Request} request - Requisição HTTP
 * @param {string} operation - Tipo de operação (upload, delete, admin, etc.)
 * @returns {Response|null} Response se bloqueado, null se permitido
 */
export function csrfProtection(request, operation = 'general') {
    // Apenas métodos que modificam dados precisam de proteção CSRF
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    if (!protectedMethods.includes(request.method)) {
        return null; // GET requests não precisam de proteção CSRF
    }
    
    // Verificar Origin/Referer
    if (!validateOrigin(request)) {
        // Log do possível ataque CSRF
        logSecurityEvent(
            SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
            SEVERITY_LEVELS.HIGH,
            {
                operation,
                reason: 'Invalid origin header',
                origin: request.headers.get('origin'),
                referer: request.headers.get('referer'),
                userAgent: request.headers.get('user-agent')
            },
            request
        );
        
        return new Response(
            JSON.stringify({
                error: 'Requisição bloqueada por proteção CSRF'
            }),
            {
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
    
    // Verificar Content-Type para operações que enviam dados
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type');
        
        // Permitir apenas tipos de conteúdo seguros
        const allowedContentTypes = [
            'application/json',
            'multipart/form-data',
            'application/x-www-form-urlencoded'
        ];
        
        if (!contentType || !allowedContentTypes.some(type => contentType.includes(type))) {
            logSecurityEvent(
                SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
                SEVERITY_LEVELS.MEDIUM,
                {
                    operation,
                    reason: 'Invalid content-type',
                    contentType,
                    method: request.method
                },
                request
            );
            
            return new Response(
                JSON.stringify({
                    error: 'Tipo de conteúdo não permitido'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    }
    
    return null; // Permitir requisição
}

/**
 * Adiciona headers de segurança para proteção CSRF
 * @param {Response} response - Resposta HTTP
 * @returns {Response} Resposta com headers de segurança
 */
export function addCSRFHeaders(response) {
    // Adicionar headers SameSite e outras proteções
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
} 