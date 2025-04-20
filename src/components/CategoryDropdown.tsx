"use client";

import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import MenuItem from "./MenuItem";
import { generateSlug } from "@/lib/utils"; // Manter import

interface Category {
  name: string;
  slug: string;
}

interface CategoryDropdownProps {
  icon?: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  categories: Category[]; // Usar interface Category
  columns?: 1 | 2 | 3 | 4;
  footerLink?: string;
  footerLabel?: string;
  className?: string;
  buttonLabel?: string;
}

export default function CategoryDropdown({
  icon,
  isOpen,
  setIsOpen,
  categories,
  columns = 2,
  footerLink,
  footerLabel,
  className = "",
  buttonLabel = "Explorar",
}: CategoryDropdownProps) {
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

  const gridColsClass = `grid-cols-${columns}`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <MenuItem
        isButton
        onClick={() => setIsOpen(!isOpen)}
        icon={icon}
        className="space-x-1"
      >
        <span>{buttonLabel}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </MenuItem>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-md shadow-lg p-3 z-10 border border-border min-w-[16rem]">
          <div className={`grid ${gridColsClass} gap-2`}>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="text-gray-700 hover:bg-gray-100 hover:text-primary transition-all duration-200 px-3 py-2 rounded text-sm truncate"
                onClick={() => setIsOpen(false)}
                title={category.name}
              >
                {category.name}
              </Link>
            ))}

            {footerLink && footerLabel && (
              <Link
                href={footerLink}
                className={`col-span-${columns} text-center text-primary mt-2 font-medium rounded px-2 py-1 text-sm`}
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