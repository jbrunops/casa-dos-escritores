"use client";

import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import MenuItem from "./MenuItem";

interface CategoryDropdownProps {
  icon?: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  categories: string[];
  columns?: number;
  footerLink?: string;
  footerLabel?: string;
  className?: string;
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
}: CategoryDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
                href={`/categories/${category}`}
                key={category}
                className="block px-2 py-1 rounded hover:bg-[#484DB5]/10 text-sm text-gray-700"
              >
                {category}
              </Link>
            ))}
          </div>
          {footerLink && footerLabel && (
            <div className="mt-3 pt-2 border-t border-[#E5E7EB]">
              <Link
                href={footerLink}
                className="block text-center text-xs text-[#484DB5] hover:underline"
              >
                {footerLabel}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
