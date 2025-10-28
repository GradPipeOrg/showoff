import { fontFamily } from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Based on Apex 'slate' palette
        'bg-primary': '#0f172a',    // slate-900
        'bg-secondary': '#1e293b',  // slate-800
        'bg-tertiary': '#334155',    // slate-700
        'bg-accent': '#475569',      // slate-600

        // Based on Apex 'text' palette
        'text-primary': '#ffffff',
        'text-secondary': '#f1f5f9', // slate-100
        'text-muted': '#cbd5e1',     // slate-300
        'text-subtle': '#94a3b8',   // slate-400
        'text-disabled': '#64748b',   // slate-500

        // Based on Apex 'accent' palette
        'accent-primary': '#4f46e5',   // indigo-600
        'accent-hover': '#4338ca',     // indigo-700
        'accent-focus': '#6366f1',     // indigo-500
        'accent-violet': '#7c3aed',     // violet-600
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      // NEW: Keyframes for the 'aurora' background
      keyframes: {
        'aurora-fg': {
          '0%, 100%': { backgroundPosition: '0% 50%', opacity: 0.3 },
          '50%': { backgroundPosition: '100% 50%', opacity: 0.5 },
        },
        'aurora-bg': {
          '0%, 100%': { backgroundPosition: '100% 50%', opacity: 0.1 },
          '50%': { backgroundPosition: '0% 50%', opacity: 0.2 },
        },
      },
      // NEW: Animation classes to use the keyframes
      animation: {
        'aurora-fg': 'aurora-fg 20s linear infinite',
        'aurora-bg': 'aurora-bg 30s linear infinite alternate',
      },
    },
  },
  plugins: [],
}
