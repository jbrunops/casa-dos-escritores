// src/components/MobileSeries.js
"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function MobileSeries({ onClick }) {
    return (
        <li className="mobile-menu-item">
            <Link href="/series" className="mobile-menu-link" onClick={onClick}>
                <div className="mobile-menu-link-content">
                    <BookOpen size={18} className="mobile-menu-icon" />
                    <span>Séries</span>
                </div>
            </Link>
        </li>
    );
}
