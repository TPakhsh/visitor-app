/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif'],
      },
      colors: {
        primary: '#2B2E4A',     // پالت اختصاصی
        secondary: '#E84545',
        accent: '#903749',
        muted: '#53354A',
      },
    },
  },
  plugins: [],
}
