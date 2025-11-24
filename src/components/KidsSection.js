// KidsSection.js
import React from 'react';
import { Gamepad2, Star, Brain, Target } from 'lucide-react'; // Added Target to imports
import MemoryGame from './MemoryGame';

const KidsSection = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <div className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-800"></div>
        
        <div className="relative px-6 md:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Gamepad2 className="h-24 w-24 md:h-32 md:w-32 text-white animate-pulse" />
                <div className="absolute -top-2 -right-2">
                  <Star className="h-8 w-8 text-white animate-spin-slow" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6" style={{ 
              fontFamily: '"Helvetica Neue", "Arial Black", sans-serif',
              letterSpacing: '-0.02em'
            }}>
              KIDS ZONE
            </h1>
            
            <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
            
            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
              Welcome to the playground! Fun games designed to boost 
              <span className="font-black"> FOCUS</span> and 
              <span className="font-black"> LEARNING</span>
            </p>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-white via-gray-300 to-white"></div>
      </div>

      {/* Features Section */}
      <div className="px-6 md:px-8 py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black mb-2">MEMORY BOOST</h3>
              <p className="text-sm text-gray-600">Strengthen cognitive abilities</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black mb-2">FOCUS TRAINING</h3>
              <p className="text-sm text-gray-600">Improve concentration skills</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black mb-2">FUN LEARNING</h3>
              <p className="text-sm text-gray-600">Engaging educational experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Section */}
      <div className="px-6 md:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <MemoryGame />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default KidsSection;
