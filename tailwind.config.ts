import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette SmartEstate — jaune pastel chaleureux
        cream: {
          50: "#fffdf5",
          100: "#fefbe8",
          200: "#fef7c3",
        },
        sun: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        // alias pour rester compatible avec l'existant
        brand: {
          50: "#fefce8",
          100: "#fef9c3",
          500: "#facc15",
          600: "#eab308",
          700: "#ca8a04",
          900: "#713f12",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(234 179 8 / 0.06), 0 4px 12px rgb(234 179 8 / 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
