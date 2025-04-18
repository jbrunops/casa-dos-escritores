/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#484DB5',
          50: '#f5f6fd',
          100: '#e7e8fa',
          200: '#c5c8f0',
          300: '#a3a7e7',
          400: '#7e85de',
          500: '#484DB5',
          600: '#3b3f92', // variação mais escura
          700: '#2d316e', // variação ainda mais escura
        },
        border: {
          DEFAULT: '#B1B1B1',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem', // Mobile
          md: '0', // Sem padding lateral em telas md+
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.purple.600'),
              '&:hover': {
                color: theme('colors.purple.800'),
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.gray.900'),
              fontWeight: theme('fontWeight.bold'),
            },
            blockquote: {
              borderLeftColor: theme('colors.gray.300'),
              fontStyle: 'italic',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}