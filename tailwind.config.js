/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.html",
    "./frontend/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E0E7FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        success: {
          500: '#10B981',
        },
        neutral: {
          500: '#64748B',
          600: '#475569',
        },
        accent: {
          500: '#F59E0B',
          600: '#D97706',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

