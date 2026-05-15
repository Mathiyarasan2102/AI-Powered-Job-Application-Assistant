export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030303',
        surface: '#0A0A0A',
        primary: '#D4FF00', // Neon chartreuse for intense modern tech vibe
        secondary: '#00E5FF', // Cyan accent
        text: '#FAFAFA',
        textMuted: '#A1A1AA'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      }
    },
  },
  plugins: [],
}
