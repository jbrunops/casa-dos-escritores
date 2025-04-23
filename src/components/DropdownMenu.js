"use client";

import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import MenuItem from "./MenuItem";

/**
 * Componente de menu dropdown reutilizável
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.trigger - Elemento que aciona o dropdown
 * @param {React.ReactNode} props.icon - Ícone do trigger (opcional)
 * @param {string} props.label - Texto do trigger
 * @param {boolean} props.isOpen - Estado de aberto/fechado
 * @param {function} props.setIsOpen - Função para alterar estado
 * @param {Object[]} props.items - Itens do menu
 * @param {string} props.position - Posição do dropdown: "left", "right" (padrão: "left")
 * @param {string} props.className - Classes adicionais (opcional)
 */
export default function DropdownMenu({
  trigger,
  icon,
  label,
  isOpen,
  setIsOpen,
  items,
  position = "left",
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

  // Se for fornecido um trigger personalizado, use-o
  const triggerElement = trigger || (
    <MenuItem 
      isButton 
      onClick={() => setIsOpen(!isOpen)}
      icon={icon}
      className="space-x-1"
    >
      <span>{label}</span>
      <ChevronDown size={16} />
    </MenuItem>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {triggerElement}
      
      {isOpen && (
        <div 
          className={`
            absolute top-full mt-2 
            ${position === "right" ? "right-0" : "left-0"} 
            bg-white rounded-md shadow-lg 
            p-3 z-10 
            border border-border
            min-w-[12rem]
          `}
        >
          <div className="flex flex-col space-y-1">
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.divider ? (
                  <div className="border-t border-border my-1"></div>
                ) : (
                  <MenuItem
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.onClick) item.onClick();
                    }}
                    icon={item.icon}
                    isButton={!item.href}
                    variant={item.variant}
                    className="px-3 py-2 rounded hover:bg-gray-50"
                  >
                    {item.label}
                  </MenuItem>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 