'use client';

import Link from 'next/link';
import { Book, FileText } from 'lucide-react';

export default function WriteSelectionPage() {
    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold text-center mb-8">O que você quer escrever hoje?</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opção 1: Conto Único */}
                <Link 
                    href="/write/story"
                    className="flex flex-col items-center p-8 border border-border rounded-lg hover:shadow-lg hover:border-primary transition-all duration-300 text-center"
                >
                    <FileText size={48} className="mb-4 text-primary" />
                    <h2 className="text-xl font-semibold mb-2">Conto Único</h2>
                    <p className="text-gray-600 text-sm">Publique uma história independente, sem capítulos.</p>
                </Link>

                {/* Opção 2: Série/Livro/Novela */}
                <Link 
                    href="/write/series"
                    className="flex flex-col items-center p-8 border border-border rounded-lg hover:shadow-lg hover:border-primary transition-all duration-300 text-center"
                >
                    <Book size={48} className="mb-4 text-primary" />
                    <h2 className="text-xl font-semibold mb-2">Série / Livro / Novela</h2>
                    <p className="text-gray-600 text-sm">Crie uma obra com múltiplos capítulos.</p>
                </Link>
            </div>
        </div>
    );
} 