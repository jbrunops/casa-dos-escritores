import { useState, useEffect } from 'react';

export default function useTextStats(content) {
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);

    useEffect(() => {
        if (content) {
            // Remover tags HTML para contagem precisa
            const plainText = content.replace(/<[^>]*>/g, "");
            
            // Contagem de caracteres
            setCharCount(plainText.length);

            // Contagem de palavras
            const words = plainText
                .split(/\\s+/)
                .filter((word) => word.length > 0);
            setWordCount(words.length);

            // Tempo de leitura (200 palavras por minuto em média)
            // Garante que o tempo de leitura seja pelo menos 1 se houver palavras.
            const minutes = words.length > 0 ? Math.max(1, Math.ceil(words.length / 200)) : 0;
            setReadingTime(minutes);
        } else {
            setCharCount(0);
            setWordCount(0);
            setReadingTime(0);
        }
    }, [content]);

    return { wordCount, charCount, readingTime };
} 