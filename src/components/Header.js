"use client";

import MobileSeries from "./MobileSeries";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useEffect, useState, useRef, useCallback } from "react";
import {
    ChevronDown,
    User,
    LogOut,
    Settings,
    LayoutDashboard,
    Menu,
    Compass,
    BookOpen,
    LogIn,
    UserPlus,
    Bell
} from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const userDropdownRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const supabase = createBrowserClient();

    // Lista de categorias
    const categories = [
        "Fantasia",
        "Romance",
        "Terror",
        "LGBTQ+",
        "Humor",
        "Poesia",
        "Ficção Científica",
        "Brasileiro",
        "Outros",
    ];

    // Verificar se é dispositivo móvel (480px ou menos)
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 480);
        };

        // Verificar no carregamento inicial
        checkMobile();

        // Adicionar listener para redimensionamento
        window.addEventListener("resize", checkMobile);

        // Limpar listener
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        async function getUser() {
            try {
                setLoading(true);
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);

                    // Buscar perfil do usuário com tratamento de erro
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("username, role, avatar_url")
                        .eq("id", session.user.id)
                        .single();

                    if (error) {
                        console.error("Erro ao buscar perfil:", error);
                        return;
                    }

                    if (data) {
                        setUsername(data.username);
                        setIsAdmin(data.role === "admin");
                        setAvatarUrl(data.avatar_url);
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar usuário:", error);
            } finally {
                setLoading(false);
            }
        }

        getUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                getUser();
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setUsername("");
                setIsAdmin(false);
                setAvatarUrl("");
            }
        });

        // Fechar dropdowns quando clicar fora deles
        const handleClickOutside = (event) => {
            if (
                userDropdownRef.current &&
                !userDropdownRef.current.contains(event.target)
            ) {
                setShowUserDropdown(false);
            }
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target)
            ) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            subscription.unsubscribe();
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMobile]);

    // Buscar notificações não lidas - Adicionado para contar notificações
    const fetchUnreadCount = useCallback(async () => {
        try {
            if (!user) return;
            
            const { data, error } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", user.id)
                .eq("is_read", false);
                
            if (error) {
                console.error("Erro ao buscar notificações:", error);
                return;
            }
            
            setUnreadCount(data.length);
        } catch (error) {
            console.error("Erro ao buscar contagem de notificações:", error);
        }
    }, [user, supabase]);
    
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        }
    }, [user, fetchUnreadCount]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setShowMobileMenu(false);
        router.push("/");
    };

    // Ir para categorias (versão mobile)
    const navigateToExplore = () => {
        router.push("/categories");
    };

    // Toggle menu mobile
    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    return (
        <header className="bg-white border-b border-[#E5E7EB] w-full py-3 px-4 md:px-0 mb-[1.875rem]">
            <div className="max-w-[75rem] mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="text-[#484DB5] font-bold text-xl">
                    <Link href="/">Casa Dos Escritores</Link>
                </div>

                {/* Navegação principal - apenas desktop */}
                <nav className="hidden md:flex items-center space-x-6">
                    <div className="relative" ref={categoryDropdownRef}>
                        <button
                            className="flex items-center text-[#484DB5] space-x-1"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            <Compass size={20} className="mr-1" />
                            <span>Explorar</span>
                            <ChevronDown size={16} />
                        </button>
                        
                        {showCategoryDropdown && (
                            <div className="absolute top-full left-0 mt-2 bg-white rounded-md shadow-lg p-3 w-64 z-10 border border-[#E5E7EB]">
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map((category) => (
                                        <Link
                                            key={category}
                                            href={`/categories/${category.toLowerCase().replace(/\s+/g, "-")}`}
                                            className="text-gray-700 hover:text-[#484DB5] px-3 py-2 rounded"
                                            onClick={() => setShowCategoryDropdown(false)}
                                        >
                                            {category}
                                        </Link>
                                    ))}
                                    <Link
                                        href="/categories"
                                        className="col-span-2 text-center text-[#484DB5] mt-2 font-medium"
                                        onClick={() => setShowCategoryDropdown(false)}
                                    >
                                        Ver Todas
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link
                        href="/series"
                        className={`flex items-center ${
                            pathname.startsWith("/series")
                                ? "text-[#484DB5] font-medium"
                                : "text-[#484DB5]"
                        }`}
                    >
                        <BookOpen size={20} className="mr-1" />
                        <span>Séries</span>
                    </Link>
                </nav>

                {/* Elementos para mobile */}
                <button
                    className="md:hidden text-[#484DB5]"
                    onClick={toggleMobileMenu}
                    aria-label="Menu"
                >
                    <Menu size={24} />
                </button>

                {/* Menu mobile */}
                {showMobileMenu && (
                    <>
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-30 z-40"
                            onClick={() => setShowMobileMenu(false)}
                        ></div>
                        <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-lg z-50 p-4">
                            <div className="flex justify-end mb-6">
                                <button onClick={() => setShowMobileMenu(false)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <ul className="space-y-4">
                                <li>
                                    <Link 
                                        href="/categories" 
                                        className="flex items-center text-[#484DB5]"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <Compass size={20} className="mr-2" />
                                        <span>Explorar</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/series" 
                                        className="flex items-center text-[#484DB5]"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <BookOpen size={20} className="mr-2" />
                                        <span>Séries</span>
                                    </Link>
                                </li>
                                {!user && (
                                    <>
                                        <li>
                                            <Link 
                                                href="/login" 
                                                className="flex items-center text-[#484DB5]"
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                <LogIn size={20} className="mr-2" />
                                                <span>Entrar</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                href="/signup" 
                                                className="flex items-center text-[#484DB5]"
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                <UserPlus size={20} className="mr-2" />
                                                <span>Cadastrar</span>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                                {user && (
                                    <>
                                        <li>
                                            <Link 
                                                href="/dashboard" 
                                                className="flex items-center text-[#484DB5]"
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                <LayoutDashboard size={20} className="mr-2" />
                                                <span>Meu Painel</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                href={`/profile/${encodeURIComponent(username)}`} 
                                                className="flex items-center text-[#484DB5]"
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                <User size={20} className="mr-2" />
                                                <span>Meu Perfil</span>
                                            </Link>
                                        </li>
                                        {isAdmin && (
                                            <li>
                                                <Link 
                                                    href="/admin" 
                                                    className="flex items-center text-[#484DB5]"
                                                    onClick={() => setShowMobileMenu(false)}
                                                >
                                                    <Settings size={20} className="mr-2" />
                                                    <span>Administração</span>
                                                </Link>
                                            </li>
                                        )}
                                        <li>
                                            <button 
                                                className="flex items-center text-red-600 w-full text-left"
                                                onClick={() => {
                                                    handleSignOut();
                                                    setShowMobileMenu(false);
                                                }}
                                            >
                                                <LogOut size={20} className="mr-2 text-red-600" />
                                                <span>Sair</span>
                                            </button>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </>
                )}

                {/* Autenticação / Perfil */}
                <div className="hidden md:block">
                    {loading ? (
                        <div className="text-sm text-gray-500">Carregando...</div>
                    ) : user ? (
                        <div className="relative" ref={userDropdownRef}>
                            <button
                                className="flex items-center text-[#484DB5] font-semibold"
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                            >
                                <User size={18} className="mr-1.5" />
                                <span className="mr-1">{username || "Usuário"}</span>
                                <ChevronDown size={16} />
                            </button>

                            {showUserDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md border border-[#E5E7EB] z-10">
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#484DB5]"
                                        onClick={() => setShowUserDropdown(false)}
                                    >
                                        <LayoutDashboard size={18} className="mr-2" />
                                        <span>Meu Painel</span>
                                    </Link>
                                    <Link
                                        href={`/profile/${encodeURIComponent(username)}`}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#484DB5]"
                                        onClick={() => setShowUserDropdown(false)}
                                    >
                                        <User size={18} className="mr-2" />
                                        <span>Meu Perfil</span>
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#484DB5]"
                                            onClick={() => setShowUserDropdown(false)}
                                        >
                                            <Settings size={18} className="mr-2" />
                                            <span>Administração</span>
                                        </Link>
                                    )}
                                    <div className="border-t border-[#E5E7EB] my-1"></div>
                                    <button
                                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut size={18} className="mr-2 text-red-600" />
                                        <span>Sair</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/signup"
                                className="text-[#484DB5]"
                            >
                                cadastre-se
                            </Link>
                            <Link
                                href="/login"
                                className="bg-[#484DB5] text-white px-6 py-2 rounded-md"
                            >
                                Entrar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
