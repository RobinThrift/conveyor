import containerQueries from "@tailwindcss/container-queries"
import typography from "@tailwindcss/typography"
import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        ".src/html/*.html",
        "./src/**/*.{ts,tsx}",
        "./src/**/*.stories.tsx",
    ],
    theme: {
        screens: {
            phone: "390px",
            xs: "768px",
            tablet: "1024px",
            sm: "1440px",
            md: "1680px",
            lg: "2100px",
            xl: "2600px",
            xxl: "2800px",
        },

        extend: {
            fontFamily: {
                sans: ["ui-sans-serif", "system-ui", "sans-serif"],
                serif: ["Noto Serif HK Variable", "serif"],
                mono: ["ui-monospace", "SFMono-Regular", "monospace"],
            },

            colors: {
                primary: {
                    "extra-light":
                        "rgba(var(--color-primary-extra-light) / <alpha-value>)",
                    light: "rgba(var(--color-primary-light) / <alpha-value>)",
                    DEFAULT: "rgba(var(--color-primary) / <alpha-value>)",
                    dark: "rgba(var(--color-primary-dark) / <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-primary-extra-dark) / <alpha-value>)",
                    contrast:
                        "rgba(var(--color-primary-contrast) / <alpha-value>)",
                },

                info: {
                    "extra-light":
                        "rgba(var(--color-info-extra-light) / <alpha-value>)",
                    light: "rgba(var(--color-info-light) / <alpha-value>)",
                    DEFAULT: "rgba(var(--color-info) / <alpha-value>)",
                    dark: "rgba(var(--color-info-dark) / <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-info-extra-dark) / <alpha-value>)",
                    contrast:
                        "rgba(var(--color-info-contrast) / <alpha-value>)",
                },

                success: {
                    "extra-light":
                        "rgba(var(--color-success-extra-light) / <alpha-value>)",
                    light: "rgba(var(--color-success-light) / <alpha-value>)",
                    DEFAULT: "rgba(var(--color-success) / <alpha-value>)",
                    dark: "rgba(var(--color-success-dark) / <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-success-extra-dark) / <alpha-value>)",
                    contrast:
                        "rgba(var(--color-success-contrast) / <alpha-value>)",
                },

                danger: {
                    "extra-light":
                        "rgba(var(--color-danger-extra-light) / <alpha-value>)",
                    light: "rgba(var(--color-danger-light) / <alpha-value>)",
                    DEFAULT: "rgba(var(--color-danger) / <alpha-value>)",
                    dark: "rgba(var(--color-danger-dark) / <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-danger-extra-dark) / <alpha-value>)",
                    contrast:
                        "rgba(var(--color-danger-contrast) / <alpha-value>)",
                },

                subtle: {
                    "extra-light":
                        "rgba(var(--color-subtle-extra-light) / <alpha-value>)",
                    light: "rgba(var(--color-subtle-light) / <alpha-value>)",
                    DEFAULT: "rgba(var(--color-subtle) / <alpha-value>)",
                    dark: "rgba(var(--color-subtle-dark) / <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-subtle-extra-dark) / <alpha-value>)",
                    contrast:
                        "rgba(var(--color-subtle-contrast) / <alpha-value>)",
                },

                text: "rgba(var(--text-color) / <alpha-value>)",
                body: "rgba(var(--body-bg) / <alpha-value>)",
                "body-contrast":
                    "rgba(var(--body-bg-contrast) / <alpha-value>)",
                surface: "rgba(var(--surface-bg) / <alpha-value>)",
                sidebar: "rgba(var(--sidebar-bg) / <alpha-value>)",

                navigation: {
                    bg: "rgba(var(--navigation-bg) / <alpha-value>)",
                    fg: "rgba(var(--navigation-fg) / <alpha-value>)",
                },
            },

            typography: () => ({
                DEFAULT: {
                    css: {
                        color: "rgb(var(--text-color))",
                        h1: { color: "rgb(var(--text-color))" },
                        h2: { color: "rgb(var(--text-color))" },
                        h3: { color: "rgb(var(--text-color))" },
                        h4: { color: "rgb(var(--text-color))" },
                        h5: { color: "rgb(var(--text-color))" },
                        h6: { color: "rgb(var(--text-color))" },
                        blockquote: { color: "rgb(var(--text-color))" },
                        a: { color: "rgb(var(--color-primary))" },
                    },
                },
            }),
        },
    },
    plugins: [typography, animate, containerQueries],
}
