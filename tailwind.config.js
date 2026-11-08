/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#000000",
          near: "#0B0B0C",
        },
        surface: {
          DEFAULT: "#141416",
          translucent: "rgba(255, 255, 255, 0.05)",
          hover: "rgba(255, 255, 255, 0.08)",
        },
        border: {
          subtle: "#262629",
          translucent: "rgba(255, 255, 255, 0.1)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A1A1AA",
          muted: "#B4B4B8",
          tertiary: "#71717A",
        },
        accent: {
          yellow: "#FDE047",
          amber: "#F59E0B",
          blue: "#38BDF8",
          sky: "#60A5FA",
          line: "#3F3F46",
        },
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.025em",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "dot-grid": "radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)",
      },
      backgroundSize: {
        "dot-grid": "24px 24px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        orb: "0 0 120px 40px rgba(245, 158, 11, 0.15), 0 0 160px 80px rgba(56, 189, 248, 0.15)",
      },
      animation: {
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "orb-float": "float 12s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(30px, -20px) scale(1.05)" },
          "100%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
      },
    },
  },
  plugins: [],
};
