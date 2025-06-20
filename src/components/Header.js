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
    Search,
    PlusCircle
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import MenuItem from "./MenuItem";
import DropdownMenu from "./DropdownMenu";
import CategoryDropdown from "./CategoryDropdown";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
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
    const categories = [
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
                        .select("username, role, avatar_url, first_name, last_name")
                        .eq("id", session.user.id)
                        .single();

                    if (error) {
                        console.error("Erro ao buscar perfil:", error);
                        return;
                    }

                    if (data) {
                        setUsername(data.username);
                        setFirstName(data.first_name || "");
                        setLastName(data.last_name || "");
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
                setFirstName("");
                setLastName("");
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
            
            // Configurar subscription para notificações em tempo real
            const subscription = supabase
                .channel("header_notifications")
                .on(
                    "postgres_changes",
                    {
                        event: "*", // INSERT, UPDATE, DELETE
                        schema: "public",
                        table: "notifications",
                    },
                    (payload) => {
                        // Verificar se a notificação é para o usuário atual
                        if (user && payload.new && payload.new.user_id === user.id) {
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
        router.push("/");
    };

    // Nome completo formatado
    const fullName = (firstName || lastName) 
        ? `${firstName} ${lastName}`.trim()
        : username || "Usuário";

    // Configuração dos itens do menu de usuário
    const userMenuItems = user ? [
        {
            label: "Criar Histórias",
            href: "/dashboard/new",
            icon: <PlusCircle size={18} />
        },
        {
            label: "Meu Perfil",
            href: `/profile/${encodeURIComponent(username)}`,
            icon: <User size={18} />,
            description: `@${username}` // Mostra nome de usuário no dropdown
        },
        ...(isAdmin ? [{
            label: "Administração",
            href: "/admin",
            icon: <Settings size={18} />
        }] : []),
        { divider: true },
        {
            label: "Sair",
            onClick: handleSignOut,
            icon: <LogOut size={18} />,
            variant: "danger"
        }
    ] : [
        {
            label: "Entrar",
            href: "/login",
            icon: <LogIn size={18} />
        },
        {
            label: "Cadastrar",
            href: "/signup",
            icon: <UserPlus size={18} />
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
            <div className="content-wrapper flex items-center justify-between">
                {/* Logo e navegação principal agrupados */}
                <div className="flex items-center">
                    {/* Logo */}
                    <div className="text-primary font-bold text-xl mr-6">
                        <Link href="/">Casa Dos Escritores</Link>
                    </div>

                    {/* Navegação principal - apenas desktop */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {/* ADICIONADO: Link para Categorias */}
                        <Link 
                            href="/categories"
                            className="flex items-center text-[#374151] hover:text-primary transition-colors duration-200 font-medium"
                        >
                            <Compass size={20} className="mr-1.5" /> {/* Ícone adicionado */}
                            Explorar
                        </Link>

                        {/* Item de menu Séries */}
                        <Link 
                            href="/series"
                            className="flex items-center text-[#374151] hover:text-primary transition-colors duration-200 font-medium"
                        >
                             <BookOpen size={20} className="mr-1.5" /> {/* Mantendo o ícone e estilo */}
                            Séries
                        </Link>
                    </nav>
                </div>

                {/* Componente de busca */}
                <div className="hidden md:flex flex-1 mx-4 max-w-md">
                    <form onSubmit={handleSearch} className="w-full">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar histórias, séries, autores..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Search size={18} />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Elementos para mobile */}
                <button
                    className="md:hidden text-primary"
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
                                    <MenuItem 
                                        href="/categories"
                                        icon={<Compass size={20} />}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        Explorar
                                    </MenuItem>
                                </li>
                                <li>
                                    <MenuItem 
                                        href="/series"
                                        icon={<BookOpen size={20} />}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        Séries
                                    </MenuItem>
                                </li>
                                <li className="p-3">
                                    <form onSubmit={handleSearch} className="w-full">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Buscar..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                            />
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                                <Search size={18} />
                                            </div>
                                        </div>
                                    </form>
                                </li>
                                {!user && (
                                    <>
                                        <li>
                                            <MenuItem 
                                                href="/login"
                                                icon={<LogIn size={20} />}
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                Entrar
                                            </MenuItem>
                                        </li>
                                        <li>
                                            <MenuItem 
                                                href="/signup"
                                                icon={<UserPlus size={20} />}
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                Cadastrar
                                            </MenuItem>
                                        </li>
                                    </>
                                )}
                                
                                {user && (
                                    <>
                                        <li>
                                            <MenuItem 
                                                href="/dashboard/new"
                                                icon={<PlusCircle size={20} />}
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                Criar Histórias
                                            </MenuItem>
                                        </li>
                                        <li>
                                            <MenuItem 
                                                href={`/profile/${encodeURIComponent(username)}`}
                                                icon={<User size={20} />}
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                {fullName}
                                                <span className="text-xs text-gray-500 block">@{username}</span>
                                            </MenuItem>
                                        </li>
                                        <li>
                                            <MenuItem 
                                                href="/notifications"
                                                icon={<Bell size={20} />}
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                Notificações
                                                {unreadCount > 0 && (
                                                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-[#484DB5] text-white">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </MenuItem>
                                        </li>
                                        {isAdmin && (
                                            <li>
                                                <MenuItem 
                                                    href="/admin"
                                                    icon={<Settings size={20} />}
                                                    onClick={() => setShowMobileMenu(false)}
                                                >
                                                    Administração
                                                </MenuItem>
                                            </li>
                                        )}
                                        <li>
                                            <MenuItem 
                                                isButton
                                                variant="danger"
                                                icon={<LogOut size={20} />}
                                                onClick={() => {
                                                    handleSignOut();
                                                    setShowMobileMenu(false);
                                                }}
                                            >
                                                Sair
                                            </MenuItem>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </>
                )}

                {/* Autenticação / Perfil */}
                <div className="hidden md:flex items-center">
                    {loading ? (
                        <div className="text-sm text-gray-500">Carregando...</div>
                    ) : user ? (
                        <div className="flex items-center">
                            {/* Adicionar o componente NotificationBell */}
                            <NotificationBell />
                            
                            <DropdownMenu
                                trigger={
                                    <button
                                        className="flex items-center text-primary font-semibold h-10 rounded px-2 ml-2"
                                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                                    >
                                        <User size={18} className="mr-1.5" />
                                        <span className="mr-1">{fullName}</span>
                                        <ChevronDown size={16} />
                                    </button>
                                }
                                isOpen={showUserDropdown}
                                setIsOpen={setShowUserDropdown}
                                items={userMenuItems}
                                position="right"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <MenuItem href="/signup">
                                cadastre-se
                            </MenuItem>
                            <MenuItem href="/login" variant="primary">
                                Entrar
                            </MenuItem>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
