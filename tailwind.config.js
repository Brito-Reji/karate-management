/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated, deeply muted dark palette
        zinc: {
          950: '#09090b',
        }
      },
      backgroundImage: {
        // Ultra-subtle vignette effect for depth
        'radial-gradient': 'radial-gradient(circle at center, rgba(24, 24, 27, 0.8) 0%, rgba(9, 9, 11, 1) 100%)',
      }
    },
  },
  plugins: [],
}