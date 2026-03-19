/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        deepSpace: '#020205',
        neonCyan: '#00ffff',
        voltagePurple: '#7f00ff',
        neonPink: '#ff00ff',
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate',
        glitch: 'glitch 3s infinite',
        scanline: 'scanline 8s linear infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff' },
          '100%': { textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 80px #00ffff' },
        },
        glitch: {
          '0%, 90%, 100%': { transform: 'translate(0)', clipPath: 'none' },
          '92%': { transform: 'translate(-2px, 1px)', clipPath: 'polygon(0 15%, 100% 15%, 100% 30%, 0 30%)' },
          '94%': { transform: 'translate(2px, -1px)', clipPath: 'polygon(0 60%, 100% 60%, 100% 75%, 0 75%)' },
          '96%': { transform: 'translate(-1px, 2px)', clipPath: 'polygon(0 40%, 100% 40%, 100% 55%, 0 55%)' },
          '98%': { transform: 'translate(1px, -2px)', clipPath: 'none' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, inset 0 0 5px rgba(0,255,255,0.1)' },
          '50%': { boxShadow: '0 0 10px #00ffff, 0 0 25px #00ffff, 0 0 50px #00ffff, inset 0 0 10px rgba(0,255,255,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)',
        'neon-gradient': 'linear-gradient(135deg, #00ffff 0%, #7f00ff 50%, #ff00ff 100%)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
}
