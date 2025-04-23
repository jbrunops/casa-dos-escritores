"use client";

import Link from "next/link";

/**
 * Componente de item de menu reutilizável
 * @param {Object} props - Propriedades do componente
 * @param {string} props.href - Link de destino (opcional, se for botão)
 * @param {function} props.onClick - Função de clique (opcional, padrão vazio)
 * @param {React.ReactNode} props.icon - Ícone do item (opcional)
 * @param {React.ReactNode} props.children - Texto ou conteúdo do item
 * @param {boolean} props.isActive - Se o item está ativo (opcional)
 * @param {boolean} props.isButton - Se o item é um botão em vez de link (opcional)
 * @param {string} props.variant - Variante de estilo: "primary", "danger" ou "default" (opcional, padrão "default")
 * @param {string} props.className - Classes adicionais (opcional)
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
}) {
  // Cores baseadas na variante
  const variantStyles = {
    default: "text-primary hover:text-primary-dark",
    primary: "text-white bg-primary hover:bg-primary-dark",
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
      >
        {icon && <span className="mr-1.5">{icon}</span>}
        {children}
      </button>
    );
  }
  
  // Renderização como link
  return (
    <Link 
      href={href || "#"}
      onClick={onClick}
      className={finalClasses}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </Link>
  );
} 