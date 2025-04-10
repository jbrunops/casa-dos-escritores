"use client";

import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import MenuItem from "./MenuItem";

/**
 * Componente de dropdown para categorias com suporte a múltiplas colunas
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.icon - Ícone do trigger
 * @param {boolean} props.isOpen - Estado de aberto/fechado
 * @param {function} props.setIsOpen - Função para alterar estado
 * @param {string[]} props.categories - Lista de categorias
 * @param {number} props.columns - Número de colunas (padrão: 2)
 * @param {string} props.footerLink - Link do rodapé (opcional)
 * @param {string} props.footerLabel - Texto do rodapé (opcional)
 * @param {string} props.className - Classes adicionais (opcional)
 */
export default function CategoryDropdown({
  icon,
  isOpen,
  setIsOpen,
  categories,
  columns = 2,
  footerLink,
  footerLabel,
  className = "",
}) {
  const dropdownRef = useRef(null);

  // Fecha o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <MenuItem 
        isButton 
        onClick={() => setIsOpen(!isOpen)} 
        icon={icon}
        className="space-x-1"
      >
        <span>Explorar</span>
        <ChevronDown size={16} />
      </MenuItem>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-md shadow-lg p-3 z-10 border border-[#E5E7EB] min-w-[16rem]">
          <div className={`grid grid-cols-${columns} gap-2`}>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/categories/${category.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-gray-700 hover:bg-gray-100 hover:text-[#484DB5] transition-all duration-200 px-3 py-2 rounded"
                onClick={() => setIsOpen(false)}
              >
                {category}
              </Link>
            ))}
            
            {footerLink && footerLabel && (
              <Link
                href={footerLink}
                className={`col-span-${columns} text-center text-[#484DB5] mt-2 font-medium hover:bg-gray-50 rounded px-2 py-1`}
                onClick={() => setIsOpen(false)}
              >
                {footerLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 