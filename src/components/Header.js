"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Compass, BookOpen, Search, Menu, User, LogOut, LayoutDashboard, BookMarked } from "lucide-react";
import MobileMenu from "./MobileMenu";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const categoryDropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef(null);
    
    // Usar o contexto de autenticação
    const { user, profile, loading, signOut } = useAuth();
    
    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    // Fechar user dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
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
    
    // Lidar com o envio do formulário de pesquisa
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(""); // Limpar o campo após pesquisa
        }
    };
    
    // Lidar com atalho de teclado para pesquisa
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Detectar Ctrl+K ou Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <>
            <header className="w-full border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-[75rem] px-4 flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link 
                            href="/" 
                            className="text-[#484DB5] hover:text-[#7A80FB] text-[1.25rem] font-bold"
                        >
                            Casa Dos Escritores
                        </Link>
                    </div>

                    <nav className="hidden md:block ml-10">
                        <ul className="flex items-center space-x-6">
                            <li ref={categoryDropdownRef} className="relative">
                                <button
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    className="flex items-center text-[#484DB5] hover:text-[#7A80FB] text-[1rem]"
                                >
                                    <span className="mr-1">
                                        <Compass size={16} className="max-h-[1rem]" />
                                    </span>
                                    <span>Explorar</span>
                                    <ChevronDown size={16} className="ml-1 max-h-[1rem]" />
                                </button>

                                {showCategoryDropdown && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                                        <div className="py-1">
                                            {categories.map((category) => (
                                                <Link
                                                    key={category}
                                                    href={`/categories/${category
                                                        .toLowerCase()
                                                        .replace(/\s+/g, "-")}`}
                                                    onClick={() => setShowCategoryDropdown(false)}
                                                    className="block px-4 py-2 text-[#484DB5] hover:text-[#7A80FB] hover:bg-gray-50"
                                                >
                                                    {category}
                                                </Link>
                                            ))}
                                            <Link
                                                href="/categories"
                                                onClick={() => setShowCategoryDropdown(false)}
                                                className="block px-4 py-2 text-[#484DB5] hover:text-[#7A80FB] hover:bg-gray-50 font-medium"
                                            >
                                                Ver Todas
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </li>

                            <li>
                                <Link
                                    href="/series"
                                    className="flex items-center text-[#484DB5] hover:text-[#7A80FB] text-[1rem]"
                                >
                                    <span className="mr-1">
                                        <BookOpen size={16} className="max-h-[1rem]" />
                                    </span>
                                    <span>Séries</span>
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div className="hidden md:block mx-auto">
                        <form onSubmit={handleSearchSubmit}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Pesquisar... (Ctrl+K)"
                                    aria-label="Pesquisar no site"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    ref={searchInputRef}
                                    className="w-[21.3rem] max-h-[2.5rem] pl-3 pr-10 py-2 border border-[#B7B7B7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#484DB5]"
                                />
                                <button 
                                    type="submit"
                                    aria-label="Buscar"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B7B7B7]"
                                >
                                    <Search size={20} className="max-h-[1rem]" />
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        {!loading && (
                            <>
                                {user ? (
                                    <div ref={userDropdownRef} className="relative">
                                        <button
                                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                                            className="flex items-center text-[#484DB5] hover:text-[#7A80FB] text-[1rem] font-medium"
                                        >
                                            <User size={18} className="mr-1" />
                                            <span>{profile?.username || 'Perfil'}</span>
                                            <ChevronDown size={16} className="ml-1 max-h-[1rem]" />
                                        </button>

                                        {showUserDropdown && (
                                            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                                                <div className="py-1">
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setShowUserDropdown(false)}
                                                        className="flex items-center px-4 py-2 text-[#484DB5] hover:text-[#7A80FB] hover:bg-gray-50"
                                                    >
                                                        <LayoutDashboard size={16} className="mr-2" />
                                                        Meu Painel
                                                    </Link>
                                                    <Link
                                                        href={`/profile/${profile?.username || ''}`}
                                                        onClick={() => setShowUserDropdown(false)}
                                                        className="flex items-center px-4 py-2 text-[#484DB5] hover:text-[#7A80FB] hover:bg-gray-50"
                                                    >
                                                        <User size={16} className="mr-2" />
                                                        Meu Perfil
                                                    </Link>
                                                    <Link
                                                        href="/dashboard/series"
                                                        onClick={() => setShowUserDropdown(false)}
                                                        className="flex items-center px-4 py-2 text-[#484DB5] hover:text-[#7A80FB] hover:bg-gray-50"
                                                    >
                                                        <BookMarked size={16} className="mr-2" />
                                                        Minhas Séries
                                                    </Link>
                                                    {/* Mostrar link para administração se o usuário for admin */}
                                                    {profile?.role === 'admin' && (
                                                        <Link
                                                            href="/admin"
                                                            onClick={() => setShowUserDropdown(false)}
                                                            className="flex items-center px-4 py-2 text-[#484DB5] hover:text-[#7A80FB] hover:bg-gray-50"
                                                        >
                                                            <svg 
                                                                xmlns="http://www.w3.org/2000/svg" 
                                                                width="16" 
                                                                height="16" 
                                                                viewBox="0 0 24 24" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                strokeWidth="2" 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                className="mr-2"
                                                            >
                                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                                                <circle cx="9" cy="7" r="4"></circle>
                                                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                            </svg>
                                                            Administração
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setShowUserDropdown(false);
                                                            signOut();
                                                        }}
                                                        className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:text-red-700 hover:bg-gray-50"
                                                    >
                                                        <LogOut size={16} className="mr-2" />
                                                        Sair
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <Link 
                                            href="/signup"
                                            className="text-[#484DB5] hover:text-[#7A80FB] text-[1rem] font-bold"
                                        >
                                            Cadastre-se
                                        </Link>
                                        <Link 
                                            href="/login"
                                            className="bg-[#484DB5] hover:bg-[#7A80FB] text-white max-h-[2.5rem] w-[7.5rem] flex items-center justify-center py-2 rounded-md transition-colors"
                                        >
                                            <span className="font-bold">Entrar</span>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    
                    {/* Botão do menu mobile */}
                    <button 
                        className="md:hidden text-[#484DB5]"
                        onClick={() => setShowMobileMenu(true)}
                        aria-label="Menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>
            
            {/* Menu mobile */}
            <MobileMenu 
                isOpen={showMobileMenu} 
                onClose={() => setShowMobileMenu(false)}
                onSearch={handleSearchSubmit}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                user={user}
                profile={profile}
                onLogout={signOut}
            />
        </>
    );
}
