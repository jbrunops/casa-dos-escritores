"use client";

import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import MenuItem from "./MenuItem";

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
}

interface DropdownMenuProps {
  trigger?: React.ReactNode;
  icon?: React.ReactNode;
  label?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  items: DropdownMenuItem[];
  position?: "left" | "right";
  className?: string;
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
}: DropdownMenuProps) {
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
          className={`absolute top-full ${position === "right" ? "right-0" : "left-0"} mt-2 bg-white rounded-md shadow-lg p-3 z-10 border border-[#E5E7EB] min-w-[10rem]`}
        >
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="block px-2 py-1 rounded hover:bg-[#484DB5]/10 text-sm text-gray-700 text-left"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
