import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  MessageCircle, 
  Heart, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Award,
  Target,
  Activity,
  Zap,
  Star,
  ArrowRight
} from 'lucide-react';
import GratitudeLog from './GratitudeLog';
import ResourcePopup from './ResourcePopup';
import MeditationPopup from './MeditationPopup';
import AIChatPopup from './AiChatPopup';
import MoodLogPopup from './MoodLogPopup';

const AdultsSection = () => {
  const [showMeditationPopup, setShowMeditationPopup] = useState(false);
  const [showResourcePopup, setShowResourcePopup] = useState(false);
  const [showGratitudeLog, setShowGratitudeLog] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showMoodLog, setShowMoodLog] = useState(false);
  const [dailyTip, setDailyTip] = useState('');
  const [userStats, setUserStats] = useState({
    meditationMinutes: 0,
    journalEntries: 0,
    moodAverage: 0
  });
  const [activeCarousel, setActiveCarousel] = useState(0);

  // Enhanced wellness tips
  const wellnessTips = [
    "DEEP BREATHING: Take 5 slow breaths to activate your parasympathetic nervous system",
    "GRATITUDE PRACTICE: List 3 specific things you appreciated today - rewire your brain for positivity",
    "HYDRATION BOOST: Water improves cognitive function and emotional regulation by 15%",
    "MOVEMENT THERAPY: A 10-minute walk increases focus and reduces stress hormones",
    "DIGITAL DETOX: Screen-free time before bed improves sleep quality by 40%",
    "MINDFUL MOMENT: Spend 2 minutes observing your thoughts without judgment",
    "PROGRESS CHECK: Celebrate small wins - they compound into major achievements"
  ];

  // Enhanced feature cards with better descriptions
  const featureCards = [
    {
      id: 1,
      title: "MOOD ANALYTICS",
      description: "Advanced emotional tracking with AI-powered insights into your mental patterns, triggers, and growth opportunities.",
      icon: Activity,
      category: "TRACKING",
      action: () => setShowMoodLog(true)
    },
    {
      id: 2,
      title: "GUIDED MEDITATION",
      description: "Curated meditation library with sessions for stress relief, focus enhancement, and emotional balance.",
      icon: Heart,
      category: "PRACTICE",
      action: () => setShowMeditationPopup(true)
    },
    {
      id: 3,
      title: "AI WELLNESS COACH",
      description: "24/7 intelligent support system providing personalized guidance and evidence-based interventions.",
      icon: MessageCircle,
      category: "SUPPORT",
      action: () => setShowAIChat(true)
    },
    {
      id: 4,
      title: "RESOURCE LIBRARY",
      description: "Expert-curated content on mental wellness, featuring cutting-edge research and practical strategies.",
      icon: BookOpen,
      category: "LEARNING",
      action: () => setShowResourcePopup(true)
    },
    {
      id: 5,
      title: "GRATITUDE ENGINE",
      description: "Daily gratitude practice with progress tracking to build resilience and positive neural pathways.",
      icon: Star,
      category: "GROWTH",
      action: () => setShowGratitudeLog(true)
    },
    {
      id: 6,
      title: "PROGRESS DASHBOARD",
      description: "Comprehensive analytics showing your wellness journey with detailed insights and milestone tracking.",
      icon: TrendingUp,
      category: "INSIGHTS",
      action: () => showProgressStats()
    }
  ];

  useEffect(() => {
    const randomTip = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];
    setDailyTip(randomTip);

    const savedStats = localStorage.getItem('userWellnessStats');
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }

    checkTodaysJournal();
  }, []);

  const checkTodaysJournal = () => {
    const lastJournalDate = localStorage.getItem('lastJournalDate');
    const today = new Date().toDateString();
    
    if (lastJournalDate !== today) {
      setTimeout(() => {
        if (window.confirm("Daily check-in reminder! Ready to log your mood and reflect?")) {
          setShowMoodLog(true);
        }
      }, 3000);
    }
  };

  const showProgressStats = () => {
    alert(`WELLNESS ANALYTICS SUMMARY:\n\n🧠 Total Meditation: ${userStats.meditationMinutes} minutes\n📊 Journal Entries: ${userStats.journalEntries}\n💪 Average Mood: ${userStats.moodAverage}/5\n\nConsistency builds transformation!`);
  };

  const handleCarouselNext = () => {
    setActiveCarousel((prev) => (prev + 1) % featureCards.length);
  };

  const handleCarouselPrev = () => {
    setActiveCarousel((prev) => (prev - 1 + featureCards.length) % featureCards.length);
  };

  const updateUserStats = (type, value) => {
    setUserStats(prev => {
      const newStats = {
        ...prev,
        [type]: prev[type] + value
      };
      localStorage.setItem('userWellnessStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Brain className="h-24 w-24 md:h-32 md:w-32 text-white animate-pulse" />
                <div className="absolute -top-2 -right-2">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6" style={{ 
              fontFamily: '"Helvetica Neue", "Arial Black", sans-serif',
              letterSpacing: '-0.02em'
            }}>
              WELLNESS HUB
            </h1>
            
            <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
            
            <p className="text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed mb-8">
              Your personalized mental wellness ecosystem. 
              <span className="font-black"> TRACK</span>, 
              <span className="font-black"> LEARN</span>, and 
              <span className="font-black"> TRANSFORM</span> your daily well-being.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Insight Banner */}
      <div className="bg-gray-100 border-y-4 border-black">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-wider mb-1">TODAY'S INSIGHT</div>
                <div className="text-lg font-medium max-w-2xl">{dailyTip}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black mb-4">YOUR PROGRESS</h2>
            <div className="w-16 h-1 bg-black mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-4 border-black p-8 text-center group hover:bg-black hover:text-white transition-all duration-300">
              <Heart className="w-12 h-12 mx-auto mb-4" />
              <div className="text-4xl font-black font-mono mb-2">{userStats.meditationMinutes}</div>
              <div className="text-sm font-black uppercase tracking-wider">MEDITATION MINUTES</div>
              <div className="text-xs mt-2 opacity-60">Building mindful habits</div>
            </div>
            
            <div className="border-4 border-black p-8 text-center group hover:bg-black hover:text-white transition-all duration-300">
              <BookOpen className="w-12 h-12 mx-auto mb-4" />
              <div className="text-4xl font-black font-mono mb-2">{userStats.journalEntries}</div>
              <div className="text-sm font-black uppercase tracking-wider">JOURNAL ENTRIES</div>
              <div className="text-xs mt-2 opacity-60">Tracking emotional growth</div>
            </div>
            
            <div className="border-4 border-black p-8 text-center group hover:bg-black hover:text-white transition-all duration-300">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <div className="text-4xl font-black font-mono mb-2">{userStats.moodAverage}</div>
              <div className="text-sm font-black uppercase tracking-wider">AVERAGE MOOD</div>
              <div className="text-xs mt-2 opacity-60">Out of 5.0 scale</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools & Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black mb-4">WELLNESS TOOLS</h2>
            <div className="w-16 h-1 bg-black mx-auto mb-6"></div>
            <p className="text-lg max-w-2xl mx-auto">
              Evidence-based tools designed to enhance your mental wellness journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={card.action}
                  className="bg-white border-4 border-gray-300 p-8 cursor-pointer transition-all duration-300 hover:border-black hover:shadow-2xl group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <IconComponent className="w-12 h-12 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-black bg-gray-100 px-3 py-1 group-hover:bg-black group-hover:text-white">
                      {card.category}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black mb-4 leading-tight">
                    {card.title}
                  </h3>
                  
                  <p className="text-sm leading-relaxed text-gray-600 mb-6">
                    {card.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold opacity-60">
                      INTERACTIVE TOOL
                    </div>
                    <div className="flex items-center space-x-2 text-sm font-black group-hover:underline">
                      <span>LAUNCH</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setShowMoodLog(true)}
              className="bg-white text-black px-6 py-3 font-black text-sm hover:bg-gray-200 transition-colors"
            >
              QUICK MOOD CHECK
            </button>
            <button
              onClick={() => setShowMeditationPopup(true)}
              className="bg-white text-black px-6 py-3 font-black text-sm hover:bg-gray-200 transition-colors"
            >
              5-MIN MEDITATION
            </button>
            <button
              onClick={() => setShowGratitudeLog(true)}
              className="bg-white text-black px-6 py-3 font-black text-sm hover:bg-gray-200 transition-colors"
            >
              GRATITUDE LOG
            </button>
            <button
              onClick={() => setShowAIChat(true)}
              className="bg-white text-black px-6 py-3 font-black text-sm hover:bg-gray-200 transition-colors"
            >
              AI SUPPORT
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Carousel (Enhanced for better UX) */}
      <div className="lg:hidden bg-white py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${activeCarousel * 100}%)` }}
              >
                {featureCards.map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <div key={card.id} className="w-full flex-shrink-0 px-2">
                      <div
                        className="border-4 border-black p-6 cursor-pointer"
                        onClick={card.action}
                      >
                        <div className="text-center">
                          <IconComponent className="h-12 w-12 mx-auto mb-4" />
                          <div className="text-xs font-black bg-gray-100 px-2 py-1 inline-block mb-3">
                            {card.category}
                          </div>
                          <h3 className="text-lg font-black mb-3">{card.title}</h3>
                          <p className="text-sm text-gray-600">{card.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button
              onClick={handleCarouselPrev}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black text-white p-3"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleCarouselNext}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black text-white p-3"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {featureCards.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveCarousel(index)}
                className={`w-2 h-2 transition-colors ${
                  index === activeCarousel ? 'bg-black' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Popup Components */}
      {showMeditationPopup && (
        <MeditationPopup 
          onClose={() => setShowMeditationPopup(false)} 
          onMeditationComplete={(minutes) => updateUserStats('meditationMinutes', minutes)}
        />
      )}
      {showResourcePopup && <ResourcePopup onClose={() => setShowResourcePopup(false)} />}
      {showGratitudeLog && (
        <GratitudeLog 
          onClose={() => setShowGratitudeLog(false)} 
          onEntryAdded={() => updateUserStats('journalEntries', 1)}
        />
      )}
      {showAIChat && <AIChatPopup onClose={() => setShowAIChat(false)} />}
      {showMoodLog && (
        <MoodLogPopup 
          onClose={() => setShowMoodLog(false)} 
          onMoodLogged={(moodScore) => {
            updateUserStats('journalEntries', 1);
            const newAverage = (userStats.moodAverage * userStats.journalEntries + moodScore) / (userStats.journalEntries + 1);
            setUserStats(prev => ({ ...prev, moodAverage: Math.round(newAverage * 10) / 10 }));
            localStorage.setItem('lastJournalDate', new Date().toDateString());
          }}
        />
      )}
    </div>
  );
};

export default AdultsSection;
