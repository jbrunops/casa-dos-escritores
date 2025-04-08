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
            <body suppressHydrationWarning>
                <Header />
                <main className="content-wrapper">{children}</main>
                <footer className="border-t border-[#E5E7EB] mt-[1.875rem]">
                    <div className="max-w-[75rem] mx-auto px-4 py-8">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <p className="text-lg font-medium text-gray-900">
                                &copy; {new Date().getFullYear()} Casa Dos Escritores
                            </p>
                            <p className="text-gray-600">O lugar certo para nós!</p>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
