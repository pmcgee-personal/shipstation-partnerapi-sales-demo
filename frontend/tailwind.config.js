/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'header-blue': '#2A4350', // Dark teal from your header screenshot
        'table-header': '#F0F2F5', // Light grey for the table header
        'link-blue': '#00529B',    // Blue for the carrier links
      }
    },
  },
  plugins: [],
}

