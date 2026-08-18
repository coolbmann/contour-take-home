import type { Config } from "tailwindcss";

const token = (name: string) =>
  (({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined
      ? `var(${name})`
      : `color-mix(in oklab, var(${name}) calc(${opacityValue} * 100%), transparent)`) as

    unknown as string;

export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        contour: {
          paper: token("--color-paper"),
          "paper-2": token("--color-paper-2"),
          "paper-3": token("--color-paper-3"),
          "paper-hi": token("--color-paper-hi"),
          ink: token("--color-ink"),
          neutral: token("--color-neutral"),
          muted: token("--color-muted"),
          rule: token("--color-rule"),
          accent: token("--color-accent"),
          "accent-hover": token("--color-accent-hover"),
          "accent-press": token("--color-accent-press"),
          "accent-ink": token("--color-accent-ink"),
          "blue-deep": token("--color-blue-deep"),
          "blue-mid": token("--color-blue-mid"),
          "blue-grey": token("--color-blue-grey"),
          "blue-light": token("--color-blue-light"),
          focus: token("--color-focus"),
          error: token("--color-error"),
          success: token("--color-success"),
        },
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
      spacing: {
        control: "var(--control-h)",
        hit: "var(--hit-min)",
        "hit-pad": "var(--hit-pad)",
      },
      transitionTimingFunction: {
        "contour-out": "var(--ease-out)",
      },
      transitionDuration: {
        short: "var(--dur-short)",
      },
      opacity: {
        55: "0.55",
      },
      screens: {
        xs: "30rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "var(--radius-pill)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
