/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#151515",
          obsidian: "#151515",
          void: "#0e0e0e",
          ember: "#242424"
        },
        obsidian: "#151515",
        "void-black": "#0e0e0e",
        ember: "#242424",
        rim: "#3f403d",
        copper: "#8b867f",
        ash: "#94958e",
        fog: "#cbccc4",
        limestone: "#b6b8af",
        parchment: "#e9ebdf",
        forest: {
          deep: "#185849",
          moss: "#0e352c"
        },
        coral: {
          shimmer: "#e87650"
        }
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Geist'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
}
