/** @type {import('tailwindcss').Config} */
import tailwindTokens from '../template/tailwind-token.json';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Use tokens from tailwind-token.json
      ...tailwindTokens.extend,
    },
    // Top-level color definitions from tailwind-token.json
    backgroundColor: tailwindTokens.backgroundColor,
    textColor: tailwindTokens.textColor,
    borderColor: tailwindTokens.borderColor,
  },
  plugins: [],
}
