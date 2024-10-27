/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "navy-blue": "#0a192f"
      },
      fontFamily: {
        "NTR": ["NTR", "serif"]
      }
    },
  },
  plugins: [],
}

