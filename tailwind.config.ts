import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { brand: "#6C4CF1" }, fontFamily: { sans: ["Arial", "sans-serif"] } } }, plugins: [] } satisfies Config;
