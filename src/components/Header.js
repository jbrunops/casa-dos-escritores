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
        <header className="site-header">
            <div className="header-container">
                {/* ELEMENTOS MOBILE - só serão exibidos quando a tela for 480px ou menos */}
                <button
                    className="mobile-explore-btn"
                    onClick={navigateToExplore}
                    aria-label="Explorar categorias"
                >
                    <Compass size={28} />
                </button>

                {/* ELEMENTOS DESKTOP E MOBILE */}
                <div className="site-logo">
                    <Link href="/">Casa Dos Escritores</Link>
                </div>

                {/* Elemento de notificação mobile - posicionado entre explorar e avatar */}
                {user && isMobile && (
                    <div
                        style={{
                            position: "absolute",
                            right: "45px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 20,
                        }}
                        className="mobile-notification-container"
                    >
                        <NotificationBell />
                    </div>
                )}

                {/* Elementos apenas para mobile */}
                <button
                    className="mobile-menu-btn"
                    onClick={toggleMobileMenu}
                    aria-label="Menu de navegação"
                >
                    {user ? (
                        <div style={{ position: "relative" }}>
                            <div className="mobile-user-avatar" style={{ zIndex: 1 }}>
                                {avatarUrl ? (
                                    <img 
                                        src={avatarUrl} 
                                        alt={username || "Usuário"} 
                                        className="avatar-image"
                                    />
                                ) : (
                                    username.charAt(0).toUpperCase()
                                )}
                            </div>
                            {unreadCount > 0 && !showMobileMenu && (
                                <div className="mobile-avatar-badge-container" style={{ zIndex: 2 }}>
                                    <span className="mobile-avatar-badge">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Menu size={28} />
                    )}
                </button>

                {/* Menu mobile dropdown - Ajustado para garantir que seja clicável */}
                <div
                    className={`mobile-menu-dropdown ${
                        showMobileMenu ? "is-active" : ""
                    }`}
                    ref={mobileMenuRef}
                    style={{ pointerEvents: 'auto' }} // Garantir que eventos de clique sejam capturados
                >
                    <ul className="mobile-menu-list">
                        {!user ? (
                            /* Usuário não logado */
                            <>
                                <li className="mobile-menu-item">
                                    <Link
                                        href="/login"
                                        className="mobile-menu-link"
                                        onClick={() => {
                                            setShowMobileMenu(false);
                                        }}
                                    >
                                        <div className="mobile-menu-link-content">
                                            <LogIn size={20} className="mobile-menu-icon" />
                                            <span>Entrar</span>
                                        </div>
                                    </Link>
                                </li>
                                <li className="mobile-menu-item">
                                    <Link
                                        href="/signup"
                                        className="mobile-menu-link"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <div className="mobile-menu-link-content">
                                            <UserPlus size={20} className="mobile-menu-icon" />
                                            <span>Cadastrar</span>
                                        </div>
                                    </Link>
                                </li>
                                {/* Adicione esta linha */}
                                <MobileSeries
                                    onClick={() => setShowMobileMenu(false)}
                                />
                            </>
                        ) : (
                            /* Usuário logado */
                            <>
                                <li className="mobile-menu-item">
                                    <Link
                                        href="/dashboard"
                                        className="mobile-menu-link"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <div className="mobile-menu-link-content">
                                            <LayoutDashboard size={20} className="mobile-menu-icon" />
                                            <span>Meu Painel</span>
                                        </div>
                                    </Link>
                                </li>
                                {/* Link para notificações */}
                                <li className="mobile-menu-item">
                                    <Link
                                        href="/notifications"
                                        className="mobile-menu-link"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <div className="mobile-menu-link-content">
                                            <Bell size={20} className="mobile-menu-icon" />
                                            <span>Notificações</span>
                                            {unreadCount > 0 && (
                                                <span className="menu-notification-badge">
                                                    {unreadCount > 9 ? "9+" : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                                {/* Adicione esta linha */}
                                <MobileSeries
                                    onClick={() => setShowMobileMenu(false)}
                                />
                                <li className="mobile-menu-item">
                                    <Link
                                        href={`/profile/${encodeURIComponent(
                                            username
                                        )}`}
                                        className="mobile-menu-link"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <div className="mobile-menu-link-content">
                                            <User size={20} className="mobile-menu-icon" />
                                            <span>Meu Perfil</span>
                                        </div>
                                    </Link>
                                </li>
                                {isAdmin && (
                                    <li className="mobile-menu-item">
                                        <Link
                                            href="/admin"
                                            className="mobile-menu-link"
                                            onClick={() =>
                                                setShowMobileMenu(false)
                                            }
                                        >
                                            <div className="mobile-menu-link-content">
                                                <Settings size={20} className="mobile-menu-icon" />
                                                <span>Administração</span>
                                            </div>
                                        </Link>
                                    </li>
                                )}
                                <li className="mobile-menu-item">
                                    <button
                                        className="mobile-menu-link"
                                        onClick={handleSignOut}
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            background: "none",
                                            border: "none",
                                        }}
                                    >
                                        <div className="mobile-menu-link-content">
                                            <LogOut size={20} className="mobile-menu-icon" />
                                            <span>Sair</span>
                                        </div>
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Overlay para fechar o menu ao clicar fora */}
                <div 
                    className={`mobile-menu-overlay ${showMobileMenu ? "is-active" : ""}`}
                    onClick={() => showMobileMenu ? setShowMobileMenu(false) : null}
                    style={{ pointerEvents: showMobileMenu ? 'auto' : 'none' }}
                ></div>

                {/* ELEMENTOS DESKTOP */}
                <nav className="main-navigation">
                    <ul className="nav-menu">
                        <li
                            className="nav-item has-dropdown"
                            ref={categoryDropdownRef}
                        >
                            <button
                                className="nav-link dropdown-toggle"
                                onClick={() =>
                                    setShowCategoryDropdown(
                                        !showCategoryDropdown
                                    )
                                }
                            >
                                <span className="nav-icon-container">
                                    <Compass size={16} />
                                </span>
                                <span>Explorar</span>
                                <span className="dropdown-icon-container">
                                    <ChevronDown
                                        size={16}
                                        className="dropdown-icon"
                                    />
                                </span>
                            </button>

                            {showCategoryDropdown && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-grid">
                                        {categories.map((category) => (
                                            <Link
                                                key={category}
                                                href={`/categories/${category
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")}`}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setShowCategoryDropdown(
                                                        false
                                                    );
                                                }}
                                            >
                                                {category}
                                            </Link>
                                        ))}
                                        <Link
                                            href="/categories"
                                            className="dropdown-item view-all"
                                            onClick={() => {
                                                setShowCategoryDropdown(false);
                                            }}
                                        >
                                            Ver Todas
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </li>

                        {/* ADICIONE O NOVO ITEM DE MENU AQUI */}
                        <li className="nav-item">
                            <Link
                                href="/series"
                                className={
                                    pathname.startsWith("/series")
                                        ? "nav-link active"
                                        : "nav-link"
                                }
                            >
                                <span className="nav-icon-container">
                                    <BookOpen size={16} />
                                </span>
                                <span>Séries</span>
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="search-container">
                    {/* Seu formulário de busca existente */}
                </div>

                {/* Adicionar NotificationBell apenas na versão desktop */}
                {user && !isMobile && <NotificationBell />}

                <div className="header-actions">
                    {loading ? (
                        <div className="loading-text">Carregando...</div>
                    ) : user ? (
                        <div className="user-account" ref={userDropdownRef}>
                            <button
                                className={`account-button ${
                                    showUserDropdown ? "is-active" : ""
                                }`}
                                onClick={() =>
                                    setShowUserDropdown(!showUserDropdown)
                                }
                            >
                                <span className="account-name">
                                    {username || "Usuário"}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className="dropdown-icon"
                                />
                            </button>

                            {showUserDropdown && (
                                <div className="account-dropdown">
                                    <Link
                                        href="/dashboard"
                                        className={`account-link ${
                                            pathname.startsWith("/dashboard")
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setShowUserDropdown(false)
                                        }
                                    >
                                        <LayoutDashboard
                                            size={18}
                                            className="account-icon"
                                        />
                                        <span>Meu Painel</span>
                                    </Link>

                                    <Link
                                        href={`/profile/${encodeURIComponent(
                                            username
                                        )}`}
                                        className={`account-link ${
                                            pathname.startsWith("/profile") &&
                                            !pathname.startsWith(
                                                "/profile/edit"
                                            )
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setShowUserDropdown(false)
                                        }
                                    >
                                        <User
                                            size={18}
                                            className="account-icon"
                                        />
                                        <span>Meu Perfil</span>
                                    </Link>

                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            className={`account-link ${
                                                pathname.startsWith("/admin")
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setShowUserDropdown(false)
                                            }
                                        >
                                            <Settings
                                                size={18}
                                                className="account-icon"
                                            />
                                            <span>Administração</span>
                                        </Link>
                                    )}

                                    <div className="account-divider"></div>

                                    <button
                                        onClick={handleSignOut}
                                        className="account-link logout"
                                    >
                                        <LogOut
                                            size={18}
                                            className="account-icon"
                                        />
                                        <span>Sair</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-actions">
                            <Link
                                href="/signup"
                                className={`auth-link signup ${
                                    pathname === "/signup" ? "active" : ""
                                }`}
                            >
                                Cadastrar
                            </Link>
                            <Link
                                href="/login"
                                className={`auth-link login ${
                                    pathname === "/login" ? "active" : ""
                                }`}
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
