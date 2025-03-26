"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useEffect, useState, useRef } from "react";
import {
    ChevronDown,
    User,
    LogOut,
    Settings,
    LayoutDashboard,
    Menu,
    Search,
    Home,
    Compass,
} from "lucide-react";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const userDropdownRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const supabase = createBrowserClient();

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
                        .select("username, role")
                        .eq("id", session.user.id)
                        .single();

                    if (error) {
                        console.error("Erro ao buscar perfil:", error);
                        return;
                    }

                    if (data) {
                        setUsername(data.username);
                        setIsAdmin(data.role === "admin");
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
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    // Função para lidar com a busca
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    // Garantir que o username seja codificado corretamente para a URL
    const getEncodedUsername = () => {
        if (!username) return "";
        return encodeURIComponent(username.trim());
    };

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

    return (
        <header className="site-header">
            <div className="header-container">
                <div className="site-logo">
                    <Link href="/">Casa Dos Escritores</Link>
                </div>

                <button
                    className="mobile-toggle"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    aria-label="Menu principal"
                >
                    <Menu size={24} />
                </button>

                <nav
                    className={`main-navigation ${
                        showMobileMenu ? "is-active" : ""
                    }`}
                >
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <Link
                                href="/"
                                className={
                                    pathname === "/"
                                        ? "nav-link active"
                                        : "nav-link"
                                }
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <span className="nav-icon-container">
                                    <Home size={16} />
                                </span>
                                <span>Início</span>
                            </Link>
                        </li>
                        <li
                            className="nav-item has-dropdown"
                            ref={categoryDropdownRef}
                            onMouseEnter={() => setShowCategoryDropdown(true)}
                            onMouseLeave={() => setShowCategoryDropdown(false)}
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
                                                    setShowMobileMenu(false);
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
                                                setShowMobileMenu(false);
                                            }}
                                        >
                                            Ver Todas
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </li>
                    </ul>
                </nav>

                <div className="search-container">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Buscar histórias..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-button">
                                <Search size={18} className="search-icon" />
                            </button>
                        </div>
                    </form>
                </div>

                <div className="header-actions">
                    {loading ? (
                        <div className="loading-text">Carregando...</div>
                    ) : user ? (
                        <div
                            className="user-account"
                            ref={userDropdownRef}
                            onMouseEnter={() => setShowUserDropdown(true)}
                            onMouseLeave={() => setShowUserDropdown(false)}
                        >
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
                                        href={`/profile/${getEncodedUsername()}`}
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
                                href="/login"
                                className={`auth-link login ${
                                    pathname === "/login" ? "active" : ""
                                }`}
                            >
                                Entrar
                            </Link>
                            <Link
                                href="/signup"
                                className={`auth-link signup ${
                                    pathname === "/signup" ? "active" : ""
                                }`}
                            >
                                Cadastrar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
