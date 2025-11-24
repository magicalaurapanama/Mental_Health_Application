// components/DigitalTwinDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Moon, 
  Sun, 
  Calendar, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Eye,
  ArrowRight,
  BarChart3,
  PieChart,
  LineChart,
  X
} from 'lucide-react';

const DigitalTwinDashboard = ({ userData, onClose }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedPattern, setSelectedPattern] = useState('overview');
  const [digitalTwinData, setDigitalTwinData] = useState(null);
  const [predictions, setPredictions] = useState([]);

  // Mock digital twin data - in real app, this would come from AI analysis
  useEffect(() => {
    // Simulate AI processing of user patterns
    const generateDigitalTwin = () => {
      return {
        currentState: {
          overallWellness: 73, // 0-100 scale
          stressLevel: 42,     // 0-100 scale
          moodStability: 68,   // 0-100 scale
          sleepQuality: 81,    // 0-100 scale
          energyLevel: 56      // 0-100 scale
        },
        patterns: {
          moodTrend: 'improving',    // improving, stable, declining
          stressPatterns: 'weekday-peaks',
          sleepConsistency: 'good',
          activityImpact: 'positive',
          socialEngagement: 'moderate'
        },
        triggers: [
          { name: 'Work Meetings', impact: 'high-stress', frequency: 'daily' },
          { name: 'Social Media', impact: 'mood-dip', frequency: 'evening' },
          { name: 'Exercise', impact: 'mood-boost', frequency: '3x-week' },
          { name: 'Poor Sleep', impact: 'energy-drop', frequency: 'weekends' }
        ],
        predictions: [
          {
            type: 'positive',
            title: 'Continued Improvement',
            description: 'Your mood trend shows consistent improvement over the next 2 weeks',
            confidence: 87,
            timeframe: '2 weeks',
            recommendation: 'Keep up your current meditation routine'
          },
          {
            type: 'warning',
            title: 'Stress Peak Expected',
            description: 'High stress period likely next Tuesday-Thursday based on your patterns',
            confidence: 79,
            timeframe: 'Next week',
            recommendation: 'Schedule extra self-care activities for midweek'
          },
          {
            type: 'opportunity',
            title: 'Sleep Optimization Window',
            description: 'Your sleep quality could improve significantly with small adjustments',
            confidence: 92,
            timeframe: '1 month',
            recommendation: 'Try moving bedtime 30 minutes earlier'
          }
        ],
        weeklyPattern: [
          { day: 'Mon', mood: 65, stress: 75, energy: 45, sleep: 70 },
          { day: 'Tue', mood: 62, stress: 85, energy: 40, sleep: 68 },
          { day: 'Wed', mood: 58, stress: 90, energy: 35, sleep: 65 },
          { day: 'Thu', mood: 64, stress: 80, energy: 50, sleep: 72 },
          { day: 'Fri', mood: 78, stress: 45, energy: 75, sleep: 85 },
          { day: 'Sat', mood: 85, stress: 25, energy: 80, sleep: 60 },
          { day: 'Sun', mood: 82, stress: 30, energy: 75, sleep: 65 }
        ]
      };
    };

    setDigitalTwinData(generateDigitalTwin());
    setPredictions(generateDigitalTwin().predictions);
  }, [userData]);

  const getWellnessColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getWellnessBackground = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getPatternIcon = (pattern) => {
    switch (pattern) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'stable': return <Activity className="w-5 h-5 text-blue-600" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const renderDigitalAvatar = () => {
    const wellness = digitalTwinData?.currentState.overallWellness || 0;
    
    return (
      <div className="text-center">
        <div className="relative mb-6">
          {/* Main Avatar Circle */}
          <div className={`w-32 h-32 mx-auto rounded-full border-8 flex items-center justify-center transition-all duration-1000 ${
            wellness >= 80 ? 'border-green-500 bg-green-50' :
            wellness >= 60 ? 'border-yellow-500 bg-yellow-50' :
            wellness >= 40 ? 'border-orange-500 bg-orange-50' :
            'border-red-500 bg-red-50'
          }`}>
            <Brain className={`w-16 h-16 ${getWellnessColor(wellness)}`} />
          </div>
          
          {/* Wellness Ring */}
          <div className="absolute inset-0 w-32 h-32 mx-auto">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - wellness / 100)}`}
                className={wellness >= 80 ? 'text-green-500' :
                          wellness >= 60 ? 'text-yellow-500' :
                          wellness >= 40 ? 'text-orange-500' :
                          'text-red-500'}
                strokeLinecap="round"
              />
            </svg>
          </div>
          
          {/* Status Indicators */}
          <div className="absolute -top-2 -right-2">
            {wellness >= 80 ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            ) : wellness >= 40 ? (
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-black mb-2">YOUR DIGITAL TWIN</h3>
        <div className="text-3xl font-black mb-2">{wellness}%</div>
        <p className="text-sm text-gray-600 mb-4">Overall Wellness Score</p>
        
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className={`p-3 rounded ${getWellnessBackground(digitalTwinData?.currentState.moodStability || 0)}`}>
            <Heart className={`w-5 h-5 mx-auto mb-1 ${getWellnessColor(digitalTwinData?.currentState.moodStability || 0)}`} />
            <div className="text-xs font-bold">MOOD</div>
            <div className="text-sm font-black">{digitalTwinData?.currentState.moodStability || 0}%</div>
          </div>
          <div className={`p-3 rounded ${getWellnessBackground(digitalTwinData?.currentState.stressLevel ? 100 - digitalTwinData.currentState.stressLevel : 0)}`}>
            <Shield className={`w-5 h-5 mx-auto mb-1 ${getWellnessColor(digitalTwinData?.currentState.stressLevel ? 100 - digitalTwinData.currentState.stressLevel : 0)}`} />
            <div className="text-xs font-bold">CALM</div>
            <div className="text-sm font-black">{digitalTwinData?.currentState.stressLevel ? 100 - digitalTwinData.currentState.stressLevel : 0}%</div>
          </div>
          <div className={`p-3 rounded ${getWellnessBackground(digitalTwinData?.currentState.sleepQuality || 0)}`}>
            <Moon className={`w-5 h-5 mx-auto mb-1 ${getWellnessColor(digitalTwinData?.currentState.sleepQuality || 0)}`} />
            <div className="text-xs font-bold">SLEEP</div>
            <div className="text-sm font-black">{digitalTwinData?.currentState.sleepQuality || 0}%</div>
          </div>
          <div className={`p-3 rounded ${getWellnessBackground(digitalTwinData?.currentState.energyLevel || 0)}`}>
            <Zap className={`w-5 h-5 mx-auto mb-1 ${getWellnessColor(digitalTwinData?.currentState.energyLevel || 0)}`} />
            <div className="text-xs font-bold">ENERGY</div>
            <div className="text-sm font-black">{digitalTwinData?.currentState.energyLevel || 0}%</div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyPattern = () => {
    const maxValue = Math.max(...digitalTwinData.weeklyPattern.map(day => 
      Math.max(day.mood, day.stress, day.energy, day.sleep)
    ));

    return (
      <div className="space-y-6">
        <h4 className="text-lg font-black text-center">YOUR WEEKLY PATTERN</h4>
        
        {/* Visual Chart */}
        <div className="bg-gray-50 p-6 rounded">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {digitalTwinData.weeklyPattern.map((day, index) => (
              <div key={day.day} className="text-center">
                <div className="text-xs font-bold mb-2">{day.day.toUpperCase()}</div>
                
                {/* Mood Bar */}
                <div className="mb-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(day.mood / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-purple-600 font-bold">{day.mood}</div>
                </div>
                
                {/* Stress Bar (inverted - lower is better) */}
                <div className="mb-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(day.stress / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-red-600 font-bold">{day.stress}</div>
                </div>
                
                {/* Energy Bar */}
                <div className="mb-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(day.energy / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 font-bold">{day.energy}</div>
                </div>
                
                {/* Sleep Bar */}
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(day.sleep / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-blue-600 font-bold">{day.sleep}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="font-bold">MOOD</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="font-bold">STRESS</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="font-bold">ENERGY</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="font-bold">SLEEP</span>
            </div>
          </div>
        </div>

        {/* Pattern Insights */}
        <div className="space-y-3">
          <h5 className="font-black">WHAT YOUR PATTERN SHOWS:</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <TrendingDown className="w-4 h-4 text-red-500 mt-0.5" />
              <span><strong>Monday-Wednesday:</strong> Stress builds up, energy drops</span>
            </div>
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
              <span><strong>Thursday-Friday:</strong> Mood improves, stress reduces</span>
            </div>
            <div className="flex items-start space-x-2">
              <Sun className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span><strong>Weekends:</strong> High mood but poor sleep pattern</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTriggerAnalysis = () => {
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-black text-center">TRIGGER ANALYSIS</h4>
        <p className="text-sm text-gray-600 text-center">
          Your digital twin has identified patterns that affect your mental health
        </p>
        
        <div className="space-y-3">
          {digitalTwinData?.triggers.map((trigger, index) => (
            <div key={index} className="border-2 border-gray-200 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-black">{trigger.name}</h5>
                <div className={`text-xs px-2 py-1 rounded font-bold ${
                  trigger.impact.includes('stress') ? 'bg-red-100 text-red-700' :
                  trigger.impact.includes('dip') ? 'bg-orange-100 text-orange-700' :
                  trigger.impact.includes('boost') ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {trigger.impact.toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Frequency: {trigger.frequency}</span>
                <div className="flex items-center space-x-1">
                  {trigger.impact.includes('boost') ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  )}
                  <span className="font-medium">
                    {trigger.impact.includes('boost') ? 'Positive Impact' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-black text-center">FUTURE PREDICTIONS</h4>
        <p className="text-sm text-gray-600 text-center">
          AI analysis of your patterns suggests these likely outcomes
        </p>
        
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className={`border-2 p-4 rounded ${
              prediction.type === 'positive' ? 'border-green-500 bg-green-50' :
              prediction.type === 'warning' ? 'border-orange-500 bg-orange-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  prediction.type === 'positive' ? 'bg-green-500' :
                  prediction.type === 'warning' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}>
                  {prediction.type === 'positive' ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : prediction.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-white" />
                  ) : (
                    <Target className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h5 className="font-black mb-1">{prediction.title}</h5>
                  <p className="text-sm mb-3">{prediction.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs">
                      <span className="font-bold">Confidence: </span>
                      <span className={`font-black ${
                        prediction.confidence >= 80 ? 'text-green-600' :
                        prediction.confidence >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {prediction.confidence}%
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold">Timeline: </span>
                      <span>{prediction.timeframe}</span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded text-sm ${
                    prediction.type === 'positive' ? 'bg-green-100' :
                    prediction.type === 'warning' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    <strong>Recommendation:</strong> {prediction.recommendation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!digitalTwinData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-black mb-2">CREATING YOUR DIGITAL TWIN</h3>
          <p className="text-gray-600">Analyzing your mental health patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ 
                fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
              }}>
                DIGITAL TWIN ANALYSIS
              </h2>
              <p className="text-sm opacity-80">AI-Powered Mental Health Patterns</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b-2 border-gray-200">
          <div className="flex">
            {[
              { id: 'overview', name: 'OVERVIEW', icon: Eye },
              { id: 'patterns', name: 'WEEKLY PATTERN', icon: BarChart3 },
              { id: 'triggers', name: 'TRIGGERS', icon: Target },
              { id: 'predictions', name: 'PREDICTIONS', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedPattern(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 font-bold text-sm transition-all ${
                  selectedPattern === tab.id 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Digital Twin Avatar - Always Visible */}
            <div className="lg:col-span-1">
              {renderDigitalAvatar()}
            </div>
            
            {/* Dynamic Content */}
            <div className="lg:col-span-2">
              {selectedPattern === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black">MENTAL HEALTH OVERVIEW</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-black mb-2">CURRENT TREND</h4>
                      <div className="flex items-center space-x-2">
                        {getPatternIcon(digitalTwinData.patterns.moodTrend)}
                        <span className="font-medium capitalize">
                          {digitalTwinData.patterns.moodTrend.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-black mb-2">SLEEP CONSISTENCY</h4>
                      <div className="flex items-center space-x-2">
                        <Moon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium capitalize">
                          {digitalTwinData.patterns.sleepConsistency}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded">
                    <h4 className="font-black mb-2">WHAT THIS MEANS:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Your overall mental health is in the <strong>good range</strong></li>
                      <li>• Mood has been <strong>consistently improving</strong> over recent weeks</li>
                      <li>• Sleep quality is <strong>above average</strong> but could be optimized</li>
                      <li>• Midweek stress patterns are <strong>predictable and manageable</strong></li>
                    </ul>
                  </div>
                </div>
              )}
              
              {selectedPattern === 'patterns' && renderWeeklyPattern()}
              {selectedPattern === 'triggers' && renderTriggerAnalysis()}
              {selectedPattern === 'predictions' && renderPredictions()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t-2 border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="bg-black text-white px-6 py-3 font-black text-sm hover:bg-gray-800 transition-colors">
              UPDATE PREFERENCES
            </button>
            <button className="border-2 border-black text-black px-6 py-3 font-black text-sm hover:bg-gray-100 transition-colors">
              DOWNLOAD REPORT
            </button>
            <button className="border-2 border-black text-black px-6 py-3 font-black text-sm hover:bg-gray-100 transition-colors">
              SHARE WITH THERAPIST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinDashboard;
