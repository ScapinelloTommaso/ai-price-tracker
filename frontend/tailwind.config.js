/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#10b981',
          600: '#059669',
        },
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          text: '#f8fafc',
          muted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}
