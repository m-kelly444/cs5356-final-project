import { useState, useEffect } from 'react';
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'cyber-blue': {
          DEFAULT: '#00BFFF',
          '50': '#E6F9FF',
          '100': '#CCF3FF',
          '200': '#99E6FF',
          '300': '#66DAFF',
          '400': '#33CDFF',
          '500': '#00BFFF',
          '600': '#0099CC',
          '700': '#007399',
          '800': '#004C66',
          '900': '#002633',
        },
        'cyber-pink': {
          DEFAULT: '#FF00FF',
          '50': '#FFEBFF',
          '100': '#FFD6FF',
          '200': '#FFADFF',
          '300': '#FF85FF',
          '400': '#FF5CFF',
          '500': '#FF00FF',
          '600': '#CC00CC',
          '700': '#990099',
          '800': '#660066',
          '900': '#330033',
        },
        'cyber-green': {
          DEFAULT: '#00FF66',
          '50': '#EBFFE6',
          '100': '#D6FFCC',
          '200': '#ADFF99',
          '300': '#85FF66',
          '400': '#5CFF33',
          '500': '#00FF66',
          '600': '#00CC52',
          '700': '#00993D',
          '800': '#006629',
          '900': '#003314',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "glow": {
          "0%, 100%": { 
            boxShadow: "0 0 5px rgba(0, 255, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3)" 
          },
          "50%": { 
            boxShadow: "0 0 10px rgba(0, 255, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.5)" 
          },
        },
        "scan": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(100%)" },
        },
        "blink": {
          "0%, 49%": { opacity: 1 },
          "50%, 100%": { opacity: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s infinite",
        "scan": "scan 5s linear infinite",
        "blink": "blink 1s infinite",
      },
      fontFamily: {
        cyber: ["'Rajdhani'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        'neon-blue': '0 0 5px rgba(0, 191, 255, 0.5), 0 0 10px rgba(0, 191, 255, 0.3)',
        'neon-pink': '0 0 5px rgba(255, 0, 255, 0.5), 0 0 10px rgba(255, 0, 255, 0.3)',
        'neon-green': '0 0 5px rgba(0, 255, 102, 0.5), 0 0 10px rgba(0, 255, 102, 0.3)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
