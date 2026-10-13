/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface': '#061424',
        'surface-dim': '#061424',
        'surface-bright': '#2d3a4b',
        'surface-container-lowest': '#020f1e',
        'surface-container-low': '#0f1c2c',
        'surface-container': '#132030',
        'surface-container-high': '#1e2b3b',
        'surface-container-highest': '#293647',
        'surface-variant': '#293647',
        'on-surface': '#d6e3fa',
        'on-surface-variant': '#bbcabd',
        'outline': '#859489',
        'outline-variant': '#3c4a40',
        'surface-tint': '#3be194',
        
        // Semantic trading colors
        'primary': '#45e89b',
        'primary-container': '#0ecb81',
        'primary-fixed': '#60feae',
        'primary-fixed-dim': '#3be194',
        'on-primary': '#003920',
        'on-primary-container': '#004f2f',
        
        'secondary': '#ffb3b5',
        'secondary-container': '#f6465d',
        'secondary-dark': '#ac012f',
        'on-secondary': '#680018',
        'on-secondary-container': '#ffdad6',

        'tertiary': '#fec521',
        'tertiary-container': '#deaa00',
        'on-tertiary': '#3f2e00',
        'on-tertiary-container': '#574100',

        'error': '#ffb4ab',
        'error-container': '#93000a',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
        headline: ['Geist', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
      },
      spacing: {
        'space-xs': '0.125rem',
        'space-sm': '0.25rem',
        'space-md': '0.5rem',
        'space-lg': '0.75rem',
        'space-xl': '1rem',
      }
    },
  },
  plugins: [],
}
