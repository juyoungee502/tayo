import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7f8",
          100: "#feecef",
          200: "#fbcfd7",
          300: "#f8b8c2",
          400: "#f5a1af",
          500: "#fbc2c9",
          600: "#e9a0ab",
          700: "#cd7f91",
          800: "#a86175",
          900: "#7d495d",
        },
        slateBlue: "#5c4357",
        sand: "#fff8fb",
      },
      boxShadow: {
        card: "0 24px 70px rgba(183, 122, 141, 0.16)",
      },
      backgroundImage: {
        "mesh-glow":
          "radial-gradient(circle at top left, rgba(251, 194, 201, 0.42), transparent 32%), radial-gradient(circle at top right, rgba(232, 217, 241, 0.28), transparent 30%), radial-gradient(circle at bottom, rgba(255, 236, 239, 0.52), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,251,0.98))",
      },
    },
  },
  plugins: [],
};

export default config;
