"use client";

import Link from "next/link";
import * as React from "react"; // Importar React para tipos

// Definir tipo para as variantes
type MenuItemVariant = "primary" | "danger" | "default";

// Definir interface para as props
interface MenuItemProps {
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isButton?: boolean;
  variant?: MenuItemVariant;
  className?: string;
}

/**
 * Componente de item de menu reutilizável
 */
export default function MenuItem({
  href,
  onClick = () => {},
  icon,
  children,
  isActive = false,
  isButton = false,
  variant = "default",
  className = "",
}: MenuItemProps) { // Aplicar tipo às props
  // Tipar variantStyles
  const variantStyles: Record<MenuItemVariant, string> = {
    default: "text-primary hover:text-primary-600",
    primary: "text-white bg-primary hover:bg-primary-600",
    danger: "text-red-600 hover:bg-red-50",
  };

  // Estilos base comuns para botões e links
  const baseStyles = `
    h-10
    flex
    items-center
    transition-all
    duration-200
    ease-in-out
    rounded-md
    ${isActive ? "font-medium" : ""}
    ${variantStyles[variant] || variantStyles.default}
    ${variant === "primary" ? "px-6 justify-center" : ""}
    ${className}
  `;

  // Efeito hover personalizado (não usando a cor padrão)
  const hoverEffect = "";

  // Classes finais
  const finalClasses = `${baseStyles} ${hoverEffect}`.trim();

  // Renderização como botão ou link
  if (isButton) {
    return (
      <button
        onClick={onClick}
        className={finalClasses}
        type="button" // Adicionar type="button" para clareza
      >
        {icon && <span className="mr-1.5">{icon}</span>}
        {children}
      </button>
    );
  }

  // Renderização como link
  return (
    <Link
      href={href || "#"} // Garantir que href sempre seja string
      onClick={onClick}
      className={finalClasses}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </Link>
  );
} 