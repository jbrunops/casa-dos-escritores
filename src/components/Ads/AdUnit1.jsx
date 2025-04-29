'use client'; // Marca o componente como Client Component devido ao uso de useEffect

import { useEffect } from 'react';

const AdUnit1 = () => {
  useEffect(() => {
    // Tenta inicializar o anúncio. Envolve em try/catch para segurança.
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Erro ao inicializar o anúncio AdSense:", err);
    }
  }, []); // Executa apenas uma vez após a montagem inicial no cliente

  return (
    // Um wrapper pode ser útil para estilização e espaçamento
    <div style={{ overflow: 'hidden', margin: '1em 0' }}> 
      {/* Casa Dos Escritores Anúncio 1 */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }} // Convertido para objeto de estilo React
        data-ad-client="ca-pub-2169694779628621"
        data-ad-slot="5858175761" // O slot específico deste bloco
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdUnit1; 