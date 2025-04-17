"use client";

import Link from "next/link";
import React from "react";

interface MenuItemProps {
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isButton?: boolean;
  variant?: "primary" | "danger" | "default";
  className?: string;
}

export default function MenuItem({
  href,
  onClick = () => {},
  icon,
  children,
  isActive = false,
  isButton = false,
  variant = "default",
  className = "",
}: MenuItemProps) {
  const variantStyles: Record<string, string> = {
    default: "text-[#484DB5] hover:text-[#383bA5]",
    primary: "text-white bg-[#484DB5] hover:bg-[#383bA5]",
    danger: "text-red-600 hover:bg-red-50",
  };
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
  const hoverEffect = "";
  const finalClasses = `${baseStyles} ${hoverEffect}`.trim();
  if (isButton) {
    return (
      <button onClick={onClick} className={finalClasses} type="button">
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
  return href ? (
    <Link href={href} className={finalClasses} onClick={onClick}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Link>
  ) : (
    <span className={finalClasses} onClick={onClick}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </span>
  );
}
