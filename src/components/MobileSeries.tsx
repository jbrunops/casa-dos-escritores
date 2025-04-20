"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import * as React from "react";

// Props para o componente MobileSeries
interface MobileSeriesProps {
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    className?: string; // Propriedade className para permitir customização externa
}

export default function MobileSeries({ onClick, className = "" }: MobileSeriesProps) {
    return (
        // Aplicar className ao li, se fornecida
        <li className={`mobile-menu-item ${className}`.trim()}> 
            {/* Restaurar classes originais do .js */}
            <Link href="/series" className="mobile-menu-link" onClick={onClick}>
                <div className="mobile-menu-link-content">
                    <BookOpen size={18} className="mobile-menu-icon" />
                    <span>Séries</span>
                </div>
            </Link>
        </li>
    );
} 