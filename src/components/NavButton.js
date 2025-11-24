import React from 'react';

const NavButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-2 p-3 rounded-lg hover:bg-pastel-lavender transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pastel-purple"
  >
    <span className="text-pastel-dark group-hover:text-pastel-purple">{icon}</span>
    <span className="hidden sm:inline text-pastel-dark font-semibold">{label}</span>
  </button>
);

export default NavButton;
