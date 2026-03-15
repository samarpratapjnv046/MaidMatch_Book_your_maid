/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D7A4D',
        secondary: '#F5A623',
        accent: '#E74C3C',
        background: '#FEFEFE',
        card: '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'input': '8px',
      },
    },
  },
  plugins: [],
}
