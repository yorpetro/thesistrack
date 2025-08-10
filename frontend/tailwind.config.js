/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#03B5AA',
          50: '#e6fbf9',
          100: '#ccf7f3',
          200: '#99efe8',
          300: '#66e7dc',
          400: '#33dfd1',
          500: '#03B5AA',
          600: '#029e94',
          700: '#02867d',
          800: '#016e67',
          900: '#015650',
        },
        secondary: {
          DEFAULT: '#023436',
          light: '#035c5f',
          dark: '#01191a',
        },
        accent: {
          DEFAULT: '#3083DC',
          light: '#5599e3',
          dark: '#1b6bc3',
        },
        neutral: {
          DEFAULT: '#D8D4D5',
          light: '#e6e3e4',
          dark: '#bbb6b7',
        },
        earth: {
          DEFAULT: '#816F68',
          light: '#9a8a84',
          dark: '#68594e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'custom-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'custom': '0.5rem',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#023436', // secondary color
            a: {
              color: '#3083DC', // accent color
              '&:hover': {
                color: '#1b6bc3', // accent-dark color
              },
            },
            h1: {
              color: '#023436',
            },
            h2: {
              color: '#023436',
            },
            h3: {
              color: '#023436',
            },
            h4: {
              color: '#023436',
            },
            strong: {
              color: '#023436',
            },
            code: {
              color: '#023436',
              backgroundColor: '#e6e3e4', // neutral-light color
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 