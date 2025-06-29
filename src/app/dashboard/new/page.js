"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, ArrowRight } from "lucide-react";

export default function ContentTypePage() {
    const [selectedType, setSelectedType] = useState(null);
    const router = useRouter();

    const handleContinue = () => {
        if (selectedType === "single") {
            router.push("/dashboard/new-story");
        } else if (selectedType === "series") {
            router.push("/dashboard/new-series");
        }
    };

    return (
        <div className="max-w-[75rem] mx-auto px-4 sm:px-6 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">O que você deseja criar?</h1>
                <p className="text-gray-600 mt-2">
                    Escolha entre um conto único ou uma série em capítulos
                </p>
            </div>

            <div className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center text-[#484DB5] hover:text-opacity-80 transition-all duration-200">
                    <ArrowLeft size={16} className="mr-2" />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div
                    className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedType === "single" 
                        ? "border-[#484DB5] bg-[#484DB5]/5" 
                        : "border-[#E5E7EB]"
                    }`}
                    onClick={() => setSelectedType("single")}
                >
                    <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            selectedType === "single" 
                            ? "bg-[#484DB5]/10 text-[#484DB5]" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                            <BookOpen size={32} />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-center mb-3">Conto Único</h2>
                    <p className="text-gray-600 mb-4 text-center">
                        Uma história completa em uma só publicação. Ideal para
                        contos curtos, poemas e reflexões.
                    </p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#484DB5] rounded-full mr-2"></span>
                            <span>Publicação única</span>
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#484DB5] rounded-full mr-2"></span>
                            <span>Formato tradicional</span>
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#484DB5] rounded-full mr-2"></span>
                            <span>Ideal para textos curtos e médios</span>
                        </li>
                    </ul>
                </div>

                <div
                    className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedType === "series" 
                        ? "border-[#484DB5] bg-[#484DB5]/5" 
                        : "border-[#E5E7EB]"
                    }`}
                    onClick={() => setSelectedType("series")}
                >
                    <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            selectedType === "series" 
                            ? "bg-[#484DB5]/10 text-[#484DB5]" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                            <Layers size={32} />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-center mb-3">Série em Capítulos</h2>
                    <p className="text-gray-600 mb-4 text-center">
                        Uma história dividida em múltiplos capítulos. Perfeita
                        para romances, novelas e histórias mais longas.
                    </p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#484DB5] rounded-full mr-2"></span>
                            <span>Múltiplos capítulos</span>
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#484DB5] rounded-full mr-2"></span>
                            <span>Capa personalizada</span>
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#484DB5] rounded-full mr-2"></span>
                            <span>Ideal para histórias longas</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    className="h-10 px-6 inline-flex items-center justify-center rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    bg-[#484DB5] text-white hover:shadow-md"
                    disabled={!selectedType}
                    onClick={handleContinue}
                >
                    <span className="mr-2">Continuar</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
