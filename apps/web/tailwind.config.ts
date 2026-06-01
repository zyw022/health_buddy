import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        treehouse: {
          wood: '#8B5E3C',
          roof: '#5D4037',
          leaf: '#4CAF50',
          sky: '#E3F2FD',
          warm: '#FFF8E1',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      keyframes: {
        doorOpen: {
          '0%': { transform: 'perspective(800px) rotateY(0deg)' },
          '100%': { transform: 'perspective(800px) rotateY(-110deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        typewriter: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        blink: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: 'currentColor' },
        },
      },
      animation: {
        'door-open': 'doorOpen 1.2s ease-in-out forwards',
        float: 'float 3s ease-in-out infinite',
        typewriter: 'typewriter 1.5s steps(30) forwards',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;
