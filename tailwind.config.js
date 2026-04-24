/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
      colors: {
        // Semantic shorthand — existing components use bg-vct-* / text-vct-* etc.
        vct: {
          950: '#0d1b2a',  // ink-black      — page background
          900: '#1b263b',  // prussian-blue  — navbar, table headers, alt rows
          800: '#273647',  // dusk-blue-300  — card / panel backgrounds
          700: '#415a77',  // dusk-blue      — active / selected states
          600: '#5172af',  // prussian-blue-700 — hover border accent
        },

        // Full palette — available for future components
        'ink-black': {
          DEFAULT: '#0d1b2a',
          100: '#030609',
          200: '#050b11',
          300: '#08111a',
          400: '#0b1622',
          500: '#0d1b2a',
          600: '#234870',
          700: '#3875b6',
          800: '#74a3d4',
          900: '#bad1ea',
        },
        'prussian-blue': {
          DEFAULT: '#1b263b',
          100: '#05080c',
          200: '#0b0f18',
          300: '#101724',
          400: '#161f30',
          500: '#1b263b',
          600: '#364c75',
          700: '#5172af',
          800: '#8ba1ca',
          900: '#c5d0e4',
        },
        'dusk-blue': {
          DEFAULT: '#415a77',
          100: '#0d1218',
          200: '#1a242f',
          300: '#273647',
          400: '#34485f',
          500: '#415a77',
          600: '#587aa1',
          700: '#819bb9',
          800: '#abbcd1',
          900: '#d5dee8',
        },
        'dusty-denim': {
          DEFAULT: '#778da9',
          100: '#161c23',
          200: '#2c3746',
          300: '#425369',
          400: '#586f8d',
          500: '#778da9',
          600: '#91a2ba',
          700: '#acbacb',
          800: '#c8d1dc',
          900: '#e3e8ee',
        },
        'alabaster-grey': {
          DEFAULT: '#e0e1dd',
          100: '#2e2f2a',
          200: '#5b5e53',
          300: '#898c7e',
          400: '#b4b6ad',
          500: '#e0e1dd',
          600: '#e5e6e3',
          700: '#ececea',
          800: '#f2f3f1',
          900: '#f9f9f8',
        },
      },
    },
  },
  plugins: [],
}
