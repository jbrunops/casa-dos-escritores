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
        <div className="flex items-center justify-center my-8">
            {/* Botão Anterior */}
            {currentPage > 1 ? (
                <Link
                    href={`${baseUrl}?page=${currentPage - 1}`}
                    className="px-4 py-2 mx-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-purple-700 transition-colors"
                >
                    Anterior
                </Link>
            ) : (
                <span className="px-4 py-2 mx-1 rounded bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed">
                    Anterior
                </span>
            )}

            {/* Números das páginas */}
            <div className="flex mx-2">
                {pageNumbers.map((page, index) =>
                    page === "..." ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-4 py-2 mx-1 text-gray-600"
                        >
                            ...
                        </span>
                    ) : (
                        <Link
                            key={page}
                            href={`${baseUrl}?page=${page}`}
                            className={`px-4 py-2 mx-1 rounded ${
                                currentPage === page 
                                ? "bg-purple-600 text-white" 
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-purple-700"
                            } transition-colors`}
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
                    className="px-4 py-2 mx-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-purple-700 transition-colors"
                >
                    Próximo
                </Link>
            ) : (
                <span className="px-4 py-2 mx-1 rounded bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed">
                    Próximo
                </span>
            )}
        </div>
    );
}
