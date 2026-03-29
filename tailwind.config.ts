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
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        slateBlue: "#123a5f",
        sand: "#fff9f1",
      },
      boxShadow: {
        card: "0 20px 60px rgba(18, 58, 95, 0.12)",
      },
      backgroundImage: {
        "mesh-glow":
          "radial-gradient(circle at top left, rgba(249, 115, 22, 0.22), transparent 30%), radial-gradient(circle at top right, rgba(18, 58, 95, 0.16), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,249,241,0.96))",
      },
    },
  },
  plugins: [],
};

export default config;
