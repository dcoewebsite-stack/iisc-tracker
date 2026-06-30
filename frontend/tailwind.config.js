/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EC',
        forest: {
          DEFAULT: '#1B4332',
          dark: '#0F2E20',
        },
        ink: '#1F2E22',
        sage: '#6B7A6E',
        warmgray: '#E5DFD3',
      },
    },
  },
  plugins: [],
}