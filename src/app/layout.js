import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
    title: "Plataforma para Escritores",
    description: "Compartilhe suas histórias com o mundo",
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" className="h-full">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="flex flex-col min-h-screen bg-white font-sans" suppressHydrationWarning>
                <Header />
                <main className="flex-grow max-w-[75rem] mx-auto px-4 py-8 w-full">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
