import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#060e1a',
        navy2: '#0a1628',
        navy3: '#0f2040',
        blue: '#1a3a6b',
        cyan: '#00d4ff',
        cyan2: '#00aacc',
        muted: '#5c7a9e',
        muted2: '#3a5a7a',
        success: '#00e5a0',
        danger: '#ff4d6a',
        amber: '#ffb830',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
