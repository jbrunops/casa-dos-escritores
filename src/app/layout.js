import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

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
                <AuthProvider>
                    <Header />
                    <main className="flex-grow w-full">
                        {children}
                    </main>
                    <Footer />
                </AuthProvider>
            </body>
        </html>
    );
}
