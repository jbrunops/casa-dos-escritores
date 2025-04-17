"use client";

import Link from "next/link";
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const getPageNumbers = () => {
    const delta = 2;
    const pages: (number | string)[] = [];
    pages.push(1);
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);
    if (rangeStart > 2) {
      pages.push("...");
    }
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    if (rangeEnd < totalPages - 1) {
      pages.push("...");
    }
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    return pages;
  };
  const pageNumbers = getPageNumbers();
  return (
    <div className="flex items-center justify-center space-x-2">
      {currentPage > 1 ? (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="h-10 px-4 flex items-center justify-center border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          Anterior
        </Link>
      ) : (
        <span className="h-10 px-4 flex items-center justify-center border border-[#E5E7EB] rounded-md text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed">
          Anterior
        </span>
      )}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) =>
          typeof page === "number" ? (
            <Link
              key={page}
              href={`${baseUrl}?page=${page}`}
              className={`h-10 w-10 flex items-center justify-center rounded-md border border-[#E5E7EB] text-gray-700 ${page === currentPage ? "bg-[#484DB5] text-white font-semibold" : "hover:bg-gray-50"}`}
            >
              {page}
            </Link>
          ) : (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          )
        )}
      </div>
      {currentPage < totalPages ? (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="h-10 px-4 flex items-center justify-center border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          Próxima
        </Link>
      ) : (
        <span className="h-10 px-4 flex items-center justify-center border border-[#E5E7EB] rounded-md text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed">
          Próxima
        </span>
      )}
    </div>
  );
}
