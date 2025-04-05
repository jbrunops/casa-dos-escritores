import Link from "next/link";
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-column">
            <h3 className="footer-logo">Casa Dos Escritores</h3>
            <p className="footer-description">
              A plataforma dedicada a escritores brasileiros, onde você pode compartilhar suas histórias e conectar-se com outros autores.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" aria-label="Facebook" className="text-white hover:text-[#C8CAF7] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="text-white hover:text-[#C8CAF7] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" aria-label="Instagram" className="text-white hover:text-[#C8CAF7] transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div className="footer-column">
            <h4>Links Rápidos</h4>
            <ul className="footer-links">
              <li>
                <Link href="/">Início</Link>
              </li>
              <li>
                <Link href="/series">Séries</Link>
              </li>
              <li>
                <Link href="/categories">Categorias</Link>
              </li>
              <li>
                <Link href="/writers">Escritores</Link>
              </li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Recursos</h4>
            <ul className="footer-links">
              <li>
                <Link href="/about">Sobre Nós</Link>
              </li>
              <li>
                <Link href="/terms">Termos de Uso</Link>
              </li>
              <li>
                <Link href="/privacy">Privacidade</Link>
              </li>
              <li>
                <Link href="/faq">Perguntas Frequentes</Link>
              </li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Contato</h4>
            <ul className="footer-contact space-y-3">
              <li className="flex items-start">
                <Mail size={18} className="mr-2 mt-0.5" />
                <span>casadosescritores@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="footer-copyright">
          <p>&copy; {currentYear} Casa Dos Escritores — O lugar certo para você inserir suas ideias!</p>
        </div>
      </div>
    </footer>
  );
} 