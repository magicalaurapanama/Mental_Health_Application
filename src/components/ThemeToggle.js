import React, { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors duration-300 transform-gpu
                 
                 text-pastel-dark dark:text-pastel-dark
                 focus:outline-none focus:ring-2 focus:ring-pastel-dark dark:focus:ring-pastel-light"
      aria-label="Toggle dark and light mode"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
