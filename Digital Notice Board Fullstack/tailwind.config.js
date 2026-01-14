/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        hand: ['"Gochi Hand"', 'cursive'],
        school: ['"Schoolbell"', 'cursive'],
      },
      colors: {
        cork: {
          DEFAULT: '#8B5A2B',
          light: '#A06B3A',
          dark: '#6F4320',
        },
        paper: {
          DEFAULT: '#FDFBF7',
          yellow: '#FFF9C4',
          blue: '#E3F2FD',
          pink: '#F8BBD0',
        },
        ink: {
          DEFAULT: '#2C3E50',
          blue: '#1A237E',
          red: '#B71C1C',
        }
      },
      boxShadow: {
        'paper': '2px 3px 5px rgba(0,0,0,0.2)',
        'paper-hover': '4px 6px 12px rgba(0,0,0,0.3)',
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}
