/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        aeonik: [
          'Aeonik',
          'sans-serif',
        ],
      },
      colors: {
        lunestBlue: '#010135',
        accessBlue: '#3f4062ff',
        reserveBtn: '#000CDFB2',
      },
    },
  },
};
