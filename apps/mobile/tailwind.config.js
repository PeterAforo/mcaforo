/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        mcaforo: {
          gray: '#1F3B4D',
          orange: '#F26522',
          bg: '#0B1220',
          surface: '#111827',
        },
        border: '#1F2937',
        muted: { DEFAULT: '#64748B', foreground: '#9CA3AF' },
      },
    },
  },
  plugins: [],
}
