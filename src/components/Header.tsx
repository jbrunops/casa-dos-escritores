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
    Bell,
    Search
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import MenuItem from "./MenuItem";
import DropdownMenu from "./DropdownMenu";
import CategoryDropdown from "./CategoryDropdown";
import { generateSlug } from "@/lib/utils";

// Define a simple Category type matching CategoryDropdown expectation
interface Category {
    name: string;
    slug: string;
}

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
    const [searchTerm, setSearchTerm] = useState("");
    const mobileMenuRef = useRef(null);
    const supabase = createBrowserClient();

    // Lista de categorias
    const categoryNames = [
        "Fantasia",
        "Romance",
        "Terror",
        "LGBTQ+",
        "Humor",
        "Poesia",
        "Ficção Científica",
        "Brasileiro",
        "Anime",
        "Outros",
    ];
    const categories: Category[] = categoryNames.map(name => ({
        name: name,
        slug: name.toLowerCase().replace(/\+/g, 'plus').replace(/ /g, '-')
    }));

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

        return () => {
            subscription.unsubscribe();
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
            
            const subscription = supabase
                .channel("header_notifications")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "notifications",
                    },
                    (payload: any) => { // Use 'any' for payload or a more specific type if available
                        // CORRIGIDO: Adicionar checagem segura para payload.new e payload.new.user_id
                        if (user && payload?.new?.user_id === user.id) {
                            fetchUnreadCount();
                        }
                    }
                )
                .subscribe();
                
            return () => {
                subscription.unsubscribe();
            };
        }
    }, [user, fetchUnreadCount, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setShowMobileMenu(false);
        setShowUserDropdown(false);
        router.push("/");
    };

    // Configuração dos itens do menu de usuário - Remover tipagem explícita
    const userMenuItems = user ? [
        {
            label: "Meu Painel",
            href: "/dashboard",
            icon: <LayoutDashboard size={18} />,
            variant: "default" as const, // Usar 'as const' para tipo literal
        },
        {
            label: "Meu Perfil",
            href: username ? `/profile/${encodeURIComponent(username)}` : '#',
            icon: <User size={18} />,
            variant: "default" as const,
        },
        ...(isAdmin ? [{
            label: "Administração",
            href: "/admin",
            icon: <Settings size={18} />,
            variant: "default" as const,
        }] : []),
        { divider: true }, 
        {
            label: "Sair",
            onClick: handleSignOut,
            icon: <LogOut size={18} />,
            variant: "danger" as const, // Usar 'as const'
        }
    ] : [
        {
            label: "Entrar",
            href: "/login",
            icon: <LogIn size={18} />,
            variant: "default" as const,
        },
        {
            label: "Cadastrar",
            href: "/signup",
            icon: <UserPlus size={18} />,
            variant: "default" as const,
        }
    ];

    // Toggle menu mobile
    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    // Função para lidar com a pesquisa
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim() !== "") {
            router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
            setSearchTerm("");
        }
    };

    return (
        <header className="bg-white border-b border-border w-full py-3 mb-[1.875rem] relative z-30">
            <div className="max-w-[75rem] mx-auto flex items-center justify-between px-4 sm:px-0">
                {/* Logo e navegação principal agrupados */}
                <div className="flex items-center">
                    {/* Logo */}
                    <div className="text-primary font-bold text-xl mr-6">
                        <Link href="/">Casa Dos Escritores</Link>
                    </div>

                    {/* Navegação principal - apenas desktop */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {/* Menu de Categorias - Passando state correto */}
                        <CategoryDropdown
                            categories={categories} // Passa o array formatado corretamente
                            isOpen={showCategoryDropdown}
                            setIsOpen={setShowCategoryDropdown}
                            buttonLabel="Categorias"
                        />

                        {/* Explorar */}
                        <Link
                            href="/explore"
                            className={`text-text hover:text-primary transition-colors ${pathname === "/explore" ? "text-primary font-semibold" : ""}`}
                        >
                            Explorar
                        </Link>
                        
                        {/* Escrever (apenas se logado) */}
                        {user && (
                            <Link
                                href="/write"
                                className={`text-text hover:text-primary transition-colors ${pathname === "/write" ? "text-primary font-semibold" : ""}`}
                            >
                                Escrever
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Barra de pesquisa, ícones de usuário e menu mobile */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Barra de Pesquisa (Desktop) */}
                    <form onSubmit={handleSearch} className="hidden md:block relative">
                        <input
                            type="text"
                            placeholder="Buscar obras, autores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border border-border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-64"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary">
                            <Search size={18} />
                        </button>
                    </form>

                    {/* Ícones (Desktop) */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <NotificationBell />
                                <DropdownMenu 
                                    isOpen={showUserDropdown}
                                    setIsOpen={setShowUserDropdown}
                                    trigger={(
                                        <button 
                                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                                            className="flex items-center space-x-2 text-text hover:text-primary"
                                        >
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-border" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User size={18} className="text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium hidden lg:inline">{username || 'Usuário'}</span>
                                            <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                    items={userMenuItems}
                                    position="right"
                                />
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link href="/login" className="px-4 py-2 text-sm font-medium text-text bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                                    Entrar
                                </Link>
                                <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors">
                                    Cadastrar
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Ícone do Menu Mobile */}
                    <div className="md:hidden flex items-center space-x-2">
                        {user && <NotificationBell />}
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 rounded-md text-text hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        >
                            <span className="sr-only">Abrir menu principal</span>
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Menu Mobile */} 
            {showMobileMenu && (
                <div 
                    ref={mobileMenuRef} 
                    className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-lg"
                    style={{ maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto' }} // Limita altura e adiciona scroll
                >
                    <div className="px-4 pt-4 pb-3 space-y-3">
                        {/* Barra de Pesquisa (Mobile) */}
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Buscar obras, autores..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                             <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary">
                                <Search size={18} />
                            </button>
                        </form>

                        {/* Itens de Navegação Mobile */}
                        <Link href="/explore" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-base font-medium text-text rounded-md hover:bg-gray-100 hover:text-primary">
                            <Compass size={20} className="mr-3" />
                            Explorar
                        </Link>

                        {/* Categorias Mobile (Expansível) */}
                        <MobileSeries />
                        
                        {user && (
                            <Link href="/write" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-base font-medium text-text rounded-md hover:bg-gray-100 hover:text-primary">
                                <BookOpen size={20} className="mr-3" />
                                Escrever
                            </Link>
                        )}
                        
                         {/* Seção do Usuário Mobile */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                             {user ? (
                                <div className="space-y-1">
                                    <div className="flex items-center px-3 py-2 mb-2">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover mr-3 border border-border" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                                <User size={22} className="text-gray-500" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-base font-medium text-gray-800">{username || 'Usuário'}</div>
                                            <div className="text-sm font-medium text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    {/* Itens do menu de usuário mapeados */} 
                                    {userMenuItems.filter(item => !item.divider).map((item, index) => (
                                        <MenuItem
                                            key={index}
                                            href={item.href}
                                            onClick={() => {
                                                if (item.onClick) item.onClick();
                                                setShowMobileMenu(false);
                                            }}
                                            icon={item.icon}
                                            variant={item.variant ?? 'default'}
                                            className="w-full text-left px-3 py-2 text-base font-medium text-text rounded-md hover:bg-gray-100 hover:text-primary"
                                        >
                                            {item.label}
                                        </MenuItem>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Link href="/login" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-center w-full px-4 py-2 text-base font-medium text-text bg-gray-100 rounded-md hover:bg-gray-200">
                                        <LogIn size={20} className="mr-2"/>
                                        Entrar
                                    </Link>
                                    <Link href="/signup" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-center w-full px-4 py-2 text-base font-medium text-white bg-primary rounded-md hover:bg-primary-dark">
                                        <UserPlus size={20} className="mr-2"/>
                                        Cadastrar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
} 