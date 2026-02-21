/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tenable-style: slate + teal accent
        surface: {
          dark: "#0f172a",
          DEFAULT: "#1e293b",
          light: "#334155",
        },
        accent: {
          DEFAULT: "#0d9488",
          hover: "#0f766e",
          light: "#5eead4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
