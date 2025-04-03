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
        <div className="content-type-container">
            <div className="content-type-header">
                <h1>O que você deseja criar?</h1>
                <p className="content-type-subtitle">
                    Escolha entre um conto único ou uma série em capítulos
                </p>
            </div>

            <div className="back-dashboard">
                <Link href="/dashboard" className="back-link">
                    <ArrowLeft size={16} />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>

            <div className="content-type-options">
                <div
                    className={`content-type-card ${
                        selectedType === "single" ? "selected" : ""
                    }`}
                    onClick={() => setSelectedType("single")}
                >
                    <div className="content-type-icon">
                        <BookOpen size={48} />
                    </div>
                    <h2>Conto Único</h2>
                    <p>
                        Uma história completa em uma só publicação. Ideal para
                        contos curtos, poemas e reflexões.
                    </p>
                    <ul className="content-type-features">
                        <li>Publicação única</li>
                        <li>Formato tradicional</li>
                        <li>Ideal para textos curtos e médios</li>
                    </ul>
                </div>

                <div
                    className={`content-type-card ${
                        selectedType === "series" ? "selected" : ""
                    }`}
                    onClick={() => setSelectedType("series")}
                >
                    <div className="content-type-icon">
                        <Layers size={48} />
                    </div>
                    <h2>Série em Capítulos</h2>
                    <p>
                        Uma história dividida em múltiplos capítulos. Perfeita
                        para romances, novelas e histórias mais longas.
                    </p>
                    <ul className="content-type-features">
                        <li>Múltiplos capítulos</li>
                        <li>Capa personalizada</li>
                        <li>Ideal para histórias longas</li>
                    </ul>
                </div>
            </div>

            <div className="content-type-actions">
                <button
                    className="continue-btn"
                    disabled={!selectedType}
                    onClick={handleContinue}
                >
                    <span>Continuar</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
