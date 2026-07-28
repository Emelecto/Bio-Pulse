/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
