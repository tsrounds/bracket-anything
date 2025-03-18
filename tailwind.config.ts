import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in forwards'
      }
    },
  },
  plugins: [
    ({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) => {
      addUtilities({
        '.fixed-bottom-button': {
          '@apply absolute bottom-6 left-3 right-3': {}
        }
      })
    }
  ],
}

export default config 