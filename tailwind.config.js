/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#07070F',
          surface: '#0D0D1A',
          card: '#11111F',
          elevated: '#161628',
        },
        border: {
          DEFAULT: '#1E1E35',
          subtle: '#161628',
          strong: '#2A2A45',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#5355E8',
          light: '#818CF8',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          cyan: '#06B6D4',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#64748B',
        text: {
          DEFAULT: '#E2E8F0',
          muted: '#94A3B8',
          subtle: '#64748B',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        'gradient-card': 'linear-gradient(145deg, #11111F, #0D0D1A)',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(99,102,241,0.15)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
