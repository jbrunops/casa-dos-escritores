import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
    // Criamos a resposta de próximo com cabeçalhos adequados
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    try {
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
                        response.cookies.set(name, value, options);
                    },
                    remove(name, options) {
                        response.cookies.set(name, "", { ...options, maxAge: 0 });
                    },
                },
            }
        );

        // Obter sessão
        const {
            data: { session },
        } = await supabase.auth.getSession();

        // Se o usuário está logado, verificar/criar perfil
        if (session?.user) {
            try {
                // Verificar se o perfil existe
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", session.user.id)
                    .single();

                // Se não existir perfil ou ocorrer um erro de "não encontrado", criar um
                if (
                    !profile ||
                    (profileError && profileError.code === "PGRST116")
                ) {
                    // Obter o nome de usuário dos metadados ou usar email como fallback
                    const username =
                        session.user.user_metadata?.username ||
                        session.user.email?.split("@")[0] ||
                        `user_${Math.random().toString(36).substring(2, 7)}`;

                    // Tentar criar o perfil
                    await supabase.from("profiles").insert({
                        id: session.user.id,
                        username,
                        email: session.user.email,
                        role: "user",
                        created_at: new Date().toISOString(),
                    });
                }
            } catch (error) {
                console.error("Middleware: Erro ao sincronizar perfil:", error);
                // Continuar mesmo se houver erro - não bloquear o usuário
            }
        }

        // Verificar role do usuário para rotas administrativas
        if (request.nextUrl.pathname.startsWith("/admin")) {
            // Se não estiver logado, redirecionar para login
            if (!session) {
                return NextResponse.redirect(new URL("/login", request.url));
            }

            // Verificar se é administrador
            try {
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (error) throw error;

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

        // Rotas protegidas padrão
        const protectedRoutes = [
            "/dashboard",
            "/profile/edit",
            "/dashboard/new",
            "/dashboard/edit",
        ];

        const isProtectedRoute = protectedRoutes.some((route) =>
            request.nextUrl.pathname.startsWith(route)
        );

        if (isProtectedRoute && !session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    } catch (e) {
        // Fail-secure: em caso de erro crítico, negar acesso a rotas protegidas
        console.error("Middleware error:", e);
        
        const protectedRoutes = [
            "/dashboard",
            "/profile/edit", 
            "/dashboard/new",
            "/dashboard/edit",
            "/admin"
        ];
        
        const isProtectedRoute = protectedRoutes.some((route) =>
            request.nextUrl.pathname.startsWith(route)
        );
        
        if (isProtectedRoute) {
            console.error(`[SECURITY] Negando acesso a rota protegida devido a erro: ${request.nextUrl.pathname}`);
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return response;
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
