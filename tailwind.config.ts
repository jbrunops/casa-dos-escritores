import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          '500': '#484DB5', // Cor principal usada nos botões
          '600': '#4045A8', // Cor para hover
          // Podemos adicionar outras tonalidades como DEFAULT, 700, etc., se necessário
        },
        // A cor 'border' que vimos no globals.css também pode ser adicionada aqui se desejado
        // border: '#E5E7EB', 
      },
    },
  },
  plugins: [],
};

export default config;
