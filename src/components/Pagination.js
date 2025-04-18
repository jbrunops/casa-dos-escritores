"use client";

import Link from "next/link";

export default function Pagination({ currentPage, totalPages, baseUrl }) {
    // Gerar um array de números de página para exibir
    const getPageNumbers = () => {
        const delta = 2; // Número de páginas antes e depois da atual
        const pages = [];

        // Sempre mostrar a primeira página
        pages.push(1);

        // Calcular o intervalo de páginas ao redor da página atual
        const rangeStart = Math.max(2, currentPage - delta);
        const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

        // Adicionar elipses após a primeira página se necessário
        if (rangeStart > 2) {
            pages.push("...");
        }

        // Adicionar as páginas no intervalo
        for (let i = rangeStart; i <= rangeEnd; i++) {
            pages.push(i);
        }

        // Adicionar elipses antes da última página se necessário
        if (rangeEnd < totalPages - 1) {
            pages.push("...");
        }

        // Sempre mostrar a última página se houver mais de uma página
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-center space-x-2">
            {/* Botão Anterior */}
            {currentPage > 1 ? (
                <Link
                    href={`${baseUrl}?page=${currentPage - 1}`}
                    className="h-10 px-4 flex items-center justify-center border border-border rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                    Anterior
                </Link>
            ) : (
                <span className="h-10 px-4 flex items-center justify-center border border-border rounded-md text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed">
                    Anterior
                </span>
            )}

            {/* Números das páginas */}
            <div className="flex items-center space-x-1">
                {pageNumbers.map((page, index) =>
                    page === "..." ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="h-10 w-10 flex items-center justify-center text-gray-500"
                        >
                            ...
                        </span>
                    ) : (
                        <Link
                            key={page}
                            href={`${baseUrl}?page=${page}`}
                            className={`h-10 w-10 flex items-center justify-center rounded-md transition-all duration-200 ${
                                currentPage === page 
                                ? "bg-primary text-white"
                                : "text-gray-700 border border-border hover:bg-gray-50"
                            }`}
                        >
                            {page}
                        </Link>
                    )
                )}
            </div>

            {/* Botão Próximo */}
            {currentPage < totalPages ? (
                <Link
                    href={`${baseUrl}?page=${currentPage + 1}`}
                    className="h-10 px-4 flex items-center justify-center border border-border rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                    Próximo
                </Link>
            ) : (
                <span className="h-10 px-4 flex items-center justify-center border border-border rounded-md text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed">
                    Próximo
                </span>
            )}
        </div>
    );
}
