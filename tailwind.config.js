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
          light: '#5C61C3',
          dark: '#3A3E9B',
          50: '#F1F1F9',
          100: '#E2E3F3',
          200: '#C5C7E7',
          300: '#A8ABDB', 
          400: '#8B8FCF',
          500: '#6E73C3',
          600: '#484DB5', // Cor principal
          700: '#3A3E9B',
          800: '#2C3081',
          900: '#1E2167',
        },
        border: '#D7D7D7',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
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
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.800'),
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.gray.900'),
              fontWeight: theme('fontWeight.bold'),
            },
            blockquote: {
              borderLeftColor: theme('colors.border'),
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