"use client";

import React, { useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import MenuItem from "./MenuItem";

// Tipo para cada item do menu dropdown
interface DropdownItem {
  label?: ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "primary" | "danger" | "default";
  divider?: boolean;
}

// Props do componente DropdownMenu
interface DropdownMenuProps {
  trigger?: ReactNode;
  icon?: ReactNode;
  label?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  items: DropdownItem[];
  position?: "left" | "right";
  className?: string;
  contentClassName?: string;
}

export default function DropdownMenu({
  trigger,
  icon,
  label,
  isOpen,
  setIsOpen,
  items,
  position = "left",
  className = "",
  contentClassName = "",
}: DropdownMenuProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  // Reverter trigger padrão para usar MenuItem
  const triggerElement = trigger || (
    <MenuItem
      isButton
      onClick={() => setIsOpen(!isOpen)}
      icon={icon}
      className="space-x-1"
    >
      {label && <span>{label}</span>}
      <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </MenuItem>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {triggerElement}

      {isOpen && (
        // Reverter estilos do container do dropdown
        <div
          className={`
            absolute top-full mt-2 z-10
            ${position === "right" ? "right-0" : "left-0"}
            bg-white rounded-md shadow-lg
            p-3 border border-border
            min-w-[12rem]
            ${contentClassName}
          `}
        >
          <div className="flex flex-col space-y-1">
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.divider && idx > 0 && (
                  <div className="border-t border-border my-1"></div>
                )}
                {!item.divider && (
                  <MenuItem
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.onClick) item.onClick();
                    }}
                    icon={item.icon}
                    isButton={!item.href}
                    variant={item.variant ?? 'default'}
                    className="px-3 py-2 rounded hover:bg-gray-50 text-sm w-full justify-start"
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