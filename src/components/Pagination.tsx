"use client";

import Link from "next/link";
import * as React from "react"; // Importar React

// Definir interface para as props
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // URL base para os links de página (ex: "/posts", "/search")
  className?: string; // Classes adicionais opcionais
}

export default function Pagination({ 
  currentPage,
  totalPages,
  baseUrl,
  className = ""
}: PaginationProps) {

    // Não renderizar nada se houver apenas uma página ou nenhuma
    if (totalPages <= 1) {
        return null;
    }

    // Gerar um array de números de página para exibir
    const getPageNumbers = (): (number | string)[] => {
        const delta = 1; // Número de páginas antes e depois da atual (reduzido para menos itens)
        const pages: (number | string)[] = [];
        const showEllipsisThreshold = 3; // Número de páginas antes/depois para mostrar elipses

        // Adicionar a primeira página
        pages.push(1);

        // Calcular o intervalo de páginas ao redor da página atual
        let rangeStart = Math.max(2, currentPage - delta);
        let rangeEnd = Math.min(totalPages - 1, currentPage + delta);

        // Adicionar elipses após a primeira página se necessário
        if (rangeStart > showEllipsisThreshold) {
            pages.push("...");
        } else if (rangeStart > 2) { // Adicionar a página 2 se não houver elipses e rangeStart for 3
             pages.push(2);
        }

        // Adicionar as páginas no intervalo
        for (let i = rangeStart; i <= rangeEnd; i++) {
             if (!pages.includes(i)) {
                 pages.push(i);
             }
        }

        // Adicionar elipses antes da última página se necessário
        if (rangeEnd < totalPages - showEllipsisThreshold + 1) {
            pages.push("...");
        } else if (rangeEnd < totalPages - 1) { // Adicionar penúltima página se não houver elipses e rangeEnd for totalPages-2
            if (!pages.includes(totalPages - 1)) {
                pages.push(totalPages - 1);
            }
        }

        // Adicionar a última página
        if (!pages.includes(totalPages)) {
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();
    
    // Função auxiliar para construir URL
    const buildPageUrl = (page: number): string => {
        // Verifica se baseUrl já contém query params
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}page=${page}`;
    };

    return (
        <div className={`flex items-center justify-center space-x-2 ${className}`}>
            {/* Botão Anterior */}
            {currentPage > 1 ? (
                <Link
                    href={buildPageUrl(currentPage - 1)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                >
                    Anterior
                </Link>
            ) : (
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background h-9 px-3 border border-input bg-gray-100 text-muted-foreground opacity-60 cursor-not-allowed">
                    Anterior
                </span>
            )}

            {/* Números das páginas */}
            <div className="flex items-center space-x-1">
                {pageNumbers.map((page, index) =>
                    page === "..." ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                        >
                            ...
                        </span>
                    ) : (
                        <Link
                            key={page}
                            href={buildPageUrl(page as number)}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 ${
                                currentPage === page
                                    ? "border border-input bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
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
                     href={buildPageUrl(currentPage + 1)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                >
                    Próximo
                </Link>
            ) : (
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background h-9 px-3 border border-input bg-gray-100 text-muted-foreground opacity-60 cursor-not-allowed">
                    Próximo
                </span>
            )}
        </div>
    );
} 