import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f5ff',
          magenta: '#ff00ff',
          green: '#39ff14',
          yellow: '#ffff00',
          red: '#ff073a',
          purple: '#bf00ff',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00f5ff, 0 0 20px #00f5ff, 0 0 40px #00f5ff',
        'neon-magenta': '0 0 5px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff',
        'neon-green': '0 0 5px #39ff14, 0 0 20px #39ff14, 0 0 40px #39ff14',
        'neon-red': '0 0 5px #ff073a, 0 0 20px #ff073a, 0 0 40px #ff073a',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'card-deal': 'cardDeal 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px #00f5ff, 0 0 10px #00f5ff' },
          '100%': { textShadow: '0 0 20px #00f5ff, 0 0 40px #00f5ff, 0 0 80px #00f5ff' },
        },
        cardDeal: {
          '0%': { transform: 'translateY(-100px) rotateY(180deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
