/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sap: {
          blue: '#0070F2',
          darkblue: '#003B73',
          lightblue: '#E8F1FD',
          gray: '#F5F6F7',
          border: '#D9DBDD',
          text: '#32363A',
          subtext: '#6A6D70',
          success: '#107E3E',
          warning: '#E9730C',
          critical: '#BB0000',
          neutral: '#0854A0',
        },
      },
      fontFamily: {
        sans: ['"72"', '"72full"', 'Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
