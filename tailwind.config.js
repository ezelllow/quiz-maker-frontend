/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // QuizQuest palette — referenced as bg-quiz-green, text-quiz-cyan, etc.
        quiz: {
          green:        '#4ade80',
          'green-dark': '#22c55e',
          'green-shadow':'#16a34a',
          blue:         '#38bdf8',
          'blue-dark':  '#0ea5e9',
          red:          '#fb7185',
          'red-dark':   '#f43f5e',
          yellow:       '#fbbf24',
          purple:       '#c084fc',
          orange:       '#fb923c',
          pink:         '#f472b6',
          cyan:         '#22d3ee',
          magenta:      '#e879f9',
          lime:         '#a3e635',
          bg:           '#0a0a1f',
          'bg-2':       '#14142b',
          text:         '#e9e9ff',
          muted:        '#9d9dbf',
        },
      },
    },
  },
  plugins: [],
}
