import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clinic: {
          ink: "#16231f",
          mint: "#d7f4df",
          sage: "#7ba88f",
          coral: "#ef8f79",
          cream: "#fffaf1",
        },
      },
    },
  },
  plugins: [],
};

export default config;
