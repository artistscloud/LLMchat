/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1f9',
          100: '#cce3f3',
          200: '#99c7e6',
          300: '#66abd9',
          400: '#338fcc',
          500: '#0073bf',
          600: '#005c99',
          700: '#004573',
          800: '#002e4d',
          900: '#001726',
        },
        secondary: {
          50: '#e6eaef',
          100: '#ccd5df',
          200: '#99abbe',
          300: '#66819e',
          400: '#33587d',
          500: '#002f5d',
          600: '#00264a',
          700: '#001c38',
          800: '#001325',
          900: '#000913',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
