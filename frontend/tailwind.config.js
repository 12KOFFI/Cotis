/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        wave: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#b8cdff",
          300: "#8aa9ff",
          400: "#587eff",
          500: "#2a57ff",
          600: "#1e6dff",
          700: "#0a3d91",
          800: "#082d6e",
          900: "#061f4e",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#b8cdff",
          300: "#8aa9ff",
          400: "#587eff",
          500: "#2a57ff",
          600: "#1e6dff",
          700: "#0a3d91",
          800: "#082d6e",
          900: "#061f4e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -20px rgba(14,40,120,0.35)",
        glow: "0 0 0 6px rgba(30,109,255,0.12)",
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};
