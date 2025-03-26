import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
    title: "Plataforma para Escritores",
    description: "Compartilhe suas histórias com o mundo",
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <Header />
                <main className="content-wrapper">{children}</main>
                <footer>
                    <p>
                        &copy; {new Date().getFullYear()} Casa Dos Escritores —
                        O lugar certo para nós!
                    </p>
                </footer>
            </body>
        </html>
    );
}
