/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        'serif': ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        'custom-font': ['Your Custom Font Name', 'sans-serif'],  // Example
      },
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
