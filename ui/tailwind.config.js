import typography from "@tailwindcss/typography"
import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [".src/html/*.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    "extra-light":
                        "rgba(var(--color-primary-extra-light), <alpha-value>)",
                    light: "rgba(var(--color-primary-light), <alpha-value>)",
                    DEFAULT: "rgba(var(--color-primary), <alpha-value>)",
                    dark: "rgba(var(--color-primary-dark), <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-primary-extra-dark), <alpha-value>)",
                    contrast:
                        "rgba(var(--color-primary-contrast), <alpha-value>)",
                },

                info: {
                    "extra-light":
                        "rgba(var(--color-info-extra-light), <alpha-value>)",
                    light: "rgba(var(--color-info-light), <alpha-value>)",
                    DEFAULT: "rgba(var(--color-info), <alpha-value>)",
                    dark: "rgba(var(--color-info-dark), <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-info-extra-dark), <alpha-value>)",
                    contrast: "rgba(var(--color-info-contrast), <alpha-value>)",
                },

                success: {
                    "extra-light":
                        "rgba(var(--color-success-extra-light), <alpha-value>)",
                    light: "rgba(var(--color-success-light), <alpha-value>)",
                    DEFAULT: "rgba(var(--color-success), <alpha-value>)",
                    dark: "rgba(var(--color-success-dark), <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-success-extra-dark), <alpha-value>)",
                    contrast:
                        "rgba(var(--color-success-contrast), <alpha-value>)",
                },

                danger: {
                    "extra-light":
                        "rgba(var(--color-danger-extra-light), <alpha-value>)",
                    light: "rgba(var(--color-danger-light), <alpha-value>)",
                    DEFAULT: "rgba(var(--color-danger), <alpha-value>)",
                    dark: "rgba(var(--color-danger-dark), <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-danger-extra-dark), <alpha-value>)",
                    contrast:
                        "rgba(var(--color-danger-contrast), <alpha-value>)",
                },

                subtle: {
                    "extra-light":
                        "rgba(var(--color-subtle-extra-light), <alpha-value>)",
                    light: "rgba(var(--color-subtle-light), <alpha-value>)",
                    DEFAULT: "rgba(var(--color-subtle), <alpha-value>)",
                    dark: "rgba(var(--color-subtle-dark), <alpha-value>)",
                    "extra-dark":
                        "rgba(var(--color-subtle-extra-dark), <alpha-value>)",
                    contrast:
                        "rgba(var(--color-subtle-contrast), <alpha-value>)",
                },

                text: "rgba(var(--text-color) / <alpha-value>)",
                body: "rgba(var(--body-bg) / <alpha-value>)",
                surface: "rgba(var(--surface-bg) / <alpha-value>)",
                sidebar: "rgba(var(--sidebar-bg) / <alpha-value>)",
            },
        },
    },
    plugins: [typography, animate],
}
