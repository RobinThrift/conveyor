export default {
    plugins: {
        "postcss-import": {},
        "tailwindcss/nesting": {},
        tailwindcss: { config: "./tailwind.config.js" },
        autoprefixer: {},
        ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
    },
}
