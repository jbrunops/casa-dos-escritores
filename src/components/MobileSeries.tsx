"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

interface MobileSeriesProps {
  onClick?: () => void;
}

export default function MobileSeries({ onClick }: MobileSeriesProps) {
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
