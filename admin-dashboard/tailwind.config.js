/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070B14',
          900: '#0B1220',
          800: '#111827',
          700: '#172033',
          600: '#243244',
        },
        accent: {
          DEFAULT: '#3B82F6',
          soft: 'rgba(59, 130, 246, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 40px rgba(0,0,0,0.28)',
      },
    },
  },
  plugins: [],
};
