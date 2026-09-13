/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1220',
        panel: '#111827',
        card: '#172033',
        line: '#243244',
        brand: '#2563EB',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
