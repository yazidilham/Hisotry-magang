import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#1F5C4E",
        "accent-soft": "#E4EFEA",
        coral: "#B5502F",
        "coral-soft": "#F6E7E0",
        amber: "#8A5A10",
        "amber-soft": "#F7ECD9",
      },
    },
  },
  plugins: [],
};
export default config;
