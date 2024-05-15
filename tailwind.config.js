/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#FAFAFA",
          100: "#F3F3F3",
          200: "#EBEBEB",
          300: "#D8D8D8",
          400: "#B8B8B8",
          500: "#979797",
          600: "#757575",
          700: "#5C5C5C",
          800: "#3E3E3E",
          900: "#1D1D1D",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)"],
        mono: ["var(--font-overpass-mono)"],
      },
    },
  },
  plugins: [],
};
