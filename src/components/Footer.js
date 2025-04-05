export default function Footer() {
  return (
    <footer className="bg-white py-6 border-t border-gray-200">
      <div className="max-w-[75rem] mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#484DB5]">Casa Dos Escritores</h3>
            <p className="text-gray-600 text-sm">
              A plataforma dedicada a escritores brasileiros, onde você pode compartilhar suas histórias e conectar-se com outros autores.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-[#484DB5] hover:text-[#7A80FB] text-sm">Início</a></li>
              <li><a href="/series" className="text-[#484DB5] hover:text-[#7A80FB] text-sm">Séries</a></li>
              <li><a href="/categories" className="text-[#484DB5] hover:text-[#7A80FB] text-sm">Categorias</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="text-[#484DB5] hover:text-[#7A80FB] text-sm">Sobre Nós</a></li>
              <li><a href="/terms" className="text-[#484DB5] hover:text-[#7A80FB] text-sm">Termos de Uso</a></li>
              <li><a href="/privacy" className="text-[#484DB5] hover:text-[#7A80FB] text-sm">Privacidade</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-4">Contato</h4>
            <ul className="space-y-2">
              <li className="text-gray-600 text-sm">contato@casadosescritores.com.br</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Casa Dos Escritores — O lugar certo para nós!
        </div>
      </div>
    </footer>
  );
} 