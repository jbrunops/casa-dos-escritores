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
import MenuItem from "./MenuItem";
import DropdownMenu from "./DropdownMenu";
import CategoryDropdown from "./CategoryDropdown";

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
        }
    }, [user, fetchUnreadCount]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setShowMobileMenu(false);
        router.push("/");
    };

    // Configuração dos itens do menu de usuário
    const userMenuItems = user ? [
        {
            label: "Meu Painel",
            href: "/dashboard",
            icon: <LayoutDashboard size={18} />
        },
        {
            label: "Meu Perfil",
            href: `/profile/${encodeURIComponent(username)}`,
            icon: <User size={18} />
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

    return (
        <header className="bg-white border-b border-[#E5E7EB] w-full py-3 px-4 md:px-0 mb-[1.875rem]">
            <div className="max-w-[75rem] mx-auto flex items-center justify-between">
                {/* Logo e navegação principal agrupados */}
                <div className="flex items-center">
                    {/* Logo */}
                    <div className="text-[#484DB5] font-bold text-xl mr-6">
                        <Link href="/">Casa Dos Escritores</Link>
                    </div>

                    {/* Navegação principal - apenas desktop */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {/* Menu de Categorias */}
                        <CategoryDropdown 
                            icon={<Compass size={20} />}
                            isOpen={showCategoryDropdown}
                            setIsOpen={setShowCategoryDropdown}
                            categories={categories}
                            columns={2}
                            footerLink="/categories"
                            footerLabel="Ver Todas"
                        />

                        {/* Item de menu Séries */}
                        <MenuItem 
                            href="/series"
                            icon={<BookOpen size={20} />}
                            isActive={pathname.startsWith("/series")}
                        >
                            Séries
                        </MenuItem>
                    </nav>
                </div>

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
                                                href="/dashboard"
                                                icon={<LayoutDashboard size={20} />}
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                Meu Painel
                                            </MenuItem>
                                        </li>
                                        <li>
                                            <MenuItem 
                                                href={`/profile/${encodeURIComponent(username)}`}
                                                icon={<User size={20} />}
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                Meu Perfil
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
                <div className="hidden md:block">
                    {loading ? (
                        <div className="text-sm text-gray-500">Carregando...</div>
                    ) : user ? (
                        <DropdownMenu
                            trigger={
                                <button
                                    className="flex items-center text-[#484DB5] font-semibold h-10 rounded px-2"
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                >
                                    <User size={18} className="mr-1.5" />
                                    <span className="mr-1">{username || "Usuário"}</span>
                                    <ChevronDown size={16} />
                                </button>
                            }
                            isOpen={showUserDropdown}
                            setIsOpen={setShowUserDropdown}
                            items={userMenuItems}
                            position="right"
                        />
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
