/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'orange': '#FF8C00', // A nice shade of dark orange
        'ivory': '#f2f1e8',
        'dark-blue': '#050533',
        // --- Core Theme Colors ---
        'pastel-light': '#f2ede8ff', // Ivory: Primary background color for light mode.
        'pastel-dark': '#1C1C1C',  // Dark Blue: Primary text color in light mode, and background for dark mode.
        
        // --- Card & Section Colors ---
        'pastel-lavender': '#ff8559',  // Blue Grotto: Used for card backgrounds in light mode.
        'pastel-purple': '#888888',  // Dark Blue: Used for card backgrounds and navigation in dark mode.
        'card-bg-light': '#f2f1e8',  // Ivory: Used for the "more information" card background in light mode.
        'card-bg-dark': '#0d698b',   // Blue Grotto: Used for the "more information" card background in dark mode.
        
        // --- Button & Interaction Colors ---
        'pastel-peach': '#f2f1e8',  // Ivory: Used for button hover effects and secondary buttons.
        'pastel-pink': '#e34234',  // Cinnabar: Used for icon highlights and button accents.
        'pastel-blue': '#0d698b',  // Blue Grotto: Used for the Adults card button and AI support card backgrounds.
        'pastel-mint': '#0d698b',   // Blue Grotto: Used for the Kids card button and AI-powered approach section accents.

        // --- Border & Accent Colors ---
        'border-light': '#d0ab99', // Nude: A new color for borders in light mode.
        'border-dark': '#4b3c52',  // A new slightly lighter Ebony for borders in dark mode.
      },
    },
  },
  plugins: [],
}
