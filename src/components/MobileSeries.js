// src/components/MobileSeries.js
"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function MobileSeries({ onClick }) {
    return (
        <li className="border-t border-gray-100 pt-4">
            <Link 
                href="/series" 
                onClick={onClick}
                className="flex items-center text-[#484DB5] hover:text-[#7A80FB] text-[1rem] py-2"
            >
                <BookOpen size={18} className="max-h-[1rem] mr-2" />
                <span>Séries</span>
            </Link>
        </li>
    );
}
