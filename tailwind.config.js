/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#548e54',
          dark: '#145414',
          light: '#83b383',
        },
        lightcream: '#d4f4dc',
        accent: {
          DEFAULT: '#83b383',
          dark: '#538c4c',
          light: '#d4f4dc',
        },
        modern: {
          green: '#d4f4dc',
          teal: '#83b383',
          sage: '#538c4c',
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
