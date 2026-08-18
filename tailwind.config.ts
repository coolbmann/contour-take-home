import type { Config } from "tailwindcss";

/**
 * A token that still works with an opacity modifier.
 *
 * Tailwind can only alpha-composite a colour it can parse, or one written with
 * the `<alpha-value>` placeholder. A bare `var(--x)` is neither, so `bg-x/70`
 * matched no colour and Tailwind emitted **nothing at all** — no error, no
 * rule, just a class that does nothing. That is how the dialog overlay spent
 * its life invisible.
 *
 * Returning a function lets each utility decide: the plain token when there is
 * no modifier, and a `color-mix()` against transparent when there is. The
 * tokens are already `oklch()`, so `color-mix` needs nothing newer than they
 * do.
 */
const token = (name: string) =>
  (({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined
      ? `var(${name})`
      : `color-mix(in oklab, var(${name}) calc(${opacityValue} * 100%), transparent)`) as
    // Tailwind resolves colour values that are functions — its own
    // PluginUtils.rgb() and .hsl() return this exact shape — but `colors` is
    // typed as RecursiveKeyValuePair<string, string>, so the types do not
    // model it. The cast is confined here rather than at all nineteen tokens.
    unknown as string;

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
