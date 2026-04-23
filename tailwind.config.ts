import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class" as const,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-container": "#ffd709",
        "on-surface": "#2d2f2f",
        surface: "#f6f6f6",
        "surface-container": "#e7e8e8",
        "surface-container-high": "#e1e3e3",
        "surface-container-low": "#f0f1f1",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#dbdddd",
        primary: "#6c5a00",
        "on-primary-fixed": "#453900",
        "secondary-container": "#e2e2e2",
        "on-secondary-fixed": "#3f3f3f",
        "outline-variant": "#acadad",
        error: "#b02500",
      },
      fontFamily: {
        headline: ["var(--font-headline)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
