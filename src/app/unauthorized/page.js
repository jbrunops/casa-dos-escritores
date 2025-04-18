import Link from "next/link";

export const metadata = {
    title: "Acesso Não Autorizado",
    description: "Você não tem permissão para acessar esta página",
};

export default function UnauthorizedPage() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <h1>Acesso Negado</h1>

                <div className="error-message">
                    Você não tem permissão para acessar esta página.
                </div>

                <p>
                    Este conteúdo está restrito a usuários com níveis
                    específicos de acesso. Se você acredita que deveria ter
                    acesso, entre em contato com um administrador.
                </p>

                <div className="button-group" style={{ marginTop: "2rem" }}>
                    <Link href="/" className="btn primary">
                        Voltar para a página inicial
                    </Link>
                </div>
            </div>
        </div>
    );
}
