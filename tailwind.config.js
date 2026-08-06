/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Special Elite'", 'Georgia', 'serif'],
        body: ["'Inter'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Courier New'", 'monospace'],
      },
      colors: {
        uc: {
          bg: '#1A1A2E',
          surface: '#16213E',
          'surface-2': '#1D2A4D',
          paper: '#F6E8C3',
          'paper-2': '#EFDDAE',
          'paper-shadow': '#E3CE97',
          gold: '#D4AF37',
          'gold-dark': '#B3922B',
          danger: '#D83A3A',
          'danger-dark': '#B22E2E',
          success: '#2ECC71',
          ink: '#2E2618',
          'ink-soft': '#6B5D3F',
          sticky: '#FFE888',
          string: '#C0392B',
        },
      },
      borderRadius: {
        uc: '8px',
        'uc-2': '16px',
        'uc-3': '24px',
        'uc-4': '32px',
      },
      boxShadow: {
        'uc-soft': '0 2px 8px rgba(0,0,0,.25)',
        'uc-large': '0 12px 32px rgba(0,0,0,.4)',
        'uc-warm': '0 8px 24px rgba(212,175,55,.18)',
        'uc-paper': '0 3px 10px rgba(20,16,4,.28), 0 1px 2px rgba(20,16,4,.2)',
        'uc-paper-lifted': '0 10px 28px rgba(20,16,4,.35), 0 2px 6px rgba(20,16,4,.22)',
        'uc-gold-glow': '0 0 0 2px rgba(212,175,55,.35), 0 0 24px rgba(212,175,55,.25)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'stamp-slam': {
          '0%': { opacity: '0', transform: 'scale(3) rotate(-14deg)' },
          '60%': { opacity: '1', transform: 'scale(0.95) rotate(-14deg)' },
          '80%': { transform: 'scale(1.02) rotate(-14deg)' },
          '100%': { transform: 'scale(1) rotate(-14deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(.25,.7,.35,1) both',
        'stamp-slam': 'stamp-slam 0.5s cubic-bezier(.25,.7,.35,1) both',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'confetti': 'confetti-fall 3s ease-in forwards',
      },
    },
  },
  plugins: [],
}
