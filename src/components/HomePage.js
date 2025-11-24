import React from 'react';
import { Brain, Gamepad2, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      
      {/* Hero Section */}
      <section className="px-6 md:px-8 py-16 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-8" style={{ 
            fontFamily: '"Helvetica Neue", "Arial Black", sans-serif',
            letterSpacing: '-0.02em'
          }}>
            MINDOASIS
          </h1>
          
          <div className="w-24 h-1 bg-black mx-auto mb-8"></div>
          
          <p className="text-xl md:text-2xl font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            Your sanctuary for mental wellbeing. Specialized resources for both adults and children.
          </p>

          <div className="w-32 h-32 bg-black mx-auto mb-12 flex items-center justify-center">
            <Brain className="w-16 h-16 text-white" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-6 md:px-8 py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6" style={{ 
              fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
            }}>
              CHOOSE YOUR PATH
            </h2>
            <div className="w-16 h-1 bg-white mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Adults Card */}
            <Link to="/auth" className="group block">
              <div className="border-2 border-white p-8 md:p-12 hover:bg-white hover:text-black transition-all duration-300">
                
                <div className="flex items-center justify-between mb-8">
                  <Users className="w-16 h-16" />
                  <span className="text-8xl font-black opacity-20">01</span>
                </div>
                
                <h3 className="text-3xl font-black mb-6">FOR ADULTS</h3>
                
                <p className="text-lg mb-8 leading-relaxed">
                  Personalized mental health support with mood tracking, meditation, 
                  and AI-powered guidance for stress management and emotional wellbeing.
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>Mood Tracking & Journaling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>Guided Meditation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>AI Wellness Coach</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>Resource Library</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 font-bold text-sm tracking-wider group-hover:underline">
                  <span>GET STARTED</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Kids Card */}
            <Link to="/auth" className="group block">
              <div className="border-2 border-white p-8 md:p-12 hover:bg-white hover:text-black transition-all duration-300">
                
                <div className="flex items-center justify-between mb-8">
                  <Gamepad2 className="w-16 h-16" />
                  <span className="text-8xl font-black opacity-20">02</span>
                </div>
                
                <h3 className="text-3xl font-black mb-6">FOR KIDS</h3>
                
                <p className="text-lg mb-8 leading-relaxed">
                  Fun and educational games designed to improve focus, memory, 
                  and cognitive skills for children with ADHD and dyslexia.
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>Memory Training Games</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>Focus Enhancement</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>Cognitive Puzzles</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-current"></div>
                    <span>Learning Rewards</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 font-bold text-sm tracking-wider group-hover:underline">
                  <span>GET STARTED</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-8 py-16">
        <div className="max-w-7xl mx-auto text-center">
          
          <h2 className="text-3xl md:text-5xl font-black mb-8" style={{ 
            fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
          }}>
            AI-POWERED WELLNESS
          </h2>
          
          <div className="w-16 h-1 bg-black mx-auto mb-12"></div>
          
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-16 leading-relaxed text-gray-600">
            Advanced AI technology provides personalized insights and support 
            for your mental wellness journey.
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-black mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-black text-2xl">AI</span>
              </div>
              <h3 className="text-xl font-black mb-4">SMART ADAPTATION</h3>
              <p className="text-gray-600">
                Learns from your patterns and preferences to provide 
                increasingly personalized support.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-black mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-black text-2xl">24/7</span>
              </div>
              <h3 className="text-xl font-black mb-4">ALWAYS AVAILABLE</h3>
              <p className="text-gray-600">
                Round-the-clock support whenever you need guidance 
                or someone to talk to.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-black mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-black text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-black mb-4">PRIVATE & SECURE</h3>
              <p className="text-gray-600">
                Your data is completely private and secure. 
                We prioritize your confidentiality above all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-8 py-12 border-t-2 border-black">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-bold tracking-wider text-gray-600">
            © 2025 MINDOASIS — TRANSFORMING MENTAL WELLNESS THROUGH TECHNOLOGY
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
