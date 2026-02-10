/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        twitter: {
          blue: '#1DA1F2',
          dark: '#14171A',
          gray: '#657786',
          light: '#AAB8C2',
          lighter: '#E1E8ED',
          lightest: '#F5F8FA',
        },
      },
    },
  },
  plugins: [],
}
