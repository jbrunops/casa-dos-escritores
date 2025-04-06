"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Compass, BookOpen, ChevronDown, Search, User, LogOut, LayoutDashboard, BookMarked } from "lucide-react";
import MobileSeries from "./MobileSeries";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileMenu({ isOpen, onClose, onSearch, searchQuery = '', setSearchQuery }) {
  const menuRef = useRef(null);
  const pathname = usePathname();
  const [showCategories, setShowCategories] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  // Usar o contexto de autenticação
  const { user, profile, signOut } = useAuth();
  
  // Atualizar estado local quando a prop muda
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Impedir scroll quando menu estiver aberto
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);
  
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
  
  // Lidar com a pesquisa no mobile
  const handleMobileSearch = (e) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      if (setSearchQuery) setSearchQuery(localSearchQuery);
      onSearch(e);
      onClose();
    }
  };
  
  // Função para lidar com logout no menu mobile
  const handleMobileLogout = () => {
    onClose();
    signOut();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden">
      <div 
        ref={menuRef}
        className="fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-[#484DB5]">Menu</h2>
          <button 
            onClick={onClose}
            aria-label="Fechar menu"
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Campo de pesquisa mobile */}
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleMobileSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full max-h-[2.5rem] pl-3 pr-10 py-2 border border-[#B7B7B7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#484DB5]"
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
        
        <nav className="p-4">
          <ul className="space-y-4">
            <li>
              <Link 
                href="/"
                onClick={onClose}
                className="block text-[#484DB5] hover:text-[#7A80FB] text-[1rem] font-medium py-2"
              >
                <span>Início</span>
              </Link>
            </li>
            
            <li className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center justify-between w-full text-[#484DB5] hover:text-[#7A80FB] text-[1rem]"
              >
                <div className="flex items-center">
                  <Compass size={18} className="max-h-[1rem] mr-2" />
                  <span>Explorar Categorias</span>
                </div>
                <ChevronDown size={18} className="max-h-[1rem]" />
              </button>
              
              {showCategories && (
                <div className="mt-2 ml-6">
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category}>
                        <Link
                          href={`/categories/${category.toLowerCase().replace(/\s+/g, "-")}`}
                          onClick={onClose}
                          className="block text-[#484DB5] hover:text-[#7A80FB] py-1"
                        >
                          {category}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/categories"
                        onClick={onClose}
                        className="block text-[#484DB5] hover:text-[#7A80FB] font-medium py-1"
                      >
                        Ver Todas
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>
            
            <MobileSeries onClick={onClose} />
            
            <div className="border-t border-gray-100 my-4"></div>
            
            {user ? (
              <>
                {/* Menu para usuário logado */}
                <li>
                  <div className="flex items-center mb-4 py-2">
                    <User size={20} className="text-[#484DB5] mr-2" />
                    <span className="font-medium text-gray-800">{profile?.username || 'Usuário'}</span>
                  </div>
                </li>
                
                <li>
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="flex items-center text-[#484DB5] hover:text-[#7A80FB] py-2"
                  >
                    <LayoutDashboard size={18} className="mr-2" />
                    <span>Meu Painel</span>
                  </Link>
                </li>
                
                <li>
                  <Link
                    href={`/profile/${profile?.username || ''}`}
                    onClick={onClose}
                    className="flex items-center text-[#484DB5] hover:text-[#7A80FB] py-2"
                  >
                    <User size={18} className="mr-2" />
                    <span>Meu Perfil</span>
                  </Link>
                </li>
                
                <li>
                  <Link
                    href="/dashboard/series"
                    onClick={onClose}
                    className="flex items-center text-[#484DB5] hover:text-[#7A80FB] py-2"
                  >
                    <BookMarked size={18} className="mr-2" />
                    <span>Minhas Séries</span>
                  </Link>
                </li>
                
                {/* Mostrar link para administração se o usuário for admin */}
                {profile?.role === 'admin' && (
                  <li>
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className="flex items-center text-[#484DB5] hover:text-[#7A80FB] py-2"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
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
                      <span>Administração</span>
                    </Link>
                  </li>
                )}
                
                <li className="border-t border-gray-100 pt-4 mt-4">
                  <button
                    onClick={handleMobileLogout}
                    className="flex items-center w-full text-red-600 hover:text-red-700 py-2"
                  >
                    <LogOut size={18} className="mr-2" />
                    <span>Sair</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Menu para visitantes */}
                <li>
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex items-center text-[#484DB5] hover:text-[#7A80FB] py-2 font-medium"
                  >
                    <User size={18} className="mr-2" />
                    <span>Entrar</span>
                  </Link>
                </li>
                
                <li>
                  <Link
                    href="/signup"
                    onClick={onClose}
                    className="flex items-center bg-[#484DB5] text-white py-2 px-4 rounded-md hover:bg-[#7A80FB] mt-2"
                  >
                    <span>Cadastre-se</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
} 