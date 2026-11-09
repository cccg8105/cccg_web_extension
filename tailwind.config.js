/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#0a0a0a",
          void: "#0a0a0a",
          graphite: "#161616",
          frosted: "rgba(212, 212, 212, 0.10)"
        },
        void: "#0a0a0a",
        graphite: "#161616",
        frosted: "rgba(212, 212, 212, 0.10)",
        ink: "#000000",
        snow: "#ffffff",
        bone: "#ededed",
        ash: "#c2c2c2",
        slate: {
          muted: "#686868",
          smoke: "#b2b2b2"
        },
        smoke: "#b2b2b2",
        hairline: {
          DEFAULT: "rgba(229, 229, 229, 0.12)",
          strong: "rgba(229, 229, 229, 0.20)",
          subtle: "rgba(229, 229, 229, 0.08)"
        },
        violet: {
          dusk: "#6b62f2",
          glow: "rgba(107, 98, 242, 0.565)",
          surface: "rgba(107, 98, 242, 0.15)"
        },
        "dusk-violet": "#6b62f2"
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Geist'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
}
