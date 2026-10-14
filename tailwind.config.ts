import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        'accent-foreground': 'hsl(var(--accent-foreground))',
        'subtle-foreground': 'hsl(var(--subtle-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        destructive: 'hsl(var(--destructive))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          border: 'hsl(var(--card-border))',
        },
        border: 'hsl(var(--card-border))',
        'card-foreground': 'hsl(var(--card-foreground))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        placeholder: 'hsl(var(--placeholder))',
        disabled: 'hsl(var(--disabled))',
        'brand-gradient-from': 'hsl(var(--brand-gradient-from))',
        'brand-gradient-to': 'hsl(var(--brand-gradient-to))',
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
          900: "#0c4a6e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
