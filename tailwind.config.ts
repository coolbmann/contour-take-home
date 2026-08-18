import type { Config } from "tailwindcss";

export default {
  future: {
    // hover: styles only apply where hover is actually supported, so touch
    // devices never get stuck hover states. Default in Tailwind v4.
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
        // Contour design system — studied from contoureducation.com.au.
        // Every value resolves to a named token in tokens.css, so Tailwind
        // utilities stay inside the token discipline (no arbitrary colours).
        contour: {
          paper: "var(--color-paper)",
          "paper-2": "var(--color-paper-2)",
          "paper-3": "var(--color-paper-3)",
          "paper-hi": "var(--color-paper-hi)",
          ink: "var(--color-ink)",
          neutral: "var(--color-neutral)",
          muted: "var(--color-muted)",
          rule: "var(--color-rule)",
          accent: "var(--color-accent)",
          "accent-hover": "var(--color-accent-hover)",
          "accent-press": "var(--color-accent-press)",
          "accent-ink": "var(--color-accent-ink)",
          "blue-deep": "var(--color-blue-deep)",
          "blue-mid": "var(--color-blue-mid)",
          "blue-grey": "var(--color-blue-grey)",
          "blue-light": "var(--color-blue-light)",
          focus: "var(--color-focus)",
          error: "var(--color-error)",
          success: "var(--color-success)",
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
        // The form's own content breakpoint — where the name pair fits side by side.
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
