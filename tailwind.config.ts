import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nav: {
          ink: "#172B3A",
          hover: "#1F3A4E",
        },
        canvas: {
          main: "#F4F1EA",
          paper: "#FFFEFA",
          subtle: "#ECE8DE",
        },
        ink: {
          primary: "#182B36",
          secondary: "#5B6870",
          muted: "#77858D",
        },
        edge: {
          DEFAULT: "#D9DED9",
          dark: "#B8C0B8",
        },
        action: {
          primary: "#254B62",
          hover: "#1D3B4E",
        },
        state: {
          confirmed: {
            text: "#24654B",
            bg: "#E8F1EA",
            border: "#C2DCC8",
          },
          attention: {
            text: "#8A561B",
            bg: "#FBF0DB",
            border: "#E9D2A9",
          },
          failure: {
            text: "#A63F36",
            bg: "#F9E9E6",
            border: "#E7BEB9",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-instrument)", "Arial", "sans-serif"],
        display: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      boxShadow: {
        paper: "0 18px 50px rgba(24, 43, 54, 0.08)",
      },
      transitionDuration: {
        control: "180ms",
        state: "280ms",
      },
    },
  },
  plugins: [],
};

export default config;
