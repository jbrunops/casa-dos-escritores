import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
    // Configurar cabeçalhos de segurança
    const headers = new Headers(request.headers);
    
    // Cabeçalhos de segurança importantes
    headers.set("X-DNS-Prefetch-Control", "on");
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "SAMEORIGIN");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    
    // Configuração CORS para APIs
    if (request.nextUrl.pathname.startsWith('/api')) {
        // Aceitar apenas solicitações da mesma origem em produção
        if (process.env.NODE_ENV === 'production') {
            headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "*");
        } else {
            headers.set("Access-Control-Allow-Origin", "*");
        }
        headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        headers.set("Access-Control-Max-Age", "86400");
        
        // Responder a solicitações OPTIONS (preflight)
        if (request.method === "OPTIONS") {
            return new NextResponse(null, { 
                status: 204, 
                headers: headers 
            });
        }
    }

    // Criamos a resposta de próximo com cabeçalhos adequados
    let response = NextResponse.next({
        request: {
            headers: headers,
        },
    });

    try {
        // Verificar se estamos em uma rota que precisa verificar autenticação
        const isProtectedRoute = isProtected(request.nextUrl.pathname);
        const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
        
        // Se não for protegida, retornar direto
        if (!isProtectedRoute && !isAdminRoute) {
            return response;
        }
        
        // Criamos um cliente Supabase do lado do servidor
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name, value, options) {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                    },
                    remove(name, options) {
                        response.cookies.set({
                            name,
                            value: "",
                            ...options,
                        });
                    },
                },
            }
        );

        // Obter sessão com tratamento de erro melhorado
        let session;
        try {
            const { data } = await supabase.auth.getSession();
            session = data.session;
        } catch (error) {
            console.error('Erro ao obter sessão:', error);
            session = null;
        }

        // Verificar se o usuário está logado para rotas protegidas
        if (isProtectedRoute && !session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Verificar role do usuário para rotas administrativas
        if (isAdminRoute) {
            // Se não estiver logado, redirecionar para login
            if (!session) {
                return NextResponse.redirect(new URL("/login", request.url));
            }

            try {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (!profile || profile.role !== "admin") {
                    // Não é administrador, redirecionar para página não autorizada
                    return NextResponse.redirect(
                        new URL("/unauthorized", request.url)
                    );
                }
            } catch (error) {
                console.error("Erro ao verificar permissões:", error);
                return NextResponse.redirect(
                    new URL("/unauthorized", request.url)
                );
            }
        }
    } catch (e) {
        console.error("Middleware error:", e);
    }

    return response;
}

// Função auxiliar para verificar se a rota é protegida
function isProtected(pathname) {
    const protectedRoutes = [
        "/dashboard",
        "/profile/edit",
        "/dashboard/new",
        "/dashboard/edit",
    ];

    return protectedRoutes.some((route) => pathname.startsWith(route));
}

// Atualizar matcher para incluir rotas de admin
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/profile/:path*",
        "/dashboard/new",
        "/dashboard/edit/:path*",
        "/admin/:path*",
    ],
};
