// ResourcePopup.js
import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const ResourcePopup = ({ onClose }) => {
  const articles = [
    { title: 'Understanding and Managing Stress', link: 'https://www.psychologytoday.com/us/basics/stress' },
    { title: 'The Power of Mindfulness', link: 'https://www.mindful.org/meditation/mindfulness-getting-started/' },
    { title: 'Coping Mechanisms for Anxiety', link: 'https://www.healthline.com/health/mental-health/how-to-cope-with-anxiety' },
  ];

  const videos = [
    { title: '5-Minute Guided Meditation', link: 'https://www.youtube.com/watch?v=inpok4MKVLM' },
    { title: 'How to Practice Gratitude', link: 'https://www.youtube.com/watch?v=UtBsl3j0YRQ' },
    { title: 'The Science of Breathing', link: 'https://www.youtube.com/watch?v=_QTJOAI0UoU&t=44s' },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black bg-opacity-90" onClick={onClose}></div>
      
      <div className="relative bg-white text-black max-w-4xl w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="bg-black text-white p-6 md:p-8 relative">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <h3 className="text-3xl md:text-4xl font-black" style={{ 
            fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
          }}>
            RESOURCE LIBRARY
          </h3>
          <div className="w-16 h-1 bg-white mt-4"></div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Articles Section */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <span className="text-white font-black text-sm">A</span>
                </div>
                <h4 className="text-2xl font-black">ARTICLES</h4>
              </div>
              
              <div className="space-y-4">
                {articles.map((article, index) => (
                  <a 
                    key={index}
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group block border-2 border-gray-200 p-4 transition-all duration-300 hover:border-black hover:bg-black hover:text-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm md:text-base leading-tight">
                        {article.title}
                      </span>
                      <ExternalLink className="w-4 h-4 flex-shrink-0 ml-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Videos Section */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <span className="text-white font-black text-sm">V</span>
                </div>
                <h4 className="text-2xl font-black">VIDEOS</h4>
              </div>
              
              <div className="space-y-4">
                {videos.map((video, index) => (
                  <a 
                    key={index}
                    href={video.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group block border-2 border-gray-200 p-4 transition-all duration-300 hover:border-black hover:bg-black hover:text-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm md:text-base leading-tight">
                        {video.title}
                      </span>
                      <ExternalLink className="w-4 h-4 flex-shrink-0 ml-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ResourcePopup;
